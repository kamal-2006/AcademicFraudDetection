# 🎓 Intelligent Academic Fraud Detection System (IAFDS)

A comprehensive full-stack web application for detecting and monitoring academic fraud through intelligent analysis of student attendance, exam performance, and plagiarism detection.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-7.0-green.svg)

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Intelligent Academic Fraud Detection System (IAFDS) is designed to help educational institutions identify and prevent academic fraud through comprehensive monitoring and analysis. The system tracks student attendance patterns, exam performance anomalies, and plagiarism incidents to provide early detection and intervention.

### Key Capabilities

- **Real-time Monitoring**: Track attendance and exam performance in real-time
- **Automated Risk Assessment**: Identify high-risk students based on multiple factors
- **Comprehensive Reporting**: Generate detailed fraud investigation reports
- **Data Visualization**: Interactive charts and graphs for trend analysis
- **Multi-factor Detection**: Combine attendance, performance, and plagiarism data

## ✨ Features

### 📊 Dashboard
- Real-time statistics and metrics
- Interactive charts (attendance distribution, pass/fail rates)
- High-risk student alerts
- Quick access to critical cases
- Aggregated data from all modules

### 👥 Student Management
- Complete student database with CRUD operations
- CSV bulk import functionality
- Advanced search and filtering
- Student risk profiles
- Academic history tracking

### 📅 Attendance Monitoring
- Automatic attendance percentage calculation
- Status categorization (Regular ≥75%, Warning 60-74%, Critical <60%)
- Low attendance alerts and reporting
- Subject-wise attendance tracking
- Monthly and semester-based filtering
- Statistics dashboard with summary cards

### 📝 Exam Performance Analysis
- Comprehensive exam records management
- Automatic grade calculation (A+ to F scale)
- Pass/Fail status determination (50% threshold)
- High-risk student identification
- Performance metrics and statistics
- Grade distribution visualization
- Multi-criteria filtering (subject, exam type, semester)

### 📄 Plagiarism Detection
- Assignment similarity analysis
- Multiple source matching
- Risk level categorization (Low, Medium, High, Critical)
- Detailed plagiarism reports
- Source comparison

### 🚨 Fraud Report Management
- Comprehensive case tracking
- Status workflow (Pending → Investigating → Resolved/Dismissed)
- Evidence collection and documentation
- Investigation timeline
- Multi-factor risk assessment

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern UI library with hooks
- **Vite 7.3.1** - Next-generation frontend tooling
- **React Router 7.6.1** - Declarative routing
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Axios 1.7.9** - Promise-based HTTP client
- **Recharts 2.15.0** - Composable charting library
- **Lucide React 0.469.0** - Beautiful icon library

### Backend
- **Node.js 20+** - JavaScript runtime
- **Express 5.2.1** - Fast, minimalist web framework
- **MongoDB 7.0+** - NoSQL database
- **Mongoose 9.1.6** - MongoDB object modeling
- **Multer 1.4.5-lts.1** - File upload middleware
- **CSV-Parser 3.0.0** - CSV file parsing
- **CORS** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS transformation
- **Nodemon** - Auto-restart development server

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                       │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │Dashboard │ Students │Attendance│Exam Performance  │ │
│  ├──────────┼──────────┼──────────┼──────────────────┤ │
│  │Plagiarism│  Reports │   API    │    Components    │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────────┐
│                   Server (Express)                       │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │  Routes  │Controllers│Middleware│     Models       │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────┴────────────────────────────────────┐
│                    MongoDB Database                      │
│  ┌──────────┬───────────┬──────────┬──────────────────┐│
│  │ Students │Attendances│  Exams   │  Fraud Reports   ││
│  └──────────┴───────────┴──────────┴──────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v7.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd Academic_fraud
```

2. **Install Backend Dependencies**

```bash
cd server
npm install
```

3. **Install Frontend Dependencies**

```bash
cd ../client
npm install
```

### Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/academic_fraud_detection

# CORS Configuration
CLIENT_URL=http://localhost:5174

# Authentication (if implemented)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

#### Frontend Environment Variables

Create a `.env` file in the `client/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Academic Fraud Detection System
```

### Running the Application

#### Start MongoDB

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# macOS/Linux
mongod --dbpath /path/to/your/data/directory
```

#### Start Backend Server

```bash
cd server
npm start
```

The backend server will start at `http://localhost:5000`

#### Start Frontend Development Server

```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5174`

#### Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5000/api

**Note:** The application uses auto-authentication. You'll be redirected directly to the dashboard.

## 📁 Project Structure

```
Academic_fraud/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── api/                     # API configuration and services
│   │   │   ├── axios.js            # Axios instance with interceptors
│   │   │   └── services.js         # API service functions
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Alert.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Table.jsx
│   │   ├── context/                 # React Context providers
│   │   │   └── AuthContext.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.jsx       # Main dashboard
│   │   │   ├── Students.jsx        # Student management
│   │   │   ├── Attendance.jsx      # Attendance monitoring
│   │   │   ├── ExamPerformance.jsx # Exam performance analysis
│   │   │   ├── Plagiarism.jsx      # Plagiarism detection
│   │   │   ├── FraudReports.jsx    # Fraud case management
│   │   │   └── FraudReportDetail.jsx
│   │   ├── styles/                  # CSS modules
│   │   ├── utils/                   # Utility functions
│   │   ├── App.jsx                 # Main app component
│   │   └── main.jsx                # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Backend Node.js/Express application
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   │   └── db.js               # MongoDB connection
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── Student.js          # Student model
│   │   │   ├── Attendance.js       # Attendance model
│   │   │   ├── ExamPerformance.js  # Exam performance model
│   │   │   └── FraudReport.js      # Fraud report model
│   │   ├── controllers/             # Route controllers
│   │   │   ├── studentController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── examController.js
│   │   │   └── fraudReportController.js
│   │   ├── routes/                  # API routes
│   │   │   ├── studentRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── examRoutes.js
│   │   │   └── fraudReportRoutes.js
│   │   ├── middleware/              # Custom middleware
│   │   └── utils/                   # Utility functions
│   ├── sample_attendance.js         # Sample attendance data
│   ├── sample_exams.js             # Sample exam data
│   ├── populate_sample_data.js     # Data population script
│   ├── test_attendance_exam_api.js # API testing script
│   ├── server.js                   # Server entry point
│   └── package.json
│
├── ATTENDANCE_EXAM_MODULE_GUIDE.md  # Detailed module documentation
├── QUICK_START.md                   # Quick setup guide
└── README.md                        # This file
```

## 📚 Modules

### 1. Student Management Module

**Features:**
- CRUD operations for student records
- CSV bulk import (upload student data files)
- Search and filter by ID, name, email, department
- Risk level indicators

**Database Schema:**
- Student ID, Name, Email, Department
- Date of Birth, Enrollment Date
- GPA, Risk Level

### 2. Attendance Monitoring Module

**Features:**
- Automatic attendance percentage calculation
- Status categorization (Regular, Warning, Critical)
- Subject-wise tracking
- Monthly and semester-based records
- Low attendance alerts

**Database Schema:**
- Linked to Student via studentId
- Subject, Month, Year, Semester
- Total Classes, Attended Classes
- Auto-calculated: Attendance %, Status

**Business Rules:**
- **Regular**: ≥75% attendance
- **Warning**: 60-74% attendance  
- **Critical**: <60% attendance

### 3. Exam Performance Module

**Features:**
- Comprehensive exam records (Midterm, Final, Quiz, Assignment)
- Automatic grade calculation (A+ to F)
- Pass/Fail determination (50% threshold)
- High-risk student identification
- Grade distribution statistics

**Database Schema:**
- Linked to Student via studentId
- Exam Name, Type, Subject, Date
- Total Marks, Obtained Marks
- Auto-calculated: Percentage, Grade, Status

**Grading Scale:**
- **A+**: ≥95% | **A**: 90-94% | **A-**: 85-89%
- **B+**: 80-84% | **B**: 75-79% | **B-**: 70-74%
- **C+**: 65-69% | **C**: 60-64% | **C-**: 55-59%
- **D**: 50-54% | **F**: <50%

**High-Risk Criteria:**
- Average percentage < 60%
- Failed exams ≥ 2
- Low score exams (< 50%) ≥ 3

### 4. Plagiarism Detection Module

**Features:**
- Assignment similarity analysis
- Source comparison and matching
- Risk level categorization
- Detailed plagiarism reports

### 5. Fraud Report Management Module

**Features:**
- Comprehensive case tracking
- Status workflow management
- Evidence documentation
- Investigation timeline
- Risk assessment

**Status Types:**
- Pending, Investigating, Resolved, Dismissed

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Available Endpoints

#### Student Routes
- `GET /students` - Get all students (with pagination and filters)
- `GET /students/:id` - Get student by ID
- `POST /students` - Create new student
- `POST /students/upload` - Bulk upload via CSV
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student

#### Attendance Routes
- `GET /attendance` - Get all attendance records (with filters)
- `GET /attendance/student/:studentId` - Get student attendance
- `GET /attendance/stats/overview` - Get attendance statistics
- `GET /attendance/stats/low-attendance` - Get low attendance students
- `GET /attendance/filters/subjects` - Get available subjects
- `POST /attendance` - Create attendance record
- `PUT /attendance/:id` - Update attendance record
- `DELETE /attendance/:id` - Delete attendance record

#### Exam Performance Routes
- `GET /exams` - Get all exam records (with filters)
- `GET /exams/student/:studentId` - Get student exams
- `GET /exams/stats/overview` - Get exam statistics
- `GET /exams/stats/failing` - Get failing students
- `GET /exams/stats/high-risk` - Get high-risk students
- `GET /exams/filters/subjects` - Get available subjects
- `GET /exams/filters/exam-types` - Get exam types
- `POST /exams` - Create exam record
- `PUT /exams/:id` - Update exam record
- `DELETE /exams/:id` - Delete exam record

For detailed API documentation with request/response examples, see [ATTENDANCE_EXAM_MODULE_GUIDE.md](ATTENDANCE_EXAM_MODULE_GUIDE.md)

## 🧪 Testing

### Populate Sample Data

```bash
cd server
node populate_sample_data.js
```

This creates:
- 10 attendance records with varying percentages
- 15 exam records with various grades
- High-risk and low attendance scenarios

### Run API Tests

```bash
cd server
node test_attendance_exam_api.js
```

Tests all 17 endpoints with automated validation.

### Manual Testing with Curl

**Create Attendance Record:**
```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "subject": "Data Structures",
    "totalClasses": 40,
    "attendedClasses": 35,
    "month": "February",
    "year": 2026,
    "semester": "Spring"
  }'
```

**Create Exam Record:**
```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "examName": "Midterm Exam",
    "examType": "Midterm",
    "subject": "Data Structures",
    "totalMarks": 100,
    "obtainedMarks": 85,
    "semester": "Spring",
    "year": 2026,
    "examDate": "2026-02-10"
  }'
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Development Team - Academic Fraud Detection System

## 🙏 Acknowledgments

- Educational institutions for requirements and feedback
- Open-source community for excellent tools and libraries
- Contributors and testers

## 📮 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Contact the development team

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Student Management System
- [x] Attendance Monitoring
- [x] Exam Performance Analysis
- [x] Dashboard with Real-time Metrics

### Phase 2 (Upcoming)
- [ ] Machine Learning Integration for Fraud Prediction
- [ ] Advanced Plagiarism Detection Algorithms
- [ ] Email Notification System
- [ ] Advanced Reporting and Analytics

### Phase 3 (Future)
- [ ] Mobile Application
- [ ] Role-based Access Control (Admin, Teacher, Student)
- [ ] Integration with Learning Management Systems
- [ ] Real-time Alerts and Notifications
- [ ] Multi-language Support

---

## ⚡ Quick Links

- [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- [Module Documentation](ATTENDANCE_EXAM_MODULE_GUIDE.md) - Detailed technical guide
- [API Reference](ATTENDANCE_EXAM_MODULE_GUIDE.md#api-endpoints) - Complete API documentation

---

<div align="center">

**Built with ❤️ for Educational Excellence**

⭐ Star this repo if you find it helpful!

</div>
