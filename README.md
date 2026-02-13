# 🎓 Intelligent Academic Fraud Detection System (IAFDS)

A comprehensive full-stack MERN application for detecting and monitoring academic fraud through intelligent analysis of student attendance, exam performance, plagiarism detection, and comprehensive fraud reporting.

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

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
  - [Sample Data Population](#sample-data-population)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [API Documentation](#api-documentation)
- [CSV Upload Guide](#csv-upload-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Intelligent Academic Fraud Detection System (IAFDS) is designed to help educational institutions identify and prevent academic fraud through comprehensive monitoring and analysis. The system tracks student attendance patterns, exam performance anomalies, plagiarism incidents, and generates detailed fraud reports with multiple detection mechanisms including biometric verification, IP monitoring, and behavioral analysis.

### Key Capabilities

- **Real-time Monitoring**: Track attendance and exam performance in real-time
- **Automated Risk Assessment**: Identify high-risk students based on multiple factors
- **Comprehensive Fraud Reporting**: Detailed fraud detection across 4 categories (Plagiarism, Attendance, Exam, Identity)
- **Data Visualization**: Interactive charts and graphs for trend analysis
- **Multi-factor Detection**: Combine attendance, performance, plagiarism, and behavioral data
- **CSV Import/Export**: Bulk operations and data portability
- **Advanced Analytics**: Statistics, aggregations, and exportable reports

## ✨ Features

### 📊 Dashboard
- Real-time statistics and metrics
- Interactive charts (attendance distribution, pass/fail rates)
- High-risk student alerts
- Quick access to critical cases
- Aggregated data from all modules

### 👥 Student Management
- Complete student database with CRUD operations
- **CSV bulk import** with enhanced validation (handles "Student ID" with spaces, case-insensitive)
- **Advanced sorting** by Student ID, Name, Department, Year, GPA, Attendance
- **Real-time search** across multiple fields (name, ID, email)
- **Dynamic filtering** by risk level
- Student risk profiles with automatic assessment
- Academic history tracking
- **Download CSV template** for easy imports
- Duplicate detection (Student ID & Email)
- Detailed error reporting for CSV uploads

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
- **Comprehensive fraud detection** across 4 categories:
  - **Plagiarism**: Similarity scores, source matching, matched content tracking
  - **Attendance Fraud**: Pattern analysis, proxy detection, irregular behavior
  - **Exam Anomalies**: Score fluctuations, suspicious timing patterns
  - **Identity Fraud**: Biometric mismatches, IP anomalies, device fingerprinting
- **Status workflow**: Pending Review → Under Investigation → Verified → Closed → Dismissed
- **Risk scoring** (0-100) with automatic level categorization (Low/Medium/High/Critical)
- Evidence attachment and documentation
- Investigation timeline and notes
- **Advanced filtering** by fraud type, status, risk level, date range
- **Statistics dashboard** with aggregated metrics
- **Export capabilities** (CSV/JSON) for external analysis
- **Bulk operations** support
- Linked student profiles with complete history

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
│   │   │   └── FraudReport.js      # Fraud report model (NEW)
│   │   ├── controllers/             # Route controllers
│   │   │   ├── studentController.js      # Enhanced with CSV validation
│   │   │   ├── attendanceController.js
│   │   │   ├── examController.js
│   │   │   └── fraudController.js        # Fraud reports CRUD (NEW)
│   │   ├── routes/                  # API routes
│   │   │   ├── studentRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── examRoutes.js
│   │   │   └── fraudRoutes.js            # 13 fraud endpoints (NEW)
│   │   ├── middleware/              # Custom middleware
│   │   │   └── upload.js            # Multer file upload config
│   │   └── utils/                   # Utility functions
│   ├── sample_attendance.js         # Sample attendance data
│   ├── sample_exams.js             # Sample exam data
│   ├── sample_fraud_reports.js     # Sample fraud reports data (NEW)
│   ├── populate_sample_data.js     # Comprehensive data seeder
│   ├── test_attendance_exam_api.js # API testing script
│   ├── test_fraud_api.js           # Fraud API testing script (NEW)
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
### 5. Fraud Report Management Module

**Features:**
- **Multi-category fraud detection**: Plagiarism, Attendance, Exam, Identity
- Comprehensive case tracking with evidence
- Status workflow management (5 states)
- Risk scoring and level categorization
- Advanced analytics and statistics
- Export to CSV/JSON formats

**Fraud Types:**
1. **Plagiarism**: Track similarity scores, matched sources, content comparison
2. **Attendance**: Monitor irregular patterns, proxy attendance, behavioral anomalies
3. **Exam**: Detect score fluctuations, suspicious timing, pattern analysis
4. **Identity**: Biometric verification, IP monitoring, device fingerprinting

**Status Workflow:**
- Pending Review → Under Investigation → Verified → Closed → Dismissed

**Risk Levels:**
- **Low** (0-25): Minor concerns, routine monitoring
- **Medium** (26-50): Requires attention, further investigation
- **High** (51-75): Serious concern, immediate review required
- **Critical** (76-100): Severe violation, urgent action required

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Available Endpoints

#### Student Routes
- `GET /students` - Get all students (with pagination, sorting, and filters)
- `GET /students/:id` - Get student by ID
- `POST /students` - Create new student
- `POST /students/upload` - Bulk upload via CSV (enhanced validation)
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student
- `GET /students/export` - Export students to CSV

**Query Parameters for GET /students:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)
- `sortBy` - Sort field (studentId, name, department, year, gpa, attendance, createdAt)
- `sortOrder` - Sort direction (asc, desc)

#### Fraud Report Routes
- `GET /fraud-reports` - Get all fraud reports (with advanced filters)
- `GET /fraud-reports/:id` - Get fraud report by ID
- `POST /fraud-reports` - Create new fraud report
- `PUT /fraud-reports/:id` - Update fraud report
- `DELETE /fraud-reports/:id` - Delete fraud report
- `GET /fraud-reports/statistics` - Get fraud statistics and analytics
- `GET /fraud-reports/export/csv` - Export reports to CSV
- `GET /fraud-reports/export/json` - Export reports to JSON

**Query Parameters for GET /fraud-reports:**
- `fraudType` - Filter by type (plagiarism, attendance, exam, identity)
- `status` - Filter by status (pending-review, under-investigation, verified, closed, dismissed)
- `riskLevel` - Filter by risk (low, medium, high, critical)
- `startDate` - Filter by start date (YYYY-MM-DD)
- `endDate` - Filter by end date (YYYY-MM-DD)
- `page` - Page number
- `limit` - Results per page

**Fraud Report Request Body Example:**
```json
{
  "student": "60d5ec49f1b2c8b1f8e4e1a1",
  "fraudType": "plagiarism",
  "riskScore": 85,
  "plagiarismDetails": {
    "similarityScore": 92,
    "sourceMatched": "Wikipedia: Artificial Intelligence",
    "matchedContent": "Artificial intelligence is intelligence demonstrated by machines..."
  },
  "evidence": ["assignment_report.pdf", "similarity_check.png"],
  "notes": "High similarity detected in final term paper"
}
```

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

## 📤 CSV Upload Guide

### Student CSV Import

The system supports bulk student import via CSV files with **enhanced validation** that handles various header formats.

#### Supported Header Formats

The CSV parser automatically recognizes these variations (case-insensitive):

| Field | Accepted Headers |
|-------|-----------------|
| **Student ID** | `Student ID`, `StudentID`, `student_id`, `STUDENT_ID`, `ID`, `id` |
| **Name** | `Name`, `name`, `NAME`, `Student Name`, `StudentName`, `student_name` |
| **Email** | `Email`, `email`, `EMAIL`, `E-mail`, `Student Email` |
| **Department** | `Department`, `department`, `DEPARTMENT`, `dept`, `Dept` |
| **Year** | `Year`, `year`, `YEAR`, `Academic Year`, `Year Level` |
| **GPA** | `GPA`, `gpa`, `Gpa`, `grade`, `Grade` |
| **Attendance** | `Attendance`, `attendance`, `ATTENDANCE`, `Attendance %`, `Attendance Percentage` |

#### CSV Template

Download the template: [`/client/public/student_template.csv`](client/public/student_template.csv)

```csv
Student ID,Name,Email,Department,Year,GPA,Attendance
STU001,John Doe,john.doe@university.edu,Computer Science,1,3.5,85
STU002,Jane Smith,jane.smith@university.edu,Engineering,2,3.8,92
STU003,Mike Johnson,mike.j@university.edu,Mathematics,3,2.9,75
```

#### Validation Rules

✅ **Required Fields**: All 7 fields must be present  
✅ **Student ID**: Must be unique across the system  
✅ **Email**: Must be unique and valid format  
✅ **Department**: Any text value  
✅ **Year**: Integer (1-4 typically)  
✅ **GPA**: Decimal number (0.0-4.0 typically)  
✅ **Attendance**: Number (0-100 representing percentage)

#### Upload Process

1. **Prepare CSV**: Use the template or create your own following the format
2. **Navigate**: Go to Students page → CSV Upload section
3. **Select File**: Click "Choose CSV File" (max 5MB)
4. **Upload**: Click "Upload" button
5. **Review**: Check the success message showing:
   - Total records processed
   - Successfully inserted students
   - Duplicate records (skipped)
   - Validation errors (with details)

#### Response Format

```json
{
  "success": true,
  "message": "Successfully processed CSV file",
  "summary": {
    "totalRecords": 100,
    "validRecords": 95,
    "inserted": 90,
    "duplicates": 5,
    "validationErrors": 5
  },
  "validationErrors": [
    {
      "row": 10,
      "errors": ["Invalid email format"]
    }
  ],
  "duplicateErrors": [
    {
      "studentId": "STU001",
      "error": "Student ID already exists"
    }
  ]
}
```

#### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No valid records found" | Check headers match template exactly (spaces, case) |
| "Student ID already exists" | Remove duplicate IDs or update existing records |
| "Email already exists" | Ensure emails are unique across all students |
| "Invalid GPA value" | GPA must be a number (use 3.5, not "3.5 GPA") |
| "File size too large" | Split into multiple files (max 5MB each) |

## 🧪 Testing

### Populate Sample Data

```bash
cd server
node populate_sample_data.js
```

This creates:
- **10 students** with varying risk levels
- **38 fraud reports** across all 4 categories
- **10 attendance records** with varying percentages
- **15 exam records** with various grades
- High-risk and low attendance scenarios

### Run API Tests

```bash
cd server
# Test attendance and exam APIs
node test_attendance_exam_api.js

# Test fraud report APIs
node test_fraud_api.js

# Test all student APIs
node test_api.js
```

Tests all endpoints with automated validation.

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

**Create Fraud Report:**
```bash
curl -X POST http://localhost:5000/api/fraud-reports \
  -H "Content-Type: application/json" \
  -d '{
    "student": "60d5ec49f1b2c8b1f8e4e1a1",
    "fraudType": "plagiarism",
    "riskScore": 85,
    "plagiarismDetails": {
      "similarityScore": 92,
      "sourceMatched": "Wikipedia",
      "matchedContent": "Sample content..."
    }
  }'
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Blank White Screen on Fraud Reports Page**

**Problem**: Page shows blank white screen instead of fraud reports.

**Solutions**:
- Check browser console for errors (F12)
- Verify backend is running on port 5000
- Ensure MongoDB is connected
- Check API response structure matches frontend expectations
- Clear browser cache and reload

#### 2. **CSV Upload Fails: "No valid records found in CSV"**

**Problem**: CSV upload shows error even with correct data.

**Solutions**:
- ✅ **Fixed in latest version**: Enhanced header matching handles spaces and case variations
- Ensure headers exactly match: `Student ID`, `Name`, `Email`, `Department`, `Year`, `GPA`, `Attendance`
- Check for hidden characters or BOM in CSV file
- Verify no empty rows in CSV
- Save CSV with UTF-8 encoding
- Download and use the provided template from `/client/public/student_template.csv`

#### 3. **MongoDB Connection Error**

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
# Windows:
net start MongoDB

# Linux/Mac:
sudo systemctl start mongod
# or
brew services start mongodb-community
```

#### 4. **Port Already in Use**

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9

# Or change port in server/.env
PORT=5001
```

#### 5. **CORS Errors**

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:
- Verify `CLIENT_URL` in server `.env` matches frontend URL
- Check CORS middleware is properly configured in `server/src/app.js`
- Ensure requests include proper headers

#### 6. **JWT Authentication Errors**

**Problem**: `401 Unauthorized` or `Invalid token`

**Solutions**:
- Check `JWT_SECRET` is set in server `.env`
- Verify token is included in request headers: `Authorization: Bearer <token>`
- Token may have expired (default 7 days) - login again

#### 7. **Sorting Not Working**

**Problem**: Student list doesn't sort when selecting options.

**Solutions**:
- ✅ **Fixed in latest version**: Full sorting implemented for all fields
- Clear browser cache
- Check network tab for API requests with `sortBy` and `sortOrder` params
- Verify backend `/students` endpoint supports sorting

#### 8. **High Memory Usage**

**Problem**: Application consuming too much memory.

**Solutions**:
- Limit API response page size (use pagination)
- Clear MongoDB logs if disk space is low
- Add indexes to frequently queried fields
- Use `NODE_ENV=production` for optimized builds

### Debug Mode

Enable detailed logging:

```bash
# In server/.env
NODE_ENV=development
DEBUG=true

# Then check server console for detailed logs
```

### Getting Help

If issues persist:
1. Check existing GitHub Issues
2. Create new issue with:
   - Error message and stack trace
   - Steps to reproduce
   - Environment details (OS, Node version, MongoDB version)
   - Screenshots if applicable

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
- [x] Student Management System with CSV Import/Export
- [x] Attendance Monitoring with Pattern Analysis
- [x] Exam Performance Analysis
- [x] **Fraud Reports Module** (Plagiarism, Attendance, Exam, Identity)
- [x] Dashboard with Real-time Metrics
- [x] Advanced Filtering and Sorting
- [x] Risk Assessment and Categorization

### Phase 2 (In Progress) 🚧
- [x] Enhanced CSV validation (handles multiple header formats)
- [x] Dynamic sorting for Students module
- [x] Fraud statistics and analytics dashboard
- [x] Export functionality (CSV/JSON)
- [ ] Authentication and User Management
- [ ] Email Notification System
- [ ] Role-based Access Control (Admin, Instructor, Investigator)

### Phase 3 (Upcoming) 📋
- [ ] Machine Learning Integration for Predictive Fraud Detection
- [ ] Advanced Plagiarism Detection with AI
- [ ] Real-time Alerts and Notifications
- [ ] Biometric Integration for Identity Verification
- [ ] Integration with Learning Management Systems (LMS)

### Phase 4 (Future) 🔮
- [ ] Mobile Application (React Native)
- [ ] Blockchain-based Evidence Storage
- [ ] Multi-tenancy Support (Multiple Institutions)
- [ ] Advanced Analytics with Data Visualization
- [ ] Multi-language Support
- [ ] API for Third-party Integrations
- [ ] Audit Trail and Compliance Reporting

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
