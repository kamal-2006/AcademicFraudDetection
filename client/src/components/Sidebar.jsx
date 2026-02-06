import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Copy,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: Calendar },
    { name: 'Exam Performance', path: '/exams', icon: FileText },
    { name: 'Plagiarism', path: '/plagiarism', icon: Copy },
    { name: 'Fraud Reports', path: '/fraud-reports', icon: AlertTriangle },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="menu-toggle"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon className="sidebar-icon" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
