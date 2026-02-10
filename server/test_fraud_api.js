const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.yellow}=== ${msg} ===${colors.reset}\n`),
};

// Sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Test variables
let createdReportId = null;
let testStudentId = null;

// Test 1: Get all students (to get a valid student ID)
async function testGetStudents() {
  try {
    log.section('Test 1: Get Students for Testing');
    const response = await axios.get(`${BASE_URL}/students?limit=5`);
    
    if (response.data.success && response.data.data.length > 0) {
      testStudentId = response.data.data[0].studentId;
      log.success(`Retrieved students. Using student ID: ${testStudentId}`);
      console.log(`Student: ${response.data.data[0].name} (${response.data.data[0].email})`);
      return true;
    } else {
      log.error('No students found. Please populate students first.');
      return false;
    }
  } catch (error) {
    log.error(`Failed to get students: ${error.message}`);
    return false;
  }
}

// Test 2: Create a fraud report
async function testCreateFraudReport() {
  try {
    log.section('Test 2: Create Fraud Report');
    
    const fraudReportData = {
      studentId: testStudentId,
      fraudType: 'Plagiarism',
      plagiarismScore: 85,
      matchedSources: [
        {
          source: 'Wikipedia',
          similarity: 75,
          url: 'https://en.wikipedia.org/wiki/Machine_Learning',
        },
        {
          source: 'ResearchGate Paper',
          similarity: 65,
          url: 'https://researchgate.net/paper/12345',
        },
      ],
      riskScore: 82,
      systemRemarks: 'High similarity detected in final project submission',
      detectionMethod: 'AI Analysis',
    };

    const response = await axios.post(`${BASE_URL}/fraud-reports`, fraudReportData);
    
    if (response.data.success) {
      createdReportId = response.data.data._id;
      log.success('Fraud report created successfully');
      console.log(`Report ID: ${createdReportId}`);
      console.log(`Student: ${response.data.data.student.name}`);
      console.log(`Fraud Type: ${response.data.data.fraudType}`);
      console.log(`Risk Score: ${response.data.data.riskScore}`);
      console.log(`Risk Level: ${response.data.data.riskLevel}`);
      return true;
    }
  } catch (error) {
    log.error(`Failed to create fraud report: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 3: Get all fraud reports
async function testGetAllFraudReports() {
  try {
    log.section('Test 3: Get All Fraud Reports');
    
    const response = await axios.get(`${BASE_URL}/fraud-reports?page=1&limit=10`);
    
    if (response.data.success) {
      log.success(`Retrieved ${response.data.data.length} fraud reports`);
      console.log(`Total Reports: ${response.data.pagination.totalReports}`);
      console.log(`Current Page: ${response.data.pagination.currentPage}`);
      console.log(`Total Pages: ${response.data.pagination.totalPages}`);
      
      if (response.data.data.length > 0) {
        console.log('\nFirst Report:');
        const firstReport = response.data.data[0];
        console.log(`  Student: ${firstReport.student?.name || 'N/A'}`);
        console.log(`  Fraud Type: ${firstReport.fraudType}`);
        console.log(`  Risk Level: ${firstReport.riskLevel}`);
        console.log(`  Status: ${firstReport.status}`);
      }
      return true;
    }
  } catch (error) {
    log.error(`Failed to get fraud reports: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 4: Get fraud report by ID
async function testGetFraudReportById() {
  try {
    log.section('Test 4: Get Fraud Report by ID');
    
    if (!createdReportId) {
      log.error('No report ID available. Skipping test.');
      return false;
    }

    const response = await axios.get(`${BASE_URL}/fraud-reports/${createdReportId}`);
    
    if (response.data.success) {
      const report = response.data.data;
      log.success('Retrieved fraud report details');
      console.log(`Report ID: ${report._id}`);
      console.log(`Student: ${report.student.name} (${report.student.studentId})`);
      console.log(`Fraud Type: ${report.fraudType}`);
      console.log(`Risk Score: ${report.riskScore}`);
      console.log(`Risk Level: ${report.riskLevel}`);
      console.log(`Status: ${report.status}`);
      console.log(`Detection Method: ${report.detectionMethod}`);
      
      if (report.matchedSources && report.matchedSources.length > 0) {
        console.log(`Matched Sources: ${report.matchedSources.length}`);
      }
      return true;
    }
  } catch (error) {
    log.error(`Failed to get fraud report: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 5: Update fraud report
async function testUpdateFraudReport() {
  try {
    log.section('Test 5: Update Fraud Report');
    
    if (!createdReportId) {
      log.error('No report ID available. Skipping test.');
      return false;
    }

    const updateData = {
      status: 'Under Investigation',
      reviewedBy: 'Dr. Test Reviewer',
      reviewNotes: 'Case under investigation for plagiarism verification',
    };

    const response = await axios.put(`${BASE_URL}/fraud-reports/${createdReportId}`, updateData);
    
    if (response.data.success) {
      log.success('Fraud report updated successfully');
      console.log(`New Status: ${response.data.data.status}`);
      console.log(`Reviewed By: ${response.data.data.reviewedBy}`);
      console.log(`Reviewed At: ${new Date(response.data.data.reviewedAt).toLocaleString()}`);
      return true;
    }
  } catch (error) {
    log.error(`Failed to update fraud report: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 6: Get fraud reports by student
async function testGetFraudReportsByStudent() {
  try {
    log.section('Test 6: Get Fraud Reports by Student');
    
    const response = await axios.get(`${BASE_URL}/fraud-reports/student/${testStudentId}`);
    
    if (response.data.success) {
      log.success(`Retrieved ${response.data.count} fraud reports for student ${testStudentId}`);
      
      if (response.data.data.length > 0) {
        response.data.data.forEach((report, index) => {
          console.log(`\nReport ${index + 1}:`);
          console.log(`  Fraud Type: ${report.fraudType}`);
          console.log(`  Risk Score: ${report.riskScore}`);
          console.log(`  Status: ${report.status}`);
        });
      }
      return true;
    }
  } catch (error) {
    log.error(`Failed to get student fraud reports: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 7: Get fraud statistics
async function testGetFraudStatistics() {
  try {
    log.section('Test 7: Get Fraud Statistics');
    
    const response = await axios.get(`${BASE_URL}/fraud-reports/statistics/summary`);
    
    if (response.data.success) {
      const { summary, fraudTypeDistribution } = response.data.data;
      
      log.success('Retrieved fraud statistics');
      
      if (summary) {
        console.log('\nSummary Statistics:');
        console.log(`  Total Reports: ${summary.totalReports}`);
        console.log(`  Average Risk Score: ${summary.averageRiskScore?.toFixed(2)}`);
        console.log(`  Critical Cases: ${summary.criticalCases}`);
        console.log(`  High Risk Cases: ${summary.highRiskCases}`);
        console.log(`  Medium Risk Cases: ${summary.mediumRiskCases}`);
        console.log(`  Low Risk Cases: ${summary.lowRiskCases}`);
        console.log(`  Pending Review: ${summary.pendingReview}`);
        console.log(`  Under Investigation: ${summary.underInvestigation}`);
        console.log(`  Confirmed Cases: ${summary.confirmedCases}`);
      }
      
      if (fraudTypeDistribution && fraudTypeDistribution.length > 0) {
        console.log('\nFraud Type Distribution:');
        fraudTypeDistribution.forEach((type) => {
          console.log(`  ${type._id}: ${type.count} cases (Avg Risk: ${type.averageRiskScore.toFixed(2)})`);
        });
      }
      return true;
    }
  } catch (error) {
    log.error(`Failed to get fraud statistics: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 8: Get high-risk reports
async function testGetHighRiskReports() {
  try {
    log.section('Test 8: Get High-Risk Reports');
    
    const response = await axios.get(`${BASE_URL}/fraud-reports/high-risk?limit=5`);
    
    if (response.data.success) {
      log.success(`Retrieved ${response.data.count} high-risk fraud reports`);
      
      response.data.data.forEach((report, index) => {
        console.log(`\nHigh-Risk Report ${index + 1}:`);
        console.log(`  Student: ${report.student?.name || 'N/A'}`);
        console.log(`  Fraud Type: ${report.fraudType}`);
        console.log(`  Risk Score: ${report.riskScore}`);
        console.log(`  Risk Level: ${report.riskLevel}`);
        console.log(`  Status: ${report.status}`);
      });
      return true;
    }
  } catch (error) {
    log.error(`Failed to get high-risk reports: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 9: Get recent reports
async function testGetRecentReports() {
  try {
    log.section('Test 9: Get Recent Reports');
    
    const response = await axios.get(`${BASE_URL}/fraud-reports/recent?days=7&limit=5`);
    
    if (response.data.success) {
      log.success(`Retrieved ${response.data.count} recent fraud reports (last 7 days)`);
      
      response.data.data.forEach((report, index) => {
        console.log(`\nRecent Report ${index + 1}:`);
        console.log(`  Student: ${report.student?.name || 'N/A'}`);
        console.log(`  Fraud Type: ${report.fraudType}`);
        console.log(`  Risk Level: ${report.riskLevel}`);
        console.log(`  Detection Date: ${new Date(report.detectionTimestamp).toLocaleDateString()}`);
      });
      return true;
    }
  } catch (error) {
    log.error(`Failed to get recent reports: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 10: Filter fraud reports
async function testFilterFraudReports() {
  try {
    log.section('Test 10: Filter Fraud Reports');
    
    // Test filtering by fraud type
    const response = await axios.get(`${BASE_URL}/fraud-reports?fraudType=Plagiarism&page=1&limit=5`);
    
    if (response.data.success) {
      log.success(`Retrieved ${response.data.data.length} plagiarism reports`);
      console.log(`Total Plagiarism Reports: ${response.data.pagination.totalReports}`);
      return true;
    }
  } catch (error) {
    log.error(`Failed to filter fraud reports: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 11: Bulk create fraud reports
async function testBulkCreateFraudReports() {
  try {
    log.section('Test 11: Bulk Create Fraud Reports');
    
    const bulkReports = [
      {
        studentId: testStudentId,
        fraudType: 'Attendance Manipulation',
        riskScore: 65,
        attendanceIrregularities: {
          inconsistentRecords: 5,
          proxyAttendanceIndicators: 3,
          suspiciousPatterns: [],
        },
        systemRemarks: 'Multiple proxy attendance indicators detected',
      },
      {
        studentId: testStudentId,
        fraudType: 'Identity Fraud',
        riskScore: 78,
        identityAnomalies: {
          biometricMismatch: true,
          ipAddressAnomalies: [
            {
              date: new Date(),
              ipAddress: '192.168.1.100',
              location: 'Unknown',
              description: 'Suspicious IP address',
            },
          ],
          deviceAnomalies: [],
          multipleSimultaneousLogins: 2,
        },
        systemRemarks: 'Biometric mismatch detected during exam',
      },
    ];

    const response = await axios.post(`${BASE_URL}/fraud-reports/bulk`, {
      reports: bulkReports,
    });
    
    if (response.data.success) {
      log.success('Bulk fraud reports created');
      console.log(`Successful: ${response.data.data.successful.length}`);
      console.log(`Failed: ${response.data.data.failed.length}`);
      return true;
    }
  } catch (error) {
    log.error(`Failed to bulk create fraud reports: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 12: Export to JSON
async function testExportJSON() {
  try {
    log.section('Test 12: Export Fraud Reports to JSON');
    
    const response = await axios.get(`${BASE_URL}/fraud-reports/export/json`, {
      params: {
        fraudType: 'Plagiarism',
        limit: 5,
      },
    });
    
    if (response.data.success) {
      log.success('Exported fraud reports to JSON');
      console.log(`Export Date: ${new Date(response.data.exportDate).toLocaleString()}`);
      console.log(`Total Reports: ${response.data.totalReports}`);
      console.log(`Records in file: ${response.data.data.length}`);
      return true;
    }
  } catch (error) {
    log.error(`Failed to export to JSON: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 13: Test date range filtering
async function testDateRangeFilter() {
  try {
    log.section('Test 13: Date Range Filtering');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const response = await axios.get(`${BASE_URL}/fraud-reports`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page: 1,
        limit: 5,
      },
    });
    
    if (response.data.success) {
      log.success(`Retrieved ${response.data.data.length} reports from last 30 days`);
      console.log(`Total Reports in Range: ${response.data.pagination.totalReports}`);
      return true;
    }
  } catch (error) {
    log.error(`Failed to filter by date range: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  log.info('Starting Fraud Reports API Tests...');
  log.info('Make sure the server is running on http://localhost:5000');
  
  await sleep(1000);

  const results = {
    passed: 0,
    failed: 0,
  };

  const tests = [
    testGetStudents,
    testCreateFraudReport,
    testGetAllFraudReports,
    testGetFraudReportById,
    testUpdateFraudReport,
    testGetFraudReportsByStudent,
    testGetFraudStatistics,
    testGetHighRiskReports,
    testGetRecentReports,
    testFilterFraudReports,
    testBulkCreateFraudReports,
    testExportJSON,
    testDateRangeFilter,
  ];

  for (const test of tests) {
    const result = await test();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
    await sleep(500);
  }

  // Summary
  log.section('Test Summary');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  if (results.failed === 0) {
    log.success('All tests passed! 🎉');
  } else {
    log.error(`${results.failed} test(s) failed. Please check the errors above.`);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
