const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000/api/students';
const CSV_FILE_PATH = path.join(__dirname, 'sample_students.csv');

// Helper function to make HTTP requests
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
};

// Test 1: Check server is running
const testServerHealth = async () => {
  console.log('\n=== Test 1: Server Health Check ===');
  try {
    const response = await fetch('http://localhost:5000/');
    const text = await response.text();
    console.log('✅ Server is running');
    console.log('Response:', text);
    return true;
  } catch (error) {
    console.log('❌ Server is not running');
    console.log('Error:', error.message);
    return false;
  }
};

// Test 2: Upload CSV file
const testUploadCSV = async () => {
  console.log('\n=== Test 2: Upload CSV File ===');
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.log('❌ Sample CSV file not found');
    return false;
  }

  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(CSV_FILE_PATH));

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ CSV upload successful');
      console.log(`   - Total records: ${result.summary.totalRecords}`);
      console.log(`   - Inserted: ${result.summary.inserted}`);
      console.log(`   - Duplicates: ${result.summary.duplicates}`);
      console.log(`   - Validation errors: ${result.summary.validationErrors}`);
      return true;
    } else {
      console.log('❌ CSV upload failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Error uploading CSV');
    console.log('Error:', error.message);
    return false;
  }
};

// Test 3: Get all students
const testGetAllStudents = async () => {
  console.log('\n=== Test 3: Get All Students ===');
  const { status, data, error } = await makeRequest(BASE_URL);
  
  if (error) {
    console.log('❌ Error fetching students');
    console.log('Error:', error);
    return false;
  }

  console.log('Status:', status);
  console.log('Total students:', data.pagination?.totalRecords);
  console.log('First 3 students:');
  data.data?.slice(0, 3).forEach((student, index) => {
    console.log(`   ${index + 1}. ${student.name} (${student.studentId}) - Risk: ${student.riskLevel}`);
  });

  if (data.success && data.data.length > 0) {
    console.log('✅ Get all students successful');
    return true;
  } else {
    console.log('❌ No students found');
    return false;
  }
};

// Test 4: Search students
const testSearchStudents = async () => {
  console.log('\n=== Test 4: Search Students ===');
  const searchTerm = 'John';
  const { status, data, error } = await makeRequest(`${BASE_URL}?search=${searchTerm}`);
  
  if (error) {
    console.log('❌ Error searching students');
    console.log('Error:', error);
    return false;
  }

  console.log('Search term:', searchTerm);
  console.log('Results found:', data.data?.length);
  data.data?.forEach((student) => {
    console.log(`   - ${student.name} (${student.studentId})`);
  });

  if (data.success) {
    console.log('✅ Search successful');
    return true;
  }
  return false;
};

// Test 5: Filter by risk level
const testFilterByRisk = async () => {
  console.log('\n=== Test 5: Filter by Risk Level ===');
  const riskLevel = 'High';
  const { status, data, error } = await makeRequest(`${BASE_URL}?riskLevel=${riskLevel}`);
  
  if (error) {
    console.log('❌ Error filtering students');
    console.log('Error:', error);
    return false;
  }

  console.log('Risk level:', riskLevel);
  console.log('Students found:', data.data?.length);
  data.data?.forEach((student) => {
    console.log(`   - ${student.name}: GPA ${student.gpa}, Attendance ${student.attendance}%`);
  });

  if (data.success) {
    console.log('✅ Filter successful');
    return true;
  }
  return false;
};

// Test 6: Get risk statistics
const testGetRiskStats = async () => {
  console.log('\n=== Test 6: Get Risk Statistics ===');
  const { status, data, error } = await makeRequest(`${BASE_URL}/stats/risk`);
  
  if (error) {
    console.log('❌ Error fetching statistics');
    console.log('Error:', error);
    return false;
  }

  console.log('Total students:', data.data?.totalStudents);
  console.log('Risk distribution:');
  data.data?.riskDistribution?.forEach((stat) => {
    console.log(`   - ${stat.riskLevel}: ${stat.count} students (${stat.percentage}%)`);
    console.log(`     Avg GPA: ${stat.avgGpa}, Avg Attendance: ${stat.avgAttendance}%`);
  });

  if (data.success) {
    console.log('✅ Statistics fetched successfully');
    return true;
  }
  return false;
};

// Test 7: Get departments
const testGetDepartments = async () => {
  console.log('\n=== Test 7: Get Departments ===');
  const { status, data, error } = await makeRequest(`${BASE_URL}/filters/departments`);
  
  if (error) {
    console.log('❌ Error fetching departments');
    console.log('Error:', error);
    return false;
  }

  console.log('Departments found:', data.data?.length);
  data.data?.forEach((dept, index) => {
    console.log(`   ${index + 1}. ${dept}`);
  });

  if (data.success) {
    console.log('✅ Departments fetched successfully');
    return true;
  }
  return false;
};

// Run all tests
const runAllTests = async () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Students API Integration Tests      ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [];

  // Test 1: Server health
  results.push(await testServerHealth());
  
  if (!results[0]) {
    console.log('\n❌ Server is not running. Please start the server first.');
    process.exit(1);
  }

  // Wait a bit for server to be fully ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Upload CSV
  results.push(await testUploadCSV());

  // Wait for database operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3-7: Other tests
  results.push(await testGetAllStudents());
  results.push(await testSearchStudents());
  results.push(await testFilterByRisk());
  results.push(await testGetRiskStats());
  results.push(await testGetDepartments());

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          Test Summary                  ║');
  console.log('╚════════════════════════════════════════╝');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  
  if (passed === total) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed. Please check the logs above.');
  }
  
  console.log('\n' + '='.repeat(50));
};

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
