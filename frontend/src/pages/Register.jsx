import React, {useState} from "react";
import api from "../services/api";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [successful, setSuccessful] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });
      setSuccessful(true);
      setMessage("Registration successful! Please login.");
    } catch (error) {
      setMessage("Registration failed. Email might be in use.");
      setSuccessful(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                 <h2 className="fw-bold">Create Your Account</h2>
                 <p className="text-muted">Start tracking shared expenses today</p>
              </div>
              <form onSubmit={handleRegister}>
                {!successful && (
                  <div>
                    <div className="form-group mb-3">
                      <label className="small text-muted mb-1">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

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
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button className="btn btn-primary btn-lg w-100 shadow-sm">
                       Join SplitEasy
                    </button>
                  </div>
                )}

                {message && (
                  <div className="form-group">
                    <div
                      className={
                        successful ? "alert alert-success mt-4 small" : "alert alert-danger mt-4 small"
                      }
                      role="alert"
                    >
                      {message}
                    </div>
                  </div>
                )}
              </form>
              <div className="text-center mt-4">
                <p className="small text-muted">Already have an account? <a href="/login" className="text-primary text-decoration-none fw-bold">Login</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
