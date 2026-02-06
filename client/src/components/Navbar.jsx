import { Link } from 'react-router-dom';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and Title */}
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-logo">
            <svg
              width="24"
              height="24"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="navbar-title">IAFDS</h1>
        </Link>

        {/* Right side - User info and actions */}
        <div className="navbar-actions">
          {/* Notifications */}
          <button className="notification-icon" title="Notifications">
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>

          {/* User Menu */}
          <div className="navbar-user">
            <div className="navbar-avatar">
              <User size={16} />
            </div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user?.name || 'Admin User'}</span>
              <span className="navbar-user-role">{user?.role || 'Administrator'}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="notification-icon"
              title="Logout"
              style={{ color: 'var(--danger-color)' }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
