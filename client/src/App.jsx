import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import ExamPerformance from './pages/ExamPerformance';
import Plagiarism from './pages/Plagiarism';
import FraudReports from './pages/FraudReports';
import FraudReportDetail from './pages/FraudReportDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Layout component for authenticated pages
const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Students />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Attendance />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ExamPerformance />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plagiarism"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Plagiarism />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fraud-reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FraudReports />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fraud-reports/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FraudReportDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect root to login or dashboard */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
