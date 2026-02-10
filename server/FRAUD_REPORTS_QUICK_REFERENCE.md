# Fraud Reports API - Quick Reference

## Quick Start Commands

```bash
# 1. Install dependencies (already done)
cd server
npm install

# 2. Start server
npm run dev

# 3. Generate sample data
node sample_fraud_reports.js

# 4. Test API
node test_fraud_api.js
```

## API Endpoints Summary

### Base URL
```
http://localhost:5000/api/fraud-reports
```

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create fraud report |
| POST | `/bulk` | Bulk create reports |
| GET | `/` | Get all reports (with filters) |
| GET | `/:id` | Get report by ID |
| PUT | `/:id` | Update report |
| DELETE | `/:id` | Delete report |
| GET | `/student/:studentId` | Get reports by student |
| GET | `/statistics/summary` | Get statistics |
| GET | `/high-risk` | Get high-risk reports |
| GET | `/recent` | Get recent reports |
| GET | `/export/csv` | Export to CSV |
| GET | `/export/json` | Export to JSON |

## Common Query Parameters

```javascript
// Filtering
fraudType: 'Plagiarism' | 'Attendance Manipulation' | 'Identity Fraud' | 'Exam Cheating' | 'Grade Tampering' | 'Multiple Fraud Types'
riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
status: 'Pending Review' | 'Under Investigation' | 'Confirmed' | 'Dismissed' | 'Resolved'
studentId: string

// Date Range
startDate: '2026-01-01T00:00:00Z'
endDate: '2026-02-10T23:59:59Z'

// Pagination
page: 1  (default)
limit: 10  (default)

// Sorting
sortBy: 'detectionTimestamp' | 'riskScore' | 'studentId'
sortOrder: 'asc' | 'desc'
```

## Request Body Examples

### Create Plagiarism Report
```json
{
  "studentId": "STU001",
  "fraudType": "Plagiarism",
  "plagiarismScore": 85,
  "matchedSources": [
    {
      "source": "Wikipedia",
      "similarity": 75,
      "url": "https://example.com"
    }
  ],
  "riskScore": 82,
  "systemRemarks": "High similarity detected"
}
```

### Create Attendance Fraud Report
```json
{
  "studentId": "STU002",
  "fraudType": "Attendance Manipulation",
  "attendanceIrregularities": {
    "suspiciousPatterns": [{
      "date": "2026-02-01T10:00:00Z",
      "pattern": "Proxy Attendance",
      "description": "Multiple IPs detected"
    }],
    "inconsistentRecords": 5,
    "proxyAttendanceIndicators": 3
  },
  "riskScore": 65,
  "systemRemarks": "Proxy attendance suspected"
}
```

### Create Identity Fraud Report
```json
{
  "studentId": "STU003",
  "fraudType": "Identity Fraud",
  "identityAnomalies": {
    "biometricMismatch": true,
    "ipAddressAnomalies": [{
      "date": "2026-02-05T14:30:00Z",
      "ipAddress": "192.168.1.100",
      "location": "Unknown",
      "description": "Suspicious login"
    }],
    "multipleSimultaneousLogins": 2
  },
  "riskScore": 78,
  "systemRemarks": "Biometric failed"
}
```

### Update Report Status
```json
{
  "status": "Confirmed",
  "reviewedBy": "Dr. Smith",
  "reviewNotes": "Confirmed after investigation",
  "actionTaken": "Grade Penalty",
  "actionDate": "2026-02-11T09:00:00Z"
}
```

## cURL Examples

### Create Report
```bash
curl -X POST http://localhost:5000/api/fraud-reports \
  -H "Content-Type: application/json" \
  -d '{"studentId":"STU001","fraudType":"Plagiarism","riskScore":85}'
```

### Get All Reports
```bash
curl "http://localhost:5000/api/fraud-reports?page=1&limit=10"
```

### Filter by Type and Risk
```bash
curl "http://localhost:5000/api/fraud-reports?fraudType=Plagiarism&riskLevel=High"
```

### Get Statistics
```bash
curl "http://localhost:5000/api/fraud-reports/statistics/summary"
```

### Export to CSV
```bash
curl "http://localhost:5000/api/fraud-reports/export/csv" -o reports.csv
```

### Update Report
```bash
curl -X PUT http://localhost:5000/api/fraud-reports/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"Confirmed","reviewedBy":"Dr. Smith"}'
```

### Delete Report
```bash
curl -X DELETE http://localhost:5000/api/fraud-reports/{id}
```

## JavaScript/Axios Examples

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Get all reports
const reports = await api.get('/fraud-reports', {
  params: { page: 1, limit: 10, fraudType: 'Plagiarism' }
});

// Get report by ID
const report = await api.get(`/fraud-reports/${id}`);

// Create report
const newReport = await api.post('/fraud-reports', {
  studentId: 'STU001',
  fraudType: 'Plagiarism',
  riskScore: 85
});

// Update report
const updated = await api.put(`/fraud-reports/${id}`, {
  status: 'Confirmed',
  reviewedBy: 'Dr. Smith'
});

// Delete report
await api.delete(`/fraud-reports/${id}`);

// Export CSV
const csvBlob = await api.get('/fraud-reports/export/csv', {
  responseType: 'blob'
});
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
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

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Fraud Types

1. **Plagiarism** - Copied content, citation issues
2. **Attendance Manipulation** - Proxy attendance, fake records
3. **Identity Fraud** - Impersonation, biometric mismatch
4. **Exam Cheating** - Unauthorized help, answer copying
5. **Grade Tampering** - Unauthorized grade changes
6. **Multiple Fraud Types** - Combination of above

## Risk Levels (Auto-calculated)

- **Critical**: Risk Score ≥ 80
- **High**: Risk Score 60-79
- **Medium**: Risk Score 30-59
- **Low**: Risk Score < 30

## Status Workflow

```
Pending Review
    ↓
Under Investigation
    ↓
Confirmed / Dismissed / Resolved
```

## Action Types

- **None** - No action taken yet
- **Warning Issued** - Formal warning given
- **Grade Penalty** - Grade reduction applied
- **Suspension** - Student suspended
- **Expulsion** - Student expelled
- **Under Review** - Action being determined

## Files Created

### Backend Files
- `src/models/FraudReport.js` - Mongoose model
- `src/controllers/fraudController.js` - Business logic
- `src/routes/fraudRoutes.js` - API routes
- `src/app.js` - Updated with fraud routes

### Documentation
- `FRAUD_REPORTS_API_DOCUMENTATION.md` - Detailed API docs
- `FRAUD_REPORTS_IMPLEMENTATION_GUIDE.md` - Usage guide
- `FRAUD_REPORTS_QUICK_REFERENCE.md` - This file

### Scripts
- `sample_fraud_reports.js` - Sample data generator
- `test_fraud_api.js` - API test suite

## Dependencies Added

```json
{
  "json2csv": "^5.0.7"
}
```

## Database Collections

- **fraudreports** - Main collection for fraud reports
- **students** - Referenced for student details

## Indexes Created

- `studentId_1_fraudType_1` - Compound index
- `detectionTimestamp_-1` - Descending
- `riskScore_-1` - Descending
- `status_1` - Ascending
- `riskLevel_1` - Ascending

## Key Features

✅ Comprehensive fraud detection data model  
✅ Multiple fraud type support  
✅ Automatic risk level calculation  
✅ Flexible filtering and pagination  
✅ CSV and JSON export  
✅ Statistical analysis  
✅ Audit trail (timestamps, reviewers)  
✅ Status workflow management  
✅ Evidence file tracking  
✅ Performance-optimized indexes  
✅ Full CRUD operations  
✅ Bulk operations support  
✅ Date range filtering  
✅ Student-specific reports  

---

## Need Help?

1. **API Documentation**: See `FRAUD_REPORTS_API_DOCUMENTATION.md`
2. **Implementation Guide**: See `FRAUD_REPORTS_IMPLEMENTATION_GUIDE.md`
3. **Test the API**: Run `node test_fraud_api.js`
4. **Generate Sample Data**: Run `node sample_fraud_reports.js`
