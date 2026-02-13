import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import '../styles/Profile.css';

const Profile = () => {
  const { user, logout, loading } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (loading || localLoading) {
    return <Loading fullScreen message="Loading profile..." />;
  }

  if (!user) {
    return (
      <div className="profile-container">
        <Card>
          <div className="empty-state">
            <User size={64} className="empty-icon" />
            <h2>No Profile Found</h2>
            <p>Please login to view your profile.</p>
          </div>
        </Card>
      </div>
    );
  }

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'badge-admin';
      case 'faculty':
        return 'badge-faculty';
      default:
        return 'badge-default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <Button variant="danger" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </Button>
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <Card className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <User size={48} />
            </div>
            <div className="avatar-info">
              <h2 className="avatar-name">{user.name}</h2>
              <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                <Shield size={14} />
                {user.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="profile-divider"></div>

          <div className="profile-details">
            <div className="detail-row">
              <div className="detail-label">
                <User size={18} />
                <span>User ID</span>
              </div>
              <div className="detail-value">{user.id || user._id}</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">
                <User size={18} />
                <span>Full Name</span>
              </div>
              <div className="detail-value">{user.name}</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">
                <Mail size={18} />
                <span>Email Address</span>
              </div>
              <div className="detail-value">{user.email}</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">
                <Shield size={18} />
                <span>Role</span>
              </div>
              <div className="detail-value">
                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            {user.createdAt && (
              <div className="detail-row">
                <div className="detail-label">
                  <Calendar size={18} />
                  <span>Member Since</span>
                </div>
                <div className="detail-value">{formatDate(user.createdAt)}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Additional Info Card */}
        <Card className="info-card">
          <h3 className="info-title">Account Information</h3>
          <div className="info-list">
            <div className="info-item">
              <div className="info-icon">
                <Shield />
              </div>
              <div className="info-content">
                <h4>Account Security</h4>
                <p>Your account is protected with encrypted password storage and JWT authentication.</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <User />
              </div>
              <div className="info-content">
                <h4>Role Permissions</h4>
                <p>
                  {user.role === 'admin' 
                    ? 'As an admin, you have full access to all system features and can manage users.'
                    : 'As a faculty member, you can access student data, generate reports, and monitor fraud activities.'}
                </p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Mail />
              </div>
              <div className="info-content">
                <h4>Contact Information</h4>
                <p>Your email is used for system notifications and account recovery.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
