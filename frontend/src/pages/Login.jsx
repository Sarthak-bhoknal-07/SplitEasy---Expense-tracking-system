import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
        window.location.href = "/home"; // Force reload to update navbar
      }
    } catch (error) {
      setMessage("Invalid email or password");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                 <h2 className="fw-bold">Welcome Back</h2>
                 <p className="text-muted">Sign in to manage your expenses</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="form-group mb-3">
                  <label className="small text-muted mb-1">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="small text-muted mb-1">Password</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button className="btn btn-primary btn-lg w-100 shadow-sm">
                  Login
                </button>

                {message && (
                  <div className="alert alert-danger mt-4 small" role="alert">
                    {message}
                  </div>
                )}
              </form>
              <div className="text-center mt-4">
                <p className="small text-muted">Don't have an account? <a href="/register" className="text-primary text-decoration-none fw-bold">Sign Up</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
