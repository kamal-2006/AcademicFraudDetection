# Students API Documentation

## Base URL
```
http://localhost:5000/api/students
```

## Endpoints

### 1. Upload CSV File
**POST** `/upload`

Upload a CSV file containing student data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with a file field named `file`

**CSV Format:**
```csv
studentId,name,email,department,year,gpa,attendance,riskLevel
STU001,John Doe,john.doe@university.edu,Computer Science,3,3.5,92,Low
```

**Required CSV Fields:**
- `studentId` - Unique student identifier
- `name` - Student's full name
- `email` - Student's email address
- `department` - Department name
- `year` - Academic year (1-5)
- `gpa` - Grade Point Average (0-4)
- `attendance` - Attendance percentage (0-100)
- `riskLevel` - Risk level (Low, Medium, High, Critical) - Optional, will be auto-calculated

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed CSV file",
  "summary": {
    "totalRecords": 15,
    "validRecords": 15,
    "inserted": 15,
    "duplicates": 0,
    "validationErrors": 0
  }
}
```

**Validation Rules:**
- Student ID must be unique
- Email must be valid and unique
- Year must be between 1-5
- GPA must be between 0-4
- Attendance must be between 0-100
- Risk level automatically calculated if not provided

**Error Responses:**
```json
{
  "success": false,
  "message": "Error message",
  "validationErrors": [
    {
      "row": 2,
      "studentId": "STU001",
      "errors": ["GPA must be a number between 0 and 4"]
    }
  ],
  "duplicateErrors": [
    {
      "studentId": "STU002",
      "error": "Student ID already exists"
    }
  ]
}
```

---

### 2. Get All Students
**GET** `/`

Retrieve students with pagination, search, and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Records per page
- `search` (string) - Search by name, student ID, or email
- `riskLevel` (string) - Filter by risk level (Low, Medium, High, Critical)
- `department` (string) - Filter by department
- `year` (number) - Filter by academic year
- `sortBy` (string, default: 'createdAt') - Sort field
- `sortOrder` (string, default: 'desc') - Sort order (asc/desc)

**Examples:**
```
GET /api/students?page=1&limit=10
GET /api/students?search=John
GET /api/students?riskLevel=High
GET /api/students?department=Computer Science&year=3
GET /api/students?search=john&riskLevel=Low&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "studentId": "STU001",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "department": "Computer Science",
      "year": 3,
      "gpa": 3.5,
      "attendance": 92,
      "riskLevel": "Low",
      "createdAt": "2026-02-09T10:00:00.000Z",
      "updatedAt": "2026-02-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalRecords": 15,
    "pageSize": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. Get Student by ID
**GET** `/:id`

Get a single student by MongoDB ID.

**Parameters:**
- `id` - MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "studentId": "STU001",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "department": "Computer Science",
    "year": 3,
    "gpa": 3.5,
    "attendance": 92,
    "riskLevel": "Low"
  }
}
```

---

### 4. Get Student by Student ID
**GET** `/studentId/:studentId`

Get a student by their student ID (e.g., STU001).

**Parameters:**
- `studentId` - Student's unique ID

**Example:**
```
GET /api/students/studentId/STU001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "STU001",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "department": "Computer Science",
    "year": 3,
    "gpa": 3.5,
    "attendance": 92,
    "riskLevel": "Low"
  }
}
```

---

### 5. Update Student
**PUT** `/:id`

Update a student's information.

**Parameters:**
- `id` - MongoDB ObjectId

**Request Body:**
```json
{
  "name": "John Updated Doe",
  "email": "john.updated@university.edu",
  "department": "Computer Science",
  "year": 4,
  "gpa": 3.7,
  "attendance": 95,
  "riskLevel": "Low"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "studentId": "STU001",
    "name": "John Updated Doe",
    "email": "john.updated@university.edu",
    "gpa": 3.7,
    "attendance": 95,
    "riskLevel": "Low"
  }
}
```

---

### 6. Delete Student
**DELETE** `/:id`

Delete a student by ID.

**Parameters:**
- `id` - MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

---

### 7. Get Risk Statistics
**GET** `/stats/risk`

Get risk level distribution and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 15,
    "riskDistribution": [
      {
        "riskLevel": "Low",
        "count": 8,
        "percentage": "53.33",
        "avgGpa": "3.55",
        "avgAttendance": "91.25"
      },
      {
        "riskLevel": "Medium",
        "count": 3,
        "percentage": "20.00",
        "avgGpa": "2.73",
        "avgAttendance": "76.67"
      },
      {
        "riskLevel": "High",
        "count": 2,
        "percentage": "13.33",
        "avgGpa": "2.15",
        "avgAttendance": "57.50"
      },
      {
        "riskLevel": "Critical",
        "count": 2,
        "percentage": "13.33",
        "avgGpa": "1.65",
        "avgAttendance": "42.50"
      }
    ]
  }
}
```

---

### 8. Get Departments List
**GET** `/filters/departments`

Get a list of all unique departments for filtering.

**Response:**
```json
{
  "success": true,
  "data": [
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering"
  ]
}
```

---

### 9. Delete All Students
**DELETE** `/bulk/all`

Delete all students (for testing/admin purposes).

**⚠️ Warning:** This endpoint should be protected with authentication in production.

**Response:**
```json
{
  "success": true,
  "message": "Deleted 15 students"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created (successful upload)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Server Error

---

## Risk Level Calculation

Risk levels are automatically calculated based on GPA and attendance:

- **Critical**: GPA < 2.0 OR Attendance < 50%
- **High**: GPA < 2.5 OR Attendance < 70%
- **Medium**: GPA < 3.0 OR Attendance < 85%
- **Low**: GPA >= 3.0 AND Attendance >= 85%

---

## Testing with cURL

### Upload CSV
```bash
curl -X POST http://localhost:5000/api/students/upload \
  -F "file=@sample_students.csv"
```

### Get All Students
```bash
curl http://localhost:5000/api/students
```

### Search Students
```bash
curl "http://localhost:5000/api/students?search=John"
```

### Filter by Risk Level
```bash
curl "http://localhost:5000/api/students?riskLevel=High"
```

### Get Risk Statistics
```bash
curl http://localhost:5000/api/students/stats/risk
```

---

## Testing with Postman

1. **Upload CSV:**
   - Method: POST
   - URL: `http://localhost:5000/api/students/upload`
   - Body: form-data
   - Key: `file` (type: File)
   - Select your CSV file

2. **Get Students:**
   - Method: GET
   - URL: `http://localhost:5000/api/students`
   - Add query parameters as needed

3. **Search/Filter:**
   - Method: GET
   - URL: `http://localhost:5000/api/students?search=John&riskLevel=Low`

---

## Frontend Integration Example

```javascript
// Upload CSV
const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:5000/api/students/upload', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
};

// Get students with filters
const getStudents = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:5000/api/students?${params}`);
  return await response.json();
};

// Search students
const searchStudents = async (searchTerm) => {
  const response = await fetch(
    `http://localhost:5000/api/students?search=${searchTerm}`
  );
  return await response.json();
};
```

---

## Database Schema

```javascript
{
  studentId: String (unique, indexed),
  name: String (indexed),
  email: String (unique, indexed),
  department: String,
  year: Number (1-5),
  gpa: Number (0-4),
  attendance: Number (0-100),
  riskLevel: String (Low/Medium/High/Critical),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- CSV files must not exceed 5MB
- Duplicate student IDs or emails will be reported but not inserted
- Invalid records will be reported without stopping the entire upload
- Text search is case-insensitive
- The API supports multiple CSV formats (different column name conventions)
