import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Import all CSS files in proper order
import './index.css';                      // Tailwind base
import './styles/global.css';              // Global base styles
import './styles/layout.css';              // Layout structure
import './styles/components.css';          // Common components
import './styles/Dashboard.css';           // Dashboard page
import './styles/Students.css';            // Students page
import './styles/Attendance.css';          // Attendance page
import './styles/ExamPerformance.css';     // Exam Performance page
import './styles/Plagiarism.css';          // Plagiarism page
import './styles/Reports.css';             // Reports page

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
