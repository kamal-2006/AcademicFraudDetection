# Academic Fraud Detection System - Backend

Node.js/Express backend API for the Intelligent Academic Fraud Detection System.

> **📖 For complete project documentation, setup instructions, and API reference, see the [main README](../README.md)**

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB v7.0+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/academic_fraud_detection

# Start the server
npm start
```

Server runs on http://localhost:5000

## Environment Variables

Create a `.env` file with:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/academic_fraud_detection
CLIENT_URL=http://localhost:5174
```

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `POST /api/students/upload` - Bulk upload CSV
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/stats/overview` - Get statistics
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance/:id` - Update record
- `DELETE /api/attendance/:id` - Delete record

### Exam Performance
- `GET /api/exams` - Get exam records
- `GET /api/exams/stats/overview` - Get statistics
- `GET /api/exams/stats/high-risk` - Get high-risk students
- `POST /api/exams` - Create exam record
- `PUT /api/exams/:id` - Update record
- `DELETE /api/exams/:id` - Delete record

For complete API documentation, see [ATTENDANCE_EXAM_MODULE_GUIDE.md](../ATTENDANCE_EXAM_MODULE_GUIDE.md)

## Testing

### Populate Sample Data

```bash
node populate_sample_data.js
```

### Run API Tests

```bash
node test_attendance_exam_api.js
```

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose schemas
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── sample_attendance.js     # Sample data
├── sample_exams.js         # Sample data
├── populate_sample_data.js # Data population script
├── server.js               # Entry point
└── package.json
```

## Database Models

### Student
- studentId, name, email, department
- dateOfBirth, enrollmentDate
- gpa, riskLevel

### Attendance
- studentId (ref: Student)
- subject, month, year, semester
- totalClasses, attendedClasses
- attendancePercentage (auto-calculated)
- status (regular/warning/critical)

### ExamPerformance
- studentId (ref: Student)
- examName, examType, subject, examDate
- totalMarks, obtainedMarks
- percentage, grade, status (auto-calculated)

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start
```

## Technologies

- **Express 5.2.1** - Web framework
- **Mongoose 9.1.6** - MongoDB ODM
- **Multer** - File upload handling
- **CSV-Parser** - CSV processing
- **CORS** - Cross-origin resource sharing

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](../LICENSE) file for details.
