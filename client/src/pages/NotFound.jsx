import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-4 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
