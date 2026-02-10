# Fraud Reports Module - Implementation Guide

## Overview
This guide provides step-by-step instructions for using the Fraud Reports backend module in the Academic Fraud Detection System.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Module Structure](#module-structure)
3. [Database Setup](#database-setup)
4. [API Usage](#api-usage)
5. [Testing](#testing)
6. [Integration with Frontend](#integration-with-frontend)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies
The `json2csv` package has already been installed. Verify by checking:
```bash
cd server
npm list json2csv
```

### 2. Start the Server
```bash
cd server
npm run dev
```

The server should start on `http://localhost:5000`

### 3. Populate Sample Data

First, ensure you have students in the database:
```bash
node populate_sample_data.js
```

Then, generate sample fraud reports:
```bash
node sample_fraud_reports.js
```

### 4. Test the API
```bash
node test_fraud_api.js
```

---

## Module Structure

```
server/
├── src/
│   ├── models/
│   │   └── FraudReport.js          # Mongoose schema for fraud reports
│   ├── controllers/
│   │   └── fraudController.js      # Business logic for fraud reports
│   ├── routes/
│   │   └── fraudRoutes.js          # API route definitions
│   └── app.js                       # Updated with fraud routes
├── sample_fraud_reports.js          # Sample data generator
├── test_fraud_api.js                # API testing script
└── FRAUD_REPORTS_API_DOCUMENTATION.md   # Detailed API docs
```

---

## Database Setup

### FraudReport Model Features

1. **Comprehensive Fields**: Supports all fraud types (plagiarism, attendance, identity, exam cheating, grade tampering)
2. **Risk Assessment**: Automatic risk level calculation based on risk score
3. **Flexible Design**: Fraud-type specific fields (plagiarism scores, matched sources, attendance irregularities, identity anomalies)
4. **Audit Trail**: Tracks detection, review, and action timestamps
5. **Status Management**: Workflow states (Pending Review → Under Investigation → Confirmed/Dismissed/Resolved)

### Indexes for Performance
The model includes indexes on:
- `studentId` + `fraudType` (compound index)
- `detectionTimestamp` (descending)
- `riskScore` (descending)
- `status`
- `riskLevel`

---

## API Usage

### Creating a Fraud Report

#### Plagiarism Report
```bash
curl -X POST http://localhost:5000/api/fraud-reports \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "fraudType": "Plagiarism",
    "plagiarismScore": 85,
    "matchedSources": [
      {
        "source": "Wikipedia",
        "similarity": 75,
        "url": "https://en.wikipedia.org/wiki/Machine_Learning"
      }
    ],
    "riskScore": 82,
    "systemRemarks": "High similarity detected in assignment"
  }'
```

#### Attendance Manipulation Report
```bash
curl -X POST http://localhost:5000/api/fraud-reports \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU002",
    "fraudType": "Attendance Manipulation",
    "attendanceIrregularities": {
      "suspiciousPatterns": [
        {
          "date": "2026-02-01T10:00:00Z",
          "pattern": "Proxy Attendance",
          "description": "Multiple IP addresses for single attendance"
        }
      ],
      "inconsistentRecords": 5,
      "proxyAttendanceIndicators": 3
    },
    "riskScore": 65,
    "systemRemarks": "Proxy attendance suspected"
  }'
```

#### Identity Fraud Report
```bash
curl -X POST http://localhost:5000/api/fraud-reports \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU003",
    "fraudType": "Identity Fraud",
    "identityAnomalies": {
      "biometricMismatch": true,
      "ipAddressAnomalies": [
        {
          "date": "2026-02-05T14:30:00Z",
          "ipAddress": "192.168.1.100",
          "location": "Unknown Location",
          "description": "Login from suspicious location"
        }
      ],
      "multipleSimultaneousLogins": 2
    },
    "riskScore": 78,
    "systemRemarks": "Biometric verification failed during exam"
  }'
```

### Retrieving Fraud Reports

#### Get All Reports with Pagination
```bash
curl "http://localhost:5000/api/fraud-reports?page=1&limit=20"
```

#### Filter by Fraud Type
```bash
curl "http://localhost:5000/api/fraud-reports?fraudType=Plagiarism"
```

#### Filter by Risk Level
```bash
curl "http://localhost:5000/api/fraud-reports?riskLevel=High"
```

#### Filter by Status
```bash
curl "http://localhost:5000/api/fraud-reports?status=Pending%20Review"
```

#### Filter by Date Range
```bash
curl "http://localhost:5000/api/fraud-reports?startDate=2026-01-01&endDate=2026-02-10"
```

#### Combined Filters
```bash
curl "http://localhost:5000/api/fraud-reports?fraudType=Plagiarism&riskLevel=High&status=Pending%20Review&page=1&limit=10&sortBy=riskScore&sortOrder=desc"
```

### Getting Statistics
```bash
curl "http://localhost:5000/api/fraud-reports/statistics/summary"
```

### Exporting Reports

#### Export to CSV
```bash
curl "http://localhost:5000/api/fraud-reports/export/csv?fraudType=Plagiarism" -o reports.csv
```

#### Export to JSON
```bash
curl "http://localhost:5000/api/fraud-reports/export/json?startDate=2026-01-01" -o reports.json
```

### Updating a Report
```bash
curl -X PUT http://localhost:5000/api/fraud-reports/{report_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Confirmed",
    "reviewedBy": "Dr. Smith",
    "reviewNotes": "Plagiarism confirmed after investigation",
    "actionTaken": "Grade Penalty",
    "actionDate": "2026-02-11T09:00:00Z"
  }'
```

---

## Testing

### Running the Test Suite

The `test_fraud_api.js` script tests all endpoints:

```bash
# Make sure server is running
npm run dev

# In another terminal, run tests
node test_fraud_api.js
```

### Test Coverage

The test suite covers:
1. ✓ Student data retrieval (prerequisite)
2. ✓ Creating fraud reports
3. ✓ Getting all fraud reports
4. ✓ Getting fraud report by ID
5. ✓ Updating fraud reports
6. ✓ Getting reports by student
7. ✓ Getting fraud statistics
8. ✓ Getting high-risk reports
9. ✓ Getting recent reports
10. ✓ Filtering fraud reports
11. ✓ Bulk creating reports
12. ✓ Exporting to JSON
13. ✓ Date range filtering

### Manual Testing with Postman

1. Import the API endpoints to Postman
2. Set base URL: `http://localhost:5000/api`
3. Create a collection for fraud reports
4. Test each endpoint with sample data

---

## Integration with Frontend

### Step 1: Create API Service

Add to `client/src/api/services.js`:

```javascript
// Fraud Reports API
export const fraudReportAPI = {
  // Get all fraud reports with filters
  getAll: (params) => api.get('/fraud-reports', { params }),
  
  // Get single fraud report
  getById: (id) => api.get(`/fraud-reports/${id}`),
  
  // Create new fraud report
  create: (data) => api.post('/fraud-reports', data),
  
  // Update fraud report
  update: (id, data) => api.put(`/fraud-reports/${id}`, data),
  
  // Delete fraud report
  delete: (id) => api.delete(`/fraud-reports/${id}`),
  
  // Get reports by student
  getByStudent: (studentId) => api.get(`/fraud-reports/student/${studentId}`),
  
  // Get statistics
  getStatistics: (params) => api.get('/fraud-reports/statistics/summary', { params }),
  
  // Get high-risk reports
  getHighRisk: (params) => api.get('/fraud-reports/high-risk', { params }),
  
  // Get recent reports
  getRecent: (params) => api.get('/fraud-reports/recent', { params }),
  
  // Export to CSV
  exportCSV: (params) => api.get('/fraud-reports/export/csv', {
    params,
    responseType: 'blob'
  }),
  
  // Export to JSON
  exportJSON: (params) => api.get('/fraud-reports/export/json', { params }),
  
  // Bulk create
  bulkCreate: (reports) => api.post('/fraud-reports/bulk', { reports })
};
```

### Step 2: Create Context (Optional)

Create `client/src/context/FraudReportContext.jsx`:

```javascript
import { createContext, useState, useContext } from 'react';
import { fraudReportAPI } from '../api/services';

const FraudReportContext = createContext();

export const FraudReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await fraudReportAPI.getAll(filters);
      setReports(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (reportData) => {
    setLoading(true);
    try {
      const response = await fraudReportAPI.create(reportData);
      setReports([response.data.data, ...reports]);
      setError(null);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FraudReportContext.Provider value={{
      reports,
      loading,
      error,
      fetchReports,
      createReport
    }}>
      {children}
    </FraudReportContext.Provider>
  );
};

export const useFraudReports = () => useContext(FraudReportContext);
```

### Step 3: Create Components

#### FraudReports List Page
```javascript
// client/src/pages/FraudReports.jsx
import { useState, useEffect } from 'react';
import { fraudReportAPI } from '../api/services';
import Table from '../components/Table';
import Card from '../components/Card';

const FraudReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fraudType: '',
    riskLevel: '',
    status: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      const response = await fraudReportAPI.getAll(filters);
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Student ID', accessor: 'studentId' },
    { header: 'Student Name', accessor: row => row.student?.name },
    { header: 'Fraud Type', accessor: 'fraudType' },
    { header: 'Risk Score', accessor: 'riskScore' },
    { header: 'Risk Level', accessor: 'riskLevel' },
    { header: 'Status', accessor: 'status' },
    { header: 'Detection Date', accessor: row => new Date(row.detectionTimestamp).toLocaleDateString() }
  ];

  return (
    <div className="fraud-reports">
      <h1>Fraud Reports</h1>
      
      {/* Filters */}
      <Card>
        <div className="filters">
          <select onChange={(e) => setFilters({...filters, fraudType: e.target.value})}>
            <option value="">All Fraud Types</option>
            <option value="Plagiarism">Plagiarism</option>
            <option value="Attendance Manipulation">Attendance Manipulation</option>
            <option value="Identity Fraud">Identity Fraud</option>
          </select>
          
          <select onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}>
            <option value="">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table data={reports} columns={columns} />
      )}
    </div>
  );
};

export default FraudReports;
```

### Step 4: Add Routes

In `client/src/App.jsx`:
```javascript
import FraudReports from './pages/FraudReports';
import FraudReportDetail from './pages/FraudReportDetail';

// Add routes
<Route path="/fraud-reports" element={<FraudReports />} />
<Route path="/fraud-reports/:id" element={<FraudReportDetail />} />
```

### Step 5: Update Sidebar

Add to sidebar navigation:
```javascript
{
  name: 'Fraud Reports',
  path: '/fraud-reports',
  icon: <AlertIcon />
}
```

---

## Troubleshooting

### Issue: "Student not found" error
**Solution**: Ensure students are populated in the database first:
```bash
node populate_sample_data.js
```

### Issue: "json2csv not found" error
**Solution**: Install the package:
```bash
npm install json2csv
```

### Issue: Server not starting
**Solution**: Check if MongoDB is running and .env file is configured:
```bash
# Check MongoDB connection string in .env
MONGODB_URI=mongodb://127.0.0.1:27017/academic_fraud_db
```

### Issue: Empty results from API
**Solution**: Generate sample fraud reports:
```bash
node sample_fraud_reports.js
```

### Issue: CORS errors in frontend
**Solution**: Ensure CORS is configured in `app.js`:
```javascript
app.use(cors());
```

### Issue: CSV export not downloading
**Solution**: Check response headers and ensure `responseType: 'blob'` is set in axios request:
```javascript
const response = await api.get('/fraud-reports/export/csv', {
  responseType: 'blob'
});

// Create download link
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'fraud-reports.csv');
document.body.appendChild(link);
link.click();
```

---

## Best Practices

### 1. Data Validation
Always validate data before creating fraud reports:
```javascript
// Validate risk score
if (riskScore < 0 || riskScore > 100) {
  throw new Error('Risk score must be between 0 and 100');
}

// Validate student exists
const student = await Student.findOne({ studentId });
if (!student) {
  throw new Error('Student not found');
}
```

### 2. Error Handling
Implement proper error handling in frontend:
```javascript
try {
  await fraudReportAPI.create(reportData);
  showSuccessMessage('Fraud report created successfully');
} catch (error) {
  showErrorMessage(error.response?.data?.message || 'Failed to create report');
}
```

### 3. Performance Optimization
- Use pagination for large datasets
- Implement caching for statistics
- Use indexes for frequently queried fields
- Consider lazy loading for detail views

### 4. Security
- Implement authentication middleware
- Add role-based access control
- Validate all inputs
- Sanitize user data
- Log all access to fraud reports

---

## Next Steps

1. **Add Authentication**: Implement JWT authentication for API endpoints
2. **Add Authorization**: Role-based access control (admin, faculty, student)
3. **Email Notifications**: Send alerts for high-risk fraud cases
4. **Real-time Updates**: Implement WebSocket for live fraud detection alerts
5. **Advanced Analytics**: Add more statistical analysis and visualizations
6. **Audit Logging**: Track all changes to fraud reports
7. **File Upload**: Implement evidence file upload (screenshots, documents)
8. **Automated Detection**: Integrate with plagiarism detection APIs
9. **Workflow Automation**: Trigger actions based on risk levels
10. **Mobile App**: Create mobile interface for fraud report management

---

## Support

For issues or questions:
1. Check the [API Documentation](FRAUD_REPORTS_API_DOCUMENTATION.md)
2. Run the test suite: `node test_fraud_api.js`
3. Review server logs for error details
4. Check MongoDB connection and data

---

## License

This module is part of the Academic Fraud Detection System (IAFDS).
