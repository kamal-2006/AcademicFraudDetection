import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from './Loading';

const PageTransition = ({ children, minLoadTime = 300 }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loading indicator on route change
    setIsTransitioning(true);
    
    // Ensure minimum load time for smooth UX
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [location.pathname, minLoadTime]);

  if (isTransitioning) {
    return (
      <div className="page-transition-loading">
        <Loading size="lg" message="Loading..." />
      </div>
    );
  }

  return (
    <div className="page-transition-content">
      {children}
    </div>
  );
};

export default PageTransition;
