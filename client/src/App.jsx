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
import ProctoringLogs from './pages/ProctoringLogs';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import StudentLayout from './pages/StudentLayout';
import StudentHome from './pages/StudentHome';
import TakeTest from './pages/TakeTest';
import AssignmentSubmission from './pages/AssignmentSubmission';
import CertificateUpload from './pages/CertificateUpload';
import AssignmentManagement from './pages/AssignmentManagement';

// Layout component for faculty/admin authenticated pages
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
        {/* ── Public Routes ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Student Portal (nested routes) ── */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentHome />} />
          <Route path="test"        element={<TakeTest />} />
          <Route path="assignments" element={<AssignmentSubmission />} />
          <Route path="certificates" element={<CertificateUpload />} />
        </Route>

        {/* ── Faculty / Admin Routes ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
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
            <ProtectedRoute roles={['faculty', 'admin']}>
              <AppLayout>
                <Students />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute roles={['admin']}>
              <AppLayout>
                <Attendance />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <AppLayout>
                <ExamPerformance />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plagiarism"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <AppLayout>
                <Plagiarism />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <AppLayout>
                <AssignmentManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fraud-reports"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <AppLayout>
                <FraudReports />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fraud-reports/:id"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <AppLayout>
                <FraudReportDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/proctoring"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <AppLayout>
                <ProctoringLogs />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Root redirect ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

