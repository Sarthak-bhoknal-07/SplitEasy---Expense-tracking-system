import React from 'react';
import {Link} from 'react-router-dom';

const Navbar = ({ currentUser, logOut }) => {
  return (
    <nav className="navbar navbar-expand navbar-light bg-white border-bottom sticky-top py-3 mb-4">
      <div className="container">
        <Link to={"/"} className="navbar-brand d-flex align-items-center">
          <span className="me-2 text-primary h4 mb-0"><i className="bi bi-wallet2"></i></span>
          <span className="fw-bold h4 mb-0 text-primary">SplitEasy</span>
        </Link>

        <div className="navbar-nav me-auto">
          {currentUser && (
            <li className="nav-item ms-3">
              <Link to={"/home"} className="nav-link fw-bold text-secondary">
                Dashboard
              </Link>
            </li>
          )}
        </div>

        {currentUser ? (
          <div className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
               <span className="nav-link text-dark me-3 small fw-medium">
                 <i className="bi bi-person-circle me-1"></i> {currentUser.name}
               </span>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-danger btn-sm px-3" onClick={logOut}>
                Logout
              </button>
            </li>
          </div>
        ) : (
          <div className="navbar-nav ms-auto gap-2">
            <li className="nav-item">
              <Link to={"/login"} className="nav-link text-dark fw-medium">
                Login
              </Link>
            </li>
            <li className="nav-item">
              <Link to={"/register"} className="btn btn-primary btn-sm px-4">
                Sign Up
              </Link>
            </li>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
