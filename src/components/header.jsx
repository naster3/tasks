import React from 'react';
import { Link } from 'react-router-dom'; // Usamos Link de react-router-dom
import './header.css'
const Header = () => {
  return (
    <header>
      <div className="header-content">
        <div className="logo">
          <Link to="/"> 
            <h1>DevNaster</h1>
          </Link>
        </div>
        <div className="menu">
          <nav>
            <ul>
              <li>
                <Link to="/guide">
                  <i className="fas fa-headset"></i> ayuda
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div id="icon-menu">
        <i className="bi bi-justify"></i>
      </div>
    </header>
  );
};

export default Header;
