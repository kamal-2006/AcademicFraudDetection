import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  // No authentication check - always allow access
  return children;
};

export default ProtectedRoute;
