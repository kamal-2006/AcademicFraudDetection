/**
 * API Testing Script for Attendance and Exam Performance Modules
 * 
 * This script tests all the new API endpoints to verify they're working correctly.
 * 
 * Prerequisites:
 * 1. Backend server must be running (npm start in server folder)
 * 2. Database must be populated with sample data (run populate_sample_data.js first)
 * 
 * Usage: node test_attendance_exam_api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log results
const logResult = (testName, success, data = null, error = null) => {
  const status = success ? 
    `${colors.green}✓ PASS${colors.reset}` : 
    `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`${status} - ${testName}`);
  
  if (data && success) {
    console.log(`  ${colors.cyan}→ Data:${colors.reset}`, JSON.stringify(data).substring(0, 100) + '...');
  }
  
  if (error && !success) {
    console.log(`  ${colors.red}→ Error:${colors.reset}`, error);
  }
  
  console.log('');
};

// Test Attendance Endpoints
const testAttendanceEndpoints = async () => {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}  TESTING ATTENDANCE ENDPOINTS${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // 1. Get all attendance records
  try {
    const response = await axios.get(`${BASE_URL}/attendance`);
    logResult(
      'GET /api/attendance - Fetch all records',
      response.data.success,
      { count: response.data.data.length, total: response.data.pagination?.total }
    );
  } catch (error) {
    logResult('GET /api/attendance', false, null, error.message);
  }
  
  // 2. Get attendance with filters
  try {
    const response = await axios.get(`${BASE_URL}/attendance?subject=Data Structures&status=critical`);
    logResult(
      'GET /api/attendance?subject=Data Structures&status=critical',
      response.data.success,
      { filteredCount: response.data.data.length }
    );
  } catch (error) {
    logResult('GET /api/attendance (with filters)', false, null, error.message);
  }
  
  // 3. Get attendance statistics
  try {
    const response = await axios.get(`${BASE_URL}/attendance/stats/overview`);
    logResult(
      'GET /api/attendance/stats/overview',
      response.data.success,
      response.data.data
    );
  } catch (error) {
    logResult('GET /api/attendance/stats/overview', false, null, error.message);
  }
  
  // 4. Get low attendance students
  try {
    const response = await axios.get(`${BASE_URL}/attendance/stats/low-attendance?threshold=75`);
    logResult(
      'GET /api/attendance/stats/low-attendance?threshold=75',
      response.data.success,
      { lowAttendanceCount: response.data.data.length }
    );
  } catch (error) {
    logResult('GET /api/attendance/stats/low-attendance', false, null, error.message);
  }
  
  // 5. Get attendance subjects
  try {
    const response = await axios.get(`${BASE_URL}/attendance/filters/subjects`);
    logResult(
      'GET /api/attendance/filters/subjects',
      response.data.success,
      { subjects: response.data.data }
    );
  } catch (error) {
    logResult('GET /api/attendance/filters/subjects', false, null, error.message);
  }
  
  // 6. Get attendance by student ID
  try {
    const response = await axios.get(`${BASE_URL}/attendance/student/STU001`);
    logResult(
      'GET /api/attendance/student/STU001',
      response.data.success,
      { studentRecords: response.data.data.records?.length, stats: response.data.data.statistics }
    );
  } catch (error) {
    logResult('GET /api/attendance/student/STU001', false, null, error.message);
  }
};

// Test Exam Performance Endpoints
const testExamEndpoints = async () => {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}  TESTING EXAM PERFORMANCE ENDPOINTS${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // 1. Get all exam records
  try {
    const response = await axios.get(`${BASE_URL}/exams`);
    logResult(
      'GET /api/exams - Fetch all records',
      response.data.success,
      { count: response.data.data.length, total: response.data.pagination?.total }
    );
  } catch (error) {
    logResult('GET /api/exams', false, null, error.message);
  }
  
  // 2. Get exams with filters
  try {
    const response = await axios.get(`${BASE_URL}/exams?examType=Midterm&status=fail`);
    logResult(
      'GET /api/exams?examType=Midterm&status=fail',
      response.data.success,
      { filteredCount: response.data.data.length }
    );
  } catch (error) {
    logResult('GET /api/exams (with filters)', false, null, error.message);
  }
  
  // 3. Get exam statistics
  try {
    const response = await axios.get(`${BASE_URL}/exams/stats/overview`);
    logResult(
      'GET /api/exams/stats/overview',
      response.data.success,
      { 
        avgPercentage: response.data.data.avgPercentage,
        passRate: response.data.data.passRate,
        gradeDistribution: response.data.data.gradeDistribution
      }
    );
  } catch (error) {
    logResult('GET /api/exams/stats/overview', false, null, error.message);
  }
  
  // 4. Get failing students
  try {
    const response = await axios.get(`${BASE_URL}/exams/stats/failing`);
    logResult(
      'GET /api/exams/stats/failing',
      response.data.success,
      { failingStudentsCount: response.data.data.length }
    );
  } catch (error) {
    logResult('GET /api/exams/stats/failing', false, null, error.message);
  }
  
  // 5. Get high-risk students
  try {
    const response = await axios.get(`${BASE_URL}/exams/stats/high-risk`);
    logResult(
      'GET /api/exams/stats/high-risk',
      response.data.success,
      { highRiskCount: response.data.data.length }
    );
  } catch (error) {
    logResult('GET /api/exams/stats/high-risk', false, null, error.message);
  }
  
  // 6. Get exam subjects
  try {
    const response = await axios.get(`${BASE_URL}/exams/filters/subjects`);
    logResult(
      'GET /api/exams/filters/subjects',
      response.data.success,
      { subjects: response.data.data }
    );
  } catch (error) {
    logResult('GET /api/exams/filters/subjects', false, null, error.message);
  }
  
  // 7. Get exam types
  try {
    const response = await axios.get(`${BASE_URL}/exams/filters/exam-types`);
    logResult(
      'GET /api/exams/filters/exam-types',
      response.data.success,
      { examTypes: response.data.data }
    );
  } catch (error) {
    logResult('GET /api/exams/filters/exam-types', false, null, error.message);
  }
  
  // 8. Get exams by student ID
  try {
    const response = await axios.get(`${BASE_URL}/exams/student/STU001`);
    logResult(
      'GET /api/exams/student/STU001',
      response.data.success,
      { 
        studentExams: response.data.data.exams?.length,
        avgPercentage: response.data.data.statistics?.avgPercentage,
        passRate: response.data.data.statistics?.passRate
      }
    );
  } catch (error) {
    logResult('GET /api/exams/student/STU001', false, null, error.message);
  }
};

// Test CRUD Operations
const testCRUDOperations = async () => {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}  TESTING CRUD OPERATIONS${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  let createdAttendanceId = null;
  let createdExamId = null;
  
  // Create Attendance Record
  try {
    const newAttendance = {
      studentId: 'STU001',
      subject: 'Software Engineering',
      totalClasses: 30,
      attendedClasses: 27,
      month: 'March',
      year: 2026,
      semester: 'Spring',
      remarks: 'Test record'
    };
    
    const response = await axios.post(`${BASE_URL}/attendance`, newAttendance);
    createdAttendanceId = response.data.data._id;
    logResult(
      'POST /api/attendance - Create record',
      response.data.success,
      { id: createdAttendanceId, percentage: response.data.data.attendancePercentage }
    );
  } catch (error) {
    logResult('POST /api/attendance', false, null, error.message);
  }
  
  // Update Attendance Record
  if (createdAttendanceId) {
    try {
      const updateData = {
        attendedClasses: 28,
        remarks: 'Updated test record'
      };
      
      const response = await axios.put(`${BASE_URL}/attendance/${createdAttendanceId}`, updateData);
      logResult(
        'PUT /api/attendance/:id - Update record',
        response.data.success,
        { newPercentage: response.data.data.attendancePercentage }
      );
    } catch (error) {
      logResult('PUT /api/attendance/:id', false, null, error.message);
    }
  }
  
  // Delete Attendance Record
  if (createdAttendanceId) {
    try {
      const response = await axios.delete(`${BASE_URL}/attendance/${createdAttendanceId}`);
      logResult('DELETE /api/attendance/:id - Delete record', response.data.success);
    } catch (error) {
      logResult('DELETE /api/attendance/:id', false, null, error.message);
    }
  }
  
  // Create Exam Record
  try {
    const newExam = {
      studentId: 'STU001',
      examName: 'Test Exam',
      examType: 'Quiz',
      subject: 'Software Engineering',
      totalMarks: 30,
      obtainedMarks: 27,
      semester: 'Spring',
      year: 2026,
      examDate: '2026-03-15',
      remarks: 'Test exam record'
    };
    
    const response = await axios.post(`${BASE_URL}/exams`, newExam);
    createdExamId = response.data.data._id;
    logResult(
      'POST /api/exams - Create record',
      response.data.success,
      { id: createdExamId, grade: response.data.data.grade, percentage: response.data.data.percentage }
    );
  } catch (error) {
    logResult('POST /api/exams', false, null, error.message);
  }
  
  // Update Exam Record
  if (createdExamId) {
    try {
      const updateData = {
        obtainedMarks: 29,
        remarks: 'Updated test exam'
      };
      
      const response = await axios.put(`${BASE_URL}/exams/${createdExamId}`, updateData);
      logResult(
        'PUT /api/exams/:id - Update record',
        response.data.success,
        { newGrade: response.data.data.grade, newPercentage: response.data.data.percentage }
      );
    } catch (error) {
      logResult('PUT /api/exams/:id', false, null, error.message);
    }
  }
  
  // Delete Exam Record
  if (createdExamId) {
    try {
      const response = await axios.delete(`${BASE_URL}/exams/${createdExamId}`);
      logResult('DELETE /api/exams/:id - Delete record', response.data.success);
    } catch (error) {
      logResult('DELETE /api/exams/:id', false, null, error.message);
    }
  }
};

// Main test execution
const runAllTests = async () => {
  console.log(`\n${colors.yellow}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.yellow}║  API TESTING SUITE FOR ATTENDANCE & EXAM MODULES  ║${colors.reset}`);
  console.log(`${colors.yellow}╚════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n${colors.cyan}Testing backend at: ${BASE_URL}${colors.reset}`);
  
  try {
    await testAttendanceEndpoints();
    await testExamEndpoints();
    await testCRUDOperations();
    
    console.log(`\n${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}  ✓ ALL TESTS COMPLETED${colors.reset}`);
    console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`${colors.cyan}📍 Next Steps:${colors.reset}`);
    console.log(`   1. Check frontend at http://localhost:5174/attendance`);
    console.log(`   2. Check exam performance at http://localhost:5174/exams`);
    console.log(`   3. Check dashboard at http://localhost:5174/dashboard`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Test suite error:${colors.reset}`, error.message);
  }
};

// Run the tests
runAllTests();
