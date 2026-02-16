import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '../components/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* 404 Number with Animation */}
        <div className="relative">
          <h1 className="text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-none">
            404
          </h1>
          <div className="absolute inset-0 text-[180px] font-bold text-blue-600 opacity-10 blur-xl">
            404
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-4xl font-bold text-gray-900 mt-8 mb-4">
          Oops! Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          The page you are looking for doesn't exist, has been moved, or you don't have permission to access it.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/dashboard">
            <Button variant="primary" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/students" className="text-blue-600 hover:text-blue-700 hover:underline">
              Students
            </Link>
            <Link to="/attendance" className="text-blue-600 hover:text-blue-700 hover:underline">
              Attendance
            </Link>
            <Link to="/exams" className="text-blue-600 hover:text-blue-700 hover:underline">
              Exams
            </Link>
            <Link to="/plagiarism" className="text-blue-600 hover:text-blue-700 hover:underline">
              Plagiarism
            </Link>
            <Link to="/fraud-reports" className="text-blue-600 hover:text-blue-700 hover:underline">
              Fraud Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
