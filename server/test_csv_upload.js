const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';

console.log('🧪 Testing CSV Upload Functionality\n');
console.log('=' .repeat(60));

/**
 * Test CSV Debug Endpoint
 */
async function testDebugCSV() {
  console.log('\n📋 Test 1: Debug CSV Parsing (No Save)');
  console.log('-'.repeat(60));
  
  const csvPath = path.join(__dirname, 'test_students.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Test file not found:', csvPath);
    return;
  }

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));

    const response = await axios.post(`${API_BASE_URL}/students/debug-csv`, form, {
      headers: form.getHeaders(),
    });

    console.log('✅ CSV Debug Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.validation.validRecords > 0) {
      console.log(`\n✨ Success! ${response.data.validation.validRecords} valid records found`);
      return true;
    } else {
      console.log('\n⚠️  No valid records found. Check errors above.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test CSV Upload Endpoint (Actual Save)
 */
async function testUploadCSV() {
  console.log('\n📤 Test 2: Upload CSV to Database');
  console.log('-'.repeat(60));
  
  const csvPath = path.join(__dirname, 'test_students.csv');

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));

    const response = await axios.post(`${API_BASE_URL}/students/upload`, form, {
      headers: form.getHeaders(),
    });

    console.log('✅ Upload Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const summary = response.data.summary;
    console.log(`\n📊 Upload Summary:`);
    console.log(`   Total Records: ${summary.totalRecords}`);
    console.log(`   Valid Records: ${summary.validRecords}`);
    console.log(`   Inserted: ${summary.inserted}`);
    console.log(`   Duplicates: ${summary.duplicates}`);
    console.log(`   Errors: ${summary.validationErrors}`);
    
    if (summary.inserted > 0) {
      console.log(`\n✨ Success! ${summary.inserted} students added to database`);
      return true;
    } else {
      console.log('\n⚠️  No students were added. Check for duplicates or validation errors.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data?.errors) {
      console.log('\n📝 Validation Errors:');
      error.response.data.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. Row ${err.row}: ${err.errors.join(', ')}`);
      });
    }
    
    return false;
  }
}

/**
 * Get Current Students Count
 */
async function getStudentsCount() {
  try {
    const response = await axios.get(`${API_BASE_URL}/students`);
    return response.data.data?.length || 0;
  } catch (error) {
    console.error('❌ Error getting students:', error.message);
    return 0;
  }
}

/**
 * Main Test Execution
 */
async function runTests() {
  console.log('🚀 Starting CSV Upload Tests...\n');
  
  // Check if server is running
  try {
    await axios.get(`${API_BASE_URL}/students`);
    console.log('✅ Server is running at', API_BASE_URL);
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('   Please start the server first: cd server && node server.js');
    return;
  }

  // Get initial count
  const initialCount = await getStudentsCount();
  console.log(`📊 Current students in database: ${initialCount}\n`);

  // Test 1: Debug CSV (doesn't save)
  const debugSuccess = await testDebugCSV();
  
  if (!debugSuccess) {
    console.log('\n⚠️  Debug test failed. Fix the CSV format before proceeding.');
    return;
  }

  // Ask user before uploading
  console.log('\n❓ The debug test passed. Would you like to upload to database?');
  console.log('   (This will add students to the database)');
  console.log('\n   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: Upload CSV (saves to database)
  const uploadSuccess = await testUploadCSV();
  
  if (uploadSuccess) {
    const finalCount = await getStudentsCount();
    console.log(`\n📊 Final students in database: ${finalCount}`);
    console.log(`   Added: ${finalCount - initialCount} new students`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests completed!\n');
  
  console.log('💡 Next Steps:');
  console.log('   1. Check the server console for detailed debug logs');
  console.log('   2. Try uploading through the frontend UI');
  console.log('   3. If errors occur, check CSV_UPLOAD_FIX_GUIDE.md');
  console.log('');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
