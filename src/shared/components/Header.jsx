import { Link } from 'react-router-dom';
import { FiHelpCircle } from 'react-icons/fi';
import './Header.css';

const Header = () => {
  return (
    <header className="site-header">
      <div className="header-content">
        <div className="logo">
          <Link to="/" aria-label="DevNaster inicio">
            <span className="logo-mark">DN</span>
            <span className="logo-text">DevNaster</span>
          </Link>
        </div>
        <nav className="nav">
          <Link className="nav-link" to="/guide">
            <FiHelpCircle aria-hidden="true" />
            Guia
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
