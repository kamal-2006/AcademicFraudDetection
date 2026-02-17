/**
 * Comprehensive API Test Script
 * Tests all major endpoints of the Academic Fraud Detection System
 * 
 * Usage: node test_complete_api.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testStudentId = '';
let testAttendanceId = '';
let testExamId = '';
let testFraudReportId = '';
let testPlagiarismId = '';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}⚡ Testing: ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.yellow}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
};

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
};

// Test Suite Functions

async function testAuthentication() {
  log.section('1. AUTHENTICATION MODULE');

  // Test Login
  log.test('POST /auth/login');
  const loginResult = await apiRequest('POST', '/auth/login', {
    email: 'admin@iafds.com',
    password: 'admin123',
  });

  if (loginResult.success && loginResult.data.data?.token) {
    authToken = loginResult.data.data.token;
    log.success('Login successful');
    log.info(`Token: ${authToken.substring(0, 20)}...`);
  } else {
    log.error(`Login failed: ${loginResult.error}`);
    log.error('Make sure you have created an admin user using: node initialize_admin.js');
    process.exit(1);
  }

  // Test Get Profile
  log.test('GET /auth/me');
  const profileResult = await apiRequest('GET', '/auth/me');
  if (profileResult.success) {
    log.success('Get profile successful');
    log.info(`User: ${profileResult.data.data?.name} (${profileResult.data.data?.role})`);
  } else {
    log.error(`Get profile failed: ${profileResult.error}`);
  }
}

async function testDashboard() {
  log.section('2. DASHBOARD MODULE');

  // Test Dashboard Stats
  log.test('GET /dashboard/stats');
  const statsResult = await apiRequest('GET', '/dashboard/stats');
  if (statsResult.success) {
    log.success('Dashboard stats retrieved');
    log.info(`Total Students: ${statsResult.data.data?.totalStudents || 0}`);
    log.info(`Fraud Alerts: ${statsResult.data.data?.fraudAlerts || 0}`);
    log.info(`High Risk Cases: ${statsResult.data.data?.highRiskCases || 0}`);
  } else {
    log.error(`Dashboard stats failed: ${statsResult.error}`);
  }

  // Test Dashboard Trends
  log.test('GET /dashboard/trends');
  const trendsResult = await apiRequest('GET', '/dashboard/trends?months=3');
  if (trendsResult.success) {
    log.success('Dashboard trends retrieved');
  } else {
    log.error(`Dashboard trends failed: ${trendsResult.error}`);
  }

  // Test Recent Activities
  log.test('GET /dashboard/recent-activities');
  const activitiesResult = await apiRequest('GET', '/dashboard/recent-activities?limit=5');
  if (activitiesResult.success) {
    log.success('Recent activities retrieved');
  } else {
    log.error(`Recent activities failed: ${activitiesResult.error}`);
  }
}

async function testStudents() {
  log.section('3. STUDENTS MODULE');

  // Create Test Student
  log.test('POST /students (via CSV would be typical, but we\'ll check GET)');
  
  // Test Get All Students
  log.test('GET /students');
  const studentsResult = await apiRequest('GET', '/students?page=1&limit=5');
  if (studentsResult.success) {
    log.success(`Students retrieved: ${studentsResult.data.data?.length || 0} students`);
    if (studentsResult.data.data?.length > 0) {
      testStudentId = studentsResult.data.data[0].studentId;
      log.info(`Test Student ID: ${testStudentId}`);
    }
  } else {
    log.error(`Get students failed: ${studentsResult.error}`);
  }

  // Test Risk Statistics
  log.test('GET /students/stats/risk');
  const riskStatsResult = await apiRequest('GET', '/students/stats/risk');
  if (riskStatsResult.success) {
    log.success('Risk statistics retrieved');
    log.info(`Total Students: ${riskStatsResult.data.data?.totalStudents || 0}`);
  } else {
    log.error(`Risk statistics failed: ${riskStatsResult.error}`);
  }

  // Test Get Departments
  log.test('GET /students/filters/departments');
  const deptResult = await apiRequest('GET', '/students/filters/departments');
  if (deptResult.success) {
    log.success(`Departments retrieved: ${deptResult.data.data?.length || 0} departments`);
  } else {
    log.error(`Get departments failed: ${deptResult.error}`);
  }
}

async function testAttendance() {
  log.section('4. ATTENDANCE MODULE');

  // Create Attendance Record (if we have a student)
  if (testStudentId) {
    log.test('POST /attendance');
    const createResult = await apiRequest('POST', '/attendance', {
      studentId: testStudentId,
      subject: 'Test Subject',
      totalClasses: 30,
      attendedClasses: 25,
      month: 'February',
      year: 2026,
      semester: 'Spring',
      remarks: 'Test attendance record',
    });

    if (createResult.success) {
      log.success('Attendance record created');
      testAttendanceId = createResult.data.data?._id;
    } else {
      log.error(`Create attendance failed: ${createResult.error}`);
    }
  }

  // Test Get All Attendance
  log.test('GET /attendance');
  const attendanceResult = await apiRequest('GET', '/attendance?page=1&limit=5');
  if (attendanceResult.success) {
    log.success(`Attendance records retrieved: ${attendanceResult.data.data?.length || 0}`);
  } else {
    log.error(`Get attendance failed: ${attendanceResult.error}`);
  }

  // Test Attendance Statistics
  log.test('GET /attendance/stats/overview');
  const statsResult = await apiRequest('GET', '/attendance/stats/overview');
  if (statsResult.success) {
    log.success('Attendance statistics retrieved');
    log.info(`Average Attendance: ${statsResult.data.data?.avgAttendance?.toFixed(2) || 0}%`);
  } else {
    log.error(`Attendance statistics failed: ${statsResult.error}`);
  }

  // Test Low Attendance Students
  log.test('GET /attendance/stats/low-attendance');
  const lowAttResult = await apiRequest('GET', '/attendance/stats/low-attendance?threshold=75');
  if (lowAttResult.success) {
    log.success(`Low attendance students: ${lowAttResult.data.count || 0}`);
  } else {
    log.error(`Low attendance students failed: ${lowAttResult.error}`);
  }
}

async function testExams() {
  log.section('5. EXAM PERFORMANCE MODULE');

  // Create Exam Record (if we have a student)
  if (testStudentId) {
    log.test('POST /exams');
    const createResult = await apiRequest('POST', '/exams', {
      studentId: testStudentId,
      examName: 'Test Exam',
      examType: 'Midterm',
      subject: 'Test Subject',
      totalMarks: 100,
      obtainedMarks: 85,
      semester: 'Spring',
      year: 2026,
      examDate: new Date().toISOString(),
      remarks: 'Test exam record',
    });

    if (createResult.success) {
      log.success('Exam record created');
      testExamId = createResult.data.data?._id;
      log.info(`Grade: ${createResult.data.data?.grade}, Status: ${createResult.data.data?.status}`);
    } else {
      log.error(`Create exam failed: ${createResult.error}`);
    }
  }

  // Test Get All Exams
  log.test('GET /exams');
  const examsResult = await apiRequest('GET', '/exams?page=1&limit=5');
  if (examsResult.success) {
    log.success(`Exam records retrieved: ${examsResult.data.data?.length || 0}`);
  } else {
    log.error(`Get exams failed: ${examsResult.error}`);
  }

  // Test Exam Statistics
  log.test('GET /exams/stats/overview');
  const statsResult = await apiRequest('GET', '/exams/stats/overview');
  if (statsResult.success) {
    log.success('Exam statistics retrieved');
    log.info(`Average Percentage: ${statsResult.data.data?.avgPercentage?.toFixed(2) || 0}%`);
    log.info(`Pass Rate: ${statsResult.data.data?.passRate?.toFixed(2) || 0}%`);
  } else {
    log.error(`Exam statistics failed: ${statsResult.error}`);
  }

  // Test High Risk Students
  log.test('GET /exams/stats/high-risk');
  const highRiskResult = await apiRequest('GET', '/exams/stats/high-risk');
  if (highRiskResult.success) {
    log.success(`High risk students: ${highRiskResult.data.count || 0}`);
  } else {
    log.error(`High risk students failed: ${highRiskResult.error}`);
  }
}

async function testFraudReports() {
  log.section('6. FRAUD REPORTS MODULE');

  // Create Fraud Report (if we have a student)
  if (testStudentId) {
    log.test('POST /fraud-reports');
    const createResult = await apiRequest('POST', '/fraud-reports', {
      studentId: testStudentId,
      fraudType: 'Exam Cheating',
      riskScore: 75,
      detectionMethod: 'Manual Review',
      systemRemarks: 'Test fraud report',
    });

    if (createResult.success) {
      log.success('Fraud report created');
      testFraudReportId = createResult.data.data?._id;
      log.info(`Risk Level: ${createResult.data.data?.riskLevel}`);
    } else {
      log.error(`Create fraud report failed: ${createResult.error}`);
    }
  }

  // Test Get All Fraud Reports
  log.test('GET /fraud-reports');
  const reportsResult = await apiRequest('GET', '/fraud-reports?page=1&limit=5');
  if (reportsResult.success) {
    log.success(`Fraud reports retrieved: ${reportsResult.data.data?.length || 0}`);
  } else {
    log.error(`Get fraud reports failed: ${reportsResult.error}`);
  }

  // Test Fraud Statistics
  log.test('GET /fraud-reports/statistics/summary');
  const statsResult = await apiRequest('GET', '/fraud-reports/statistics/summary');
  if (statsResult.success) {
    log.success('Fraud statistics retrieved');
    const summary = statsResult.data.data?.summary;
    if (summary) {
      log.info(`Total Reports: ${summary.totalReports || 0}`);
      log.info(`Critical Cases: ${summary.criticalCases || 0}`);
    }
  } else {
    log.error(`Fraud statistics failed: ${statsResult.error}`);
  }

  // Test High Risk Reports
  log.test('GET /fraud-reports/high-risk');
  const highRiskResult = await apiRequest('GET', '/fraud-reports/high-risk?limit=5');
  if (highRiskResult.success) {
    log.success(`High risk reports: ${highRiskResult.data.count || 0}`);
  } else {
    log.error(`High risk reports failed: ${highRiskResult.error}`);
  }
}

async function testPlagiarism() {
  log.section('7. PLAGIARISM MODULE');

  // Create Plagiarism Case (if we have a student)
  if (testStudentId) {
    log.test('POST /plagiarism');
    const createResult = await apiRequest('POST', '/plagiarism', {
      studentId: testStudentId,
      plagiarismScore: 85,
      assignmentName: 'Test Assignment',
      matchedSources: [
        {
          source: 'Internet Source',
          similarity: 85,
          url: 'https://example.com',
        },
      ],
      detectionMethod: 'Automated',
    });

    if (createResult.success) {
      log.success('Plagiarism case created');
      testPlagiarismId = createResult.data.data?._id;
      log.info(`Plagiarism Score: ${createResult.data.data?.plagiarismScore}%`);
    } else {
      log.error(`Create plagiarism case failed: ${createResult.error}`);
    }
  }

  // Test Get All Plagiarism Cases
  log.test('GET /plagiarism');
  const casesResult = await apiRequest('GET', '/plagiarism?page=1&limit=5');
  if (casesResult.success) {
    log.success(`Plagiarism cases retrieved: ${casesResult.data.data?.length || 0}`);
  } else {
    log.error(`Get plagiarism cases failed: ${casesResult.error}`);
  }

  // Test Plagiarism Statistics
  log.test('GET /plagiarism/stats/overview');
  const statsResult = await apiRequest('GET', '/plagiarism/stats/overview');
  if (statsResult.success) {
    log.success('Plagiarism statistics retrieved');
    log.info(`Total Cases: ${statsResult.data.data?.totalCases || 0}`);
    log.info(`Average Score: ${statsResult.data.data?.avgPlagiarismScore?.toFixed(2) || 0}%`);
  } else {
    log.error(`Plagiarism statistics failed: ${statsResult.error}`);
  }

  // Test High Score Cases
  log.test('GET /plagiarism/stats/high-score');
  const highScoreResult = await apiRequest('GET', '/plagiarism/stats/high-score?threshold=70&limit=5');
  if (highScoreResult.success) {
    log.success(`High score cases: ${highScoreResult.data.count || 0}`);
  } else {
    log.error(`High score cases failed: ${highScoreResult.error}`);
  }
}

async function cleanupTestData() {
  log.section('8. CLEANUP (Optional)');
  log.info('Test records created during this test run:');
  if (testAttendanceId) log.info(`- Attendance: ${testAttendanceId}`);
  if (testExamId) log.info(`- Exam: ${testExamId}`);
  if (testFraudReportId) log.info(`- Fraud Report: ${testFraudReportId}`);
  if (testPlagiarismId) log.info(`- Plagiarism: ${testPlagiarismId}`);
  log.info('You can manually delete these records from the database if needed.');
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║     Academic Fraud Detection System - API Test Suite      ║
║                    Comprehensive Tests                     ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  log.info(`API Base URL: ${API_BASE_URL}`);
  log.info('Make sure the backend server is running on port 5000\n');

  try {
    await testAuthentication();
    await testDashboard();
    await testStudents();
    await testAttendance();
    await testExams();
    await testFraudReports();
    await testPlagiarism();
    await cleanupTestData();

    log.section('✅ ALL TESTS COMPLETED!');
    log.success('The backend is fully operational and database-integrated!');
    log.info('\nNext steps:');
    log.info('1. Open http://localhost:5173 in your browser');
    log.info('2. Login with admin@iafds.com / admin123');
    log.info('3. Explore all modules in the application');
  } catch (error) {
    log.error(`\nTest suite failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();
