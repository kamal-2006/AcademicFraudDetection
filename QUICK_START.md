# Quick Start Guide - Attendance & Exam Performance Modules

This guide will help you quickly set up and test the new Attendance and Exam Performance modules.

## 📋 Prerequisites

- MongoDB running (default: mongodb://localhost:27017)
- Node.js installed
- Backend and frontend servers configured

## 🚀 Quick Setup (5 Steps)

### Step 1: Install Required Dependencies

The modules use existing dependencies. Verify they're installed:

```bash
cd server
npm install
```

### Step 2: Restart Backend Server

The new routes need to be loaded:

```bash
# Stop the current server (Ctrl+C if running)
npm start
```

The server should now include:
- `/api/attendance` routes (8 endpoints)
- `/api/exams` routes (9 endpoints)

### Step 3: Verify Students Exist

The modules require existing students. Check if you have students:

```bash
curl http://localhost:5000/api/students
```

If you don't have students, create at least 5 with IDs: STU001, STU002, STU003, STU004, STU005

### Step 4: Populate Sample Data

Run the data population script:

```bash
node populate_sample_data.js
```

This will create:
- 10 attendance records (various attendance percentages)
- 15 exam records (various grades and performance levels)

Expected output:
```
✅ MongoDB connected successfully
✅ Found X students in database
📚 Populating Attendance Data...
📝 Populating Exam Performance Data...
📊 Database Statistics:
   - Average Attendance: XX.XX%
   - Average Score: XX.XX%
   - Pass Rate: XX.XX%
✅ Sample data population completed successfully!
```

### Step 5: Test the APIs

Run the automated test suite:

```bash
node test_attendance_exam_api.js
```

This tests all 17 endpoints and CRUD operations.

## 🌐 View in Browser

### Attendance Page
http://localhost:5174/attendance

**Features to test:**
- View all attendance records in table
- Search by student ID, name, or subject
- Filter by subject, status (regular/warning/critical), semester
- View summary statistics (avg attendance, status counts)
- View low attendance students table

**Expected Data:**
- STU001: ~87% attendance (Regular)
- STU002: ~65% attendance (Warning)  
- STU003: ~45% attendance (Critical)
- STU004: ~95% attendance (Regular)
- STU005: ~55% attendance (Critical)

### Exam Performance Page
http://localhost:5174/exams

**Features to test:**
- View all exam records in table
- Search by student ID, name, exam name, or subject
- Filter by subject, exam type (Midterm/Quiz/Assignment/Final), status (pass/fail), semester
- View summary statistics (total exams, avg score, pass rate)
- View grade distribution with color-coded badges
- View high-risk students table

**Expected Data:**
- STU001: A-/A grades (90-95%)
- STU002: C grades (60-65%)
- STU003: F grades (40-50%)
- STU004: A+ grades (95-100%)
- STU005: F grades (30-45%)

### Dashboard
http://localhost:5174/dashboard

**New Metrics to Verify:**
1. **Attendance Overview Card:**
   - Average Attendance %
   - Regular Students count
   - Warning Students count
   - Critical Students count

2. **Exam Performance Card:**
   - Total Exams
   - Average Score %
   - Pass Count
   - Fail Count

3. **Risk Summary Card:**
   - Low Attendance Students
   - Failing Students
   - High-Risk Students

4. **Charts:**
   - Pie Chart: Attendance status distribution
   - Bar Chart: Exam pass/fail comparison

5. **High-Risk Students Table:**
   - Combined view of low attendance and poor exam performance
   - Shows top 10 at-risk students with reasons

## 🧪 Manual Testing with curl

### Create Attendance Record

```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "subject": "Software Engineering",
    "totalClasses": 40,
    "attendedClasses": 36,
    "month": "March",
    "year": 2026,
    "semester": "Spring",
    "remarks": "Good attendance"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "studentId": "STU001",
    "attendancePercentage": 90,
    "status": "regular",
    ...
  }
}
```

### Create Exam Record

```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "examName": "Midterm Exam",
    "examType": "Midterm",
    "subject": "Software Engineering",
    "totalMarks": 100,
    "obtainedMarks": 85,
    "semester": "Spring",
    "year": 2026,
    "examDate": "2026-03-10"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "studentId": "STU001",
    "percentage": 85,
    "grade": "A-",
    "status": "Pass",
    ...
  }
}
```

### Get Statistics

```bash
# Attendance stats
curl http://localhost:5000/api/attendance/stats/overview

# Exam stats
curl http://localhost:5000/api/exams/stats/overview

# Low attendance students (threshold 75%)
curl http://localhost:5000/api/attendance/stats/low-attendance?threshold=75

# High-risk students
curl http://localhost:5000/api/exams/stats/high-risk
```

## 🔍 Troubleshooting

### "Cannot GET /api/attendance"
**Problem:** Routes not loaded  
**Solution:** Restart the backend server

### "Student not found"
**Problem:** No students in database  
**Solution:** Create students first before adding attendance/exam records

### Frontend shows empty tables
**Problem:** No data in database  
**Solution:** Run `node populate_sample_data.js`

### API returns 500 error
**Problem:** MongoDB connection issue  
**Solution:** Check MongoDB is running: `mongosh` or check connection string in .env

### Frontend not updating
**Problem:** API endpoint issue or CORS  
**Solution:** 
- Check browser console for errors
- Verify API returns data: `curl http://localhost:5000/api/attendance`
- Check CORS is enabled in server/src/app.js

## 📊 Expected Test Results

After running all steps, you should have:

✅ **Backend:**
- 2 new models (Attendance, ExamPerformance)
- 19 controller functions
- 17 API endpoints
- Sample data populated

✅ **Frontend:**
- Attendance page showing 10 records
- Exam Performance page showing 15 records
- Dashboard with 6 new metric cards and 2 charts
- All filters and search working

✅ **Database:**
- Collections: `attendances` and `examperformances`
- Indexes created automatically
- Data with auto-calculated percentages, grades, status

## 📚 Next Steps

1. **Add More Data:**
   - Create records for February, March, April
   - Add more exam types (Lab, Project, Practical)
   - Test with different subjects

2. **Test Edge Cases:**
   - 0% attendance
   - 100% scores
   - Duplicate records (should be prevented)
   - Invalid data (attended > total)

3. **Test Filtering:**
   - Try all filter combinations
   - Test search with partial matches
   - Verify pagination works with large datasets

4. **Test Real-time Updates:**
   - Create a new record via API
   - Refresh frontend page
   - Verify dashboard updates immediately

## 📞 Support

For detailed documentation, see:
- `ATTENDANCE_EXAM_MODULE_GUIDE.md` - Complete implementation guide
- `server/sample_attendance.js` - Sample attendance data structure
- `server/sample_exams.js` - Sample exam data structure

## ✅ Success Checklist

- [ ] Backend server running on http://localhost:5000
- [ ] Frontend server running on http://localhost:5174
- [ ] MongoDB running and connected
- [ ] Students exist in database (at least 5)
- [ ] Sample data populated successfully
- [ ] API test suite passes all tests
- [ ] Attendance page loads with data
- [ ] Exam Performance page loads with data
- [ ] Dashboard shows new metrics and charts
- [ ] Filters and search work correctly
- [ ] Can create new records via API
- [ ] Data updates reflect immediately

🎉 **Congratulations!** Your Attendance and Exam Performance modules are now fully operational!
