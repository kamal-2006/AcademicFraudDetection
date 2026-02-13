import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

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

        {/* Right side - User actions */}
        <div className="navbar-actions">
          {/* Notifications */}
          <button className="navbar-icon-btn" title="Notifications">
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="profile-dropdown-container" ref={dropdownRef}>
            <button 
              className="navbar-icon-btn" 
              title="Profile"
              onClick={toggleProfileDropdown}
            >
              <User size={20} />
            </button>

            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    <User size={16} />
                  </div>
                  <div className="profile-info">
                    <div className="profile-name">{user?.name || 'User'}</div>
                    <div className="profile-email">{user?.email || 'user@example.com'}</div>
                  </div>
                </div>
                <div className="profile-dropdown-divider"></div>
                <div className="profile-dropdown-item">
                  <span className="profile-label">Role</span>
                  <span className={`profile-role-badge ${user?.role}`}>
                    {user?.role === 'admin' ? 'Admin' : 'Faculty'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="navbar-icon-btn logout-btn"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
