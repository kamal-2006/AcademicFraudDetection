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
import { useState, useEffect } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/tablet screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      // Auto-collapse on tablets (768-1023px)
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update body class when sidebar collapsed state changes
  useEffect(() => {
    if (!isMobile) {
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }

    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isCollapsed, isMobile]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: Calendar },
    { name: 'Exam Performance', path: '/exams', icon: FileText },
    { name: 'Plagiarism', path: '/plagiarism', icon: Copy },
    { name: 'Fraud Reports', path: '/fraud-reports', icon: AlertTriangle },
  ];

  const isActive = (path) => location.pathname === path;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Handle touch events for tooltip on mobile
  const handleTouchStart = (e) => {
    if (isCollapsed && !isMobile) {
      e.currentTarget.classList.add('touch-active');
    }
  };

  const handleTouchEnd = (e) => {
    if (isCollapsed && !isMobile) {
      setTimeout(() => {
        e.currentTarget.classList.remove('touch-active');
      }, 1500); // Show tooltip for 1.5 seconds
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={handleMobileToggle}
        className="menu-toggle"
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside 
        className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        aria-label="Main navigation"
      >
        {/* Desktop collapse toggle button with Menu icon - only shown when expanded */}
        {!isMobile && !isCollapsed && (
          <div className="sidebar-header">
            <button
              onClick={toggleCollapse}
              className="sidebar-menu-toggle"
              aria-label="Collapse sidebar"
              aria-expanded={true}
            >
              <Menu size={24} aria-hidden="true" />
              <span className="sidebar-menu-label">Menu</span>
            </button>
          </div>
        )}

        {/* Expand button shown only when collapsed */}
        {!isMobile && isCollapsed && (
          <div className="sidebar-expand-trigger">
            <button
              onClick={toggleCollapse}
              className="sidebar-expand-btn"
              aria-label="Expand sidebar"
              aria-expanded={false}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        )}

        <nav className="sidebar-nav" role="navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`sidebar-link ${active ? 'active' : ''}`}
                aria-label={item.name}
                aria-current={active ? 'page' : undefined}
                data-tooltip={item.name}
              >
                <Icon className="sidebar-icon" aria-hidden="true" />
                <span className="sidebar-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
