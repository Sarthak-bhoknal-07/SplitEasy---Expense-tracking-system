import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import Navbar from './components/Navbar';
import {useEffect, useState} from 'react';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const logOut = () => {
    localStorage.removeItem("user");
    setCurrentUser(undefined);
    window.location.href = "/login";
  };

  return (
    <Router>
      <div>
        <Navbar currentUser={currentUser} logOut={logOut} />
        <div className="container mt-3">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/home" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/groups/:id" element={<GroupDetails />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
