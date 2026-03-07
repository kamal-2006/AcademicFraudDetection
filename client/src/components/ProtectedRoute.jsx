import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

/**
 * ProtectedRoute
 * Props:
 *  - roles: string[] — allowed roles (omit to allow any authenticated user)
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen message="Checking authentication…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role guard: redirect unauthorised users to their own home
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    const fallback = user.role === 'student' ? '/student-dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;

