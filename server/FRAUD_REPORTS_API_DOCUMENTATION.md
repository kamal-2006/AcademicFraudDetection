# Fraud Reports API Documentation

## Overview
The Fraud Reports module provides comprehensive REST APIs for managing academic fraud detection, plagiarism analysis, attendance irregularities, and identity-related anomalies. This module integrates with the existing MERN stack infrastructure to provide secure storage, processing, and retrieval of fraud detection results.

## Base URL
```
http://localhost:5000/api/fraud-reports
```

## Data Model

### FraudReport Schema
```javascript
{
  studentId: String (required, indexed),
  student: ObjectId (reference to Student),
  fraudType: String (enum: ['Plagiarism', 'Attendance Manipulation', 'Identity Fraud', 'Exam Cheating', 'Grade Tampering', 'Multiple Fraud Types']),
  
  // Plagiarism Details
  plagiarismScore: Number (0-100),
  matchedSources: [{
    source: String,
    similarity: Number (0-100),
    url: String
  }],
  
  // Attendance Details
  attendanceIrregularities: {
    suspiciousPatterns: [{
      date: Date,
      pattern: String,
      description: String
    }],
    inconsistentRecords: Number,
    proxyAttendanceIndicators: Number
  },
  
  // Identity Details
  identityAnomalies: {
    biometricMismatch: Boolean,
    ipAddressAnomalies: [{
      date: Date,
      ipAddress: String,
      location: String,
      description: String
    }],
    deviceAnomalies: [{
      date: Date,
      deviceId: String,
      description: String
    }],
    multipleSimultaneousLogins: Number
  },
  
  // Risk Assessment
  riskScore: Number (required, 0-100),
  riskLevel: String (enum: ['Low', 'Medium', 'High', 'Critical']),
  
  // Detection Metadata
  detectionTimestamp: Date,
  detectionMethod: String (enum: ['Automated', 'Manual Review', 'AI Analysis', 'Hybrid']),
  
  // System Information
  systemRemarks: String (max 2000 chars),
  evidenceFiles: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    uploadedAt: Date
  }],
  
  // Status & Review
  status: String (enum: ['Pending Review', 'Under Investigation', 'Confirmed', 'Dismissed', 'Resolved']),
  reviewedBy: String,
  reviewedAt: Date,
  reviewNotes: String (max 2000 chars),
  
  // Actions
  actionTaken: String (enum: ['None', 'Warning Issued', 'Grade Penalty', 'Suspension', 'Expulsion', 'Under Review']),
  actionDate: Date,
  notificationSent: Boolean,
  notificationDate: Date
}
```

## API Endpoints

### 1. Create Fraud Report
**POST** `/api/fraud-reports`

Creates a new fraud report for a student.

**Request Body:**
```json
{
  "studentId": "STU001",
  "fraudType": "Plagiarism",
  "plagiarismScore": 85,
  "matchedSources": [
    {
      "source": "Wikipedia",
      "similarity": 75,
      "url": "https://en.wikipedia.org/wiki/Machine_Learning"
    },
    {
      "source": "ResearchGate Paper",
      "similarity": 65,
      "url": "https://researchgate.net/paper/12345"
    }
  ],
  "riskScore": 82,
  "systemRemarks": "High similarity detected in final project submission",
  "detectionMethod": "AI Analysis"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Fraud report created successfully",
  "data": {
    "_id": "65f8a...",
    "studentId": "STU001",
    "student": {
      "studentId": "STU001",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "department": "Computer Science",
      "year": 3
    },
    "fraudType": "Plagiarism",
    "plagiarismScore": 85,
    "matchedSources": [...],
    "riskScore": 82,
    "riskLevel": "Critical",
    "detectionTimestamp": "2026-02-10T10:30:00.000Z",
    "status": "Pending Review",
    "createdAt": "2026-02-10T10:30:00.000Z"
  }
}
```

---

### 2. Get All Fraud Reports (with Filtering)
**GET** `/api/fraud-reports`

Retrieves fraud reports with filtering, pagination, and sorting.

**Query Parameters:**
- `fraudType` (optional): Filter by fraud type
- `studentId` (optional): Filter by student ID
- `status` (optional): Filter by status
- `riskLevel` (optional): Filter by risk level
- `startDate` (optional): Filter by detection start date (ISO format)
- `endDate` (optional): Filter by detection end date (ISO format)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `sortBy` (optional, default: 'detectionTimestamp'): Sort field
- `sortOrder` (optional, default: 'desc'): Sort order (asc/desc)

**Example Request:**
```
GET /api/fraud-reports?fraudType=Plagiarism&riskLevel=High&page=1&limit=20&sortBy=riskScore&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f8a...",
      "studentId": "STU001",
      "student": {...},
      "fraudType": "Plagiarism",
      "riskScore": 85,
      "riskLevel": "Critical",
      "status": "Pending Review",
      "detectionTimestamp": "2026-02-10T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalReports": 47,
    "reportsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. Get Fraud Report by ID
**GET** `/api/fraud-reports/:id`

Retrieves a single fraud report with full details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f8a...",
    "studentId": "STU001",
    "student": {
      "studentId": "STU001",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "department": "Computer Science",
      "year": 3,
      "gpa": 3.5,
      "attendance": 85
    },
    "fraudType": "Plagiarism",
    "plagiarismScore": 85,
    "matchedSources": [...],
    "riskScore": 82,
    "riskLevel": "Critical",
    "detectionTimestamp": "2026-02-10T10:30:00.000Z",
    "systemRemarks": "High similarity detected...",
    "status": "Pending Review",
    "createdAt": "2026-02-10T10:30:00.000Z",
    "updatedAt": "2026-02-10T10:30:00.000Z"
  }
}
```

---

### 4. Update Fraud Report
**PUT** `/api/fraud-reports/:id`

Updates an existing fraud report.

**Request Body:**
```json
{
  "status": "Confirmed",
  "reviewedBy": "Dr. Smith",
  "reviewNotes": "Plagiarism confirmed after manual review",
  "actionTaken": "Grade Penalty",
  "actionDate": "2026-02-11T09:00:00.000Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Fraud report updated successfully",
  "data": {
    "_id": "65f8a...",
    "status": "Confirmed",
    "reviewedBy": "Dr. Smith",
    "reviewedAt": "2026-02-11T09:00:00.000Z",
    "actionTaken": "Grade Penalty",
    ...
  }
}
```

---

### 5. Delete Fraud Report
**DELETE** `/api/fraud-reports/:id`

Deletes a fraud report.

**Response (200):**
```json
{
  "success": true,
  "message": "Fraud report deleted successfully",
  "data": {...}
}
```

---

### 6. Get Fraud Reports by Student
**GET** `/api/fraud-reports/student/:studentId`

Retrieves all fraud reports for a specific student.

**Example Request:**
```
GET /api/fraud-reports/student/STU001
```

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 3
}
```

---

### 7. Get Fraud Statistics
**GET** `/api/fraud-reports/statistics/summary`

Retrieves statistical summary of fraud reports.

**Query Parameters:**
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `fraudType` (optional): Filter by fraud type
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalReports": 127,
      "averageRiskScore": 65.3,
      "criticalCases": 23,
      "highRiskCases": 45,
      "mediumRiskCases": 38,
      "lowRiskCases": 21,
      "pendingReview": 34,
      "underInvestigation": 18,
      "confirmedCases": 52
    },
    "fraudTypeDistribution": [
      {
        "_id": "Plagiarism",
        "count": 45,
        "averageRiskScore": 72.5,
        "criticalCount": 12
      },
      {
        "_id": "Attendance Manipulation",
        "count": 38,
        "averageRiskScore": 58.3,
        "criticalCount": 5
      }
    ]
  }
}
```

---

### 8. Get High-Risk Reports
**GET** `/api/fraud-reports/high-risk`

Retrieves fraud reports with High or Critical risk levels.

**Query Parameters:**
- `limit` (optional, default: 20): Maximum number of reports

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 15
}
```

---

### 9. Get Recent Reports
**GET** `/api/fraud-reports/recent`

Retrieves fraud reports from recent days.

**Query Parameters:**
- `days` (optional, default: 7): Number of days to look back
- `limit` (optional, default: 10): Maximum number of reports

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 8
}
```

---

### 10. Export Reports to CSV
**GET** `/api/fraud-reports/export/csv`

Exports fraud reports to CSV format.

**Query Parameters:**
- Same filtering options as Get All Fraud Reports

**Response (200):**
- Content-Type: `text/csv`
- File download with name: `fraud-reports-{timestamp}.csv`

---

### 11. Export Reports to JSON
**GET** `/api/fraud-reports/export/json`

Exports fraud reports to JSON format.

**Query Parameters:**
- Same filtering options as Get All Fraud Reports

**Response (200):**
```json
{
  "success": true,
  "exportDate": "2026-02-10T12:00:00.000Z",
  "totalReports": 47,
  "filters": {...},
  "data": [...]
}
```

---

### 12. Bulk Create Fraud Reports
**POST** `/api/fraud-reports/bulk`

Creates multiple fraud reports at once (for testing/migration).

**Request Body:**
```json
{
  "reports": [
    {
      "studentId": "STU001",
      "fraudType": "Plagiarism",
      "riskScore": 85,
      "systemRemarks": "Suspicious submission detected"
    },
    {
      "studentId": "STU002",
      "fraudType": "Attendance Manipulation",
      "riskScore": 62,
      "attendanceIrregularities": {
        "inconsistentRecords": 5,
        "proxyAttendanceIndicators": 3
      }
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Bulk fraud report creation completed",
  "data": {
    "successful": ["65f8a...", "65f8b..."],
    "failed": []
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Fraud report not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating fraud report",
  "error": "Error details"
}
```

---

## Usage Examples

### Example 1: Create a Plagiarism Report
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
        "url": "https://en.wikipedia.org/wiki/AI"
      }
    ],
    "riskScore": 82,
    "systemRemarks": "High similarity in assignment"
  }'
```

### Example 2: Get All High-Risk Plagiarism Cases
```bash
curl "http://localhost:5000/api/fraud-reports?fraudType=Plagiarism&riskLevel=High&page=1&limit=20"
```

### Example 3: Export Reports to CSV
```bash
curl "http://localhost:5000/api/fraud-reports/export/csv?startDate=2026-01-01&endDate=2026-02-10" \
  -o fraud-reports.csv
```

### Example 4: Update Report Status
```bash
curl -X PUT http://localhost:5000/api/fraud-reports/65f8a... \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Confirmed",
    "reviewedBy": "Dr. Smith",
    "actionTaken": "Warning Issued"
  }'
```

---

## Security Considerations

1. **Authentication**: Add JWT authentication middleware to protect routes
2. **Authorization**: Implement role-based access control (RBAC)
3. **Data Privacy**: Ensure GDPR/FERPA compliance for student data
4. **Audit Logging**: Track all access and modifications to fraud reports
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Input Validation**: All inputs are validated at the model level

---

## Integration with Frontend

The fraud reports module integrates seamlessly with the existing React frontend:

1. **API Service**: Use the existing `axios.js` configuration
2. **Context**: Create a `FraudReportContext` similar to `AuthContext`
3. **Components**: Implement table views, detail views, and forms
4. **Real-time Updates**: Consider WebSocket integration for live notifications

Example API service integration:
```javascript
// In client/src/api/services.js
export const fraudReportAPI = {
  getAll: (params) => api.get('/fraud-reports', { params }),
  getById: (id) => api.get(`/fraud-reports/${id}`),
  create: (data) => api.post('/fraud-reports', data),
  update: (id, data) => api.put(`/fraud-reports/${id}`, data),
  delete: (id) => api.delete(`/fraud-reports/${id}`),
  exportCSV: (params) => api.get('/fraud-reports/export/csv', { 
    params, 
    responseType: 'blob' 
  }),
  getStatistics: (params) => api.get('/fraud-reports/statistics/summary', { params })
};
```

---

## Testing

Use the provided `test_fraud_api.js` script to test all endpoints:

```bash
cd server
node test_fraud_api.js
```

---

## Performance Optimization

1. **Indexes**: Created on frequently queried fields (studentId, fraudType, detectionTimestamp, riskScore, status)
2. **Population**: Use `.lean()` for read-only operations
3. **Pagination**: Implemented for all list endpoints
4. **Caching**: Consider Redis caching for statistics and frequently accessed reports
5. **Aggregation**: Use MongoDB aggregation pipeline for complex queries

---

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for instant alerts
2. **ML Integration**: Advanced fraud detection algorithms
3. **Document Storage**: Integration with cloud storage (AWS S3, Azure Blob)
4. **Reporting Dashboard**: Advanced analytics and visualizations
5. **Automated Workflows**: Trigger actions based on risk scores
6. **Email Notifications**: Automatic email alerts for high-risk cases
7. **API Versioning**: Implement versioning for backward compatibility
