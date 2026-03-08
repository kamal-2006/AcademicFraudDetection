import { GraduationCap, LayoutDashboard, ClipboardList, LogOut, Shield, Upload, FileCheck } from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/StudentLayout.css';

const NAV = [
  { label: 'Dashboard',    path: '/student-dashboard',              icon: LayoutDashboard },
  { label: 'Take Test',    path: '/student-dashboard/test',         icon: ClipboardList   },
  { label: 'Assignments',  path: '/student-dashboard/assignments',  icon: Upload          },
  { label: 'Marksheet',    path: '/student-dashboard/marksheet',    icon: FileCheck       },
];

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();

  const isActive = (path) => {
    if (path === '/student-dashboard') {
      return location.pathname === '/student-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const pageTitle = NAV.find((n) => isActive(n.path))?.label ?? 'Student Portal';

  return (
    <div className="stu-shell">
      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside className="stu-sidebar">
        {/* Brand */}
        <div className="stu-sidebar-brand">
          <div className="stu-sidebar-brand-icon">
            <Shield size={20} />
          </div>
          <span className="stu-sidebar-brand-name">AcademiGuard</span>
        </div>

        {/* Navigation */}
        <nav className="stu-nav">
          <span className="stu-nav-label">Menu</span>
          {NAV.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              className={`stu-nav-link${isActive(path) ? ' active' : ''}`}
              onClick={() => navigate(path)}
            >
              <span className="stu-nav-link-icon"><Icon size={17} /></span>
              {label}
            </button>
          ))}
        </nav>

        {/* Footer / User */}
        <div className="stu-sidebar-footer">
          <div className="stu-user-card">
            <div className="stu-user-avatar">
              {user?.name?.[0]?.toUpperCase() ?? 'S'}
            </div>
            <div className="stu-user-info">
              <p className="stu-user-name">{user?.name ?? 'Student'}</p>
              <p className="stu-user-role">Student</p>
            </div>
          </div>
          <button className="stu-logout-btn" onClick={logout}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────── */}
      <div className="stu-main">
        {/* Top bar */}
        <header className="stu-topbar">
          <span className="stu-topbar-title">{pageTitle}</span>
          <div className="stu-topbar-badge">
            <GraduationCap size={14} />
            Student Portal
          </div>
        </header>

        {/* Page content */}
        <div className="stu-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
