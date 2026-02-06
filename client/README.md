# Intelligent Academic Fraud Detection System (IAFDS) - Frontend

A React-based frontend application for the Intelligent Academic Fraud Detection System, built with Vite and Tailwind CSS.

## Features

-  **Dashboard** - Overview of fraud detection statistics and trends
- 👥 **Student Management** - View and manage student information
- 📅 **Attendance Monitoring** - Track attendance patterns and anomalies
- 📝 **Exam Performance** - Monitor exam scores and detect anomalies
- 📄 **Plagiarism Detection** - Review assignment similarity reports
- 🚨 **Fraud Reports** - Comprehensive fraud case management

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Academic_fraud/client
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Update `.env` with your backend API URL
```
VITE_API_BASE_URL=http://localhost:5000/api
```

5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Note:** The application automatically authenticates users. No login is required - you'll be redirected directly to the dashboard.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── api/              # API configuration and services
│   ├── axios.js      # Axios instance with interceptors
│   └── services.js   # API service functions
├── components/       # Reusable UI components
│   ├── Alert.jsx
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Loading.jsx
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── Sidebar.jsx
│   └── Table.jsx
├── context/          # React Context providers
│   └── AuthContext.jsx
├── pages/            # Page components
│   ├── Attendance.jsx
│   ├── Dashboard.jsx
│   ├── ExamPerformance.jsx
│   ├── FraudReportDetail.jsx
│   ├── FraudReports.jsx
│   ├── NotFound.jsx
│   ├── Plagiarism.jsx
│   └── Students.jsx
├── utils/            # Utility functions
│   ├── constants.js
│   └── helpers.js
├── App.jsx           # Main app component
└── main.jsx          # Entry point
```

## Authentication

### Dashboard
- Real-time statistics
- Fraud trend visualizations
- Quick access to critical cases
- Alert cards for immediate action

### Student Management
- Complete student database
- Search and filter capabilities
- Risk level indicators
- Academic performance tracking

### Attendance Monitoring
- Attendance percentage tracking
- Low attendance alerts
- Critical case identification
- Historical attendance data

### Exam Performance
- Score tracking and analysis
- Anomaly detection (sudden spikes, fast completion)
- Performance comparison with averages
- Detailed exam records

### Plagiarism Detection
- Assignment similarity analysis
- Multiple matching sources
- Risk categorization
- Detailed plagiarism reports

### Fraud Reports
- Comprehensive case management
- Status tracking (Pending, Investigating, Resolved, Dismissed)
- Risk level assessment
- Detailed case investigation interface

## Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop (1024px and above)
- Tablet (768px - 1023px)
- Mobile (below 768px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is part of an academic fraud detection system.

## Contact

For questions or support, please contact the development team.
