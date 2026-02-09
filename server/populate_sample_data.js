/**
 * Script to populate database with sample attendance and exam data
 * 
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Make sure students exist in database with IDs: STU001-STU005
 * 3. Run: node populate_sample_data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Attendance = require('./src/models/Attendance');
const ExamPerformance = require('./src/models/ExamPerformance');
const Student = require('./src/models/Student');

// Import sample data
const sampleAttendanceRecords = require('./sample_attendance');
const sampleExamRecords = require('./sample_exams');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/academic_fraud', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to get student ObjectId from studentId
const getStudentObjectId = async (studentId) => {
  const student = await Student.findOne({ studentId });
  if (!student) {
    throw new Error(`Student with ID ${studentId} not found`);
  }
  return student._id;
};

// Populate Attendance Data
const populateAttendance = async () => {
  try {
    console.log('\n📚 Populating Attendance Data...');
    
    // Clear existing attendance data (optional - remove if you want to keep existing data)
    await Attendance.deleteMany({});
    console.log('🗑️  Cleared existing attendance records');

    let successCount = 0;
    let errorCount = 0;

    for (const record of sampleAttendanceRecords) {
      try {
        // Get student ObjectId
        const studentObjectId = await getStudentObjectId(record.studentId);
        
        // Create attendance record (pre-save hook will calculate percentage and status)
        const attendance = new Attendance({
          ...record,
          student: studentObjectId
        });
        
        await attendance.save();
        successCount++;
        console.log(`✓ Added attendance: ${record.studentId} - ${record.subject} (${record.month} ${record.year})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error adding attendance for ${record.studentId}:`, error.message);
      }
    }

    console.log(`\n✅ Attendance population complete: ${successCount} successful, ${errorCount} failed`);
  } catch (error) {
    console.error('❌ Error populating attendance:', error);
  }
};

// Populate Exam Performance Data
const populateExams = async () => {
  try {
    console.log('\n📝 Populating Exam Performance Data...');
    
    // Clear existing exam data (optional - remove if you want to keep existing data)
    await ExamPerformance.deleteMany({});
    console.log('🗑️  Cleared existing exam records');

    let successCount = 0;
    let errorCount = 0;

    for (const record of sampleExamRecords) {
      try {
        // Get student ObjectId
        const studentObjectId = await getStudentObjectId(record.studentId);
        
        // Create exam record (pre-save hook will calculate percentage, grade, and status)
        const exam = new ExamPerformance({
          ...record,
          student: studentObjectId
        });
        
        await exam.save();
        successCount++;
        console.log(`✓ Added exam: ${record.studentId} - ${record.examName} (${record.subject}) - Grade: ${exam.grade}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error adding exam for ${record.studentId}:`, error.message);
      }
    }

    console.log(`\n✅ Exam population complete: ${successCount} successful, ${errorCount} failed`);
  } catch (error) {
    console.error('❌ Error populating exams:', error);
  }
};

// Display Statistics
const displayStatistics = async () => {
  try {
    console.log('\n📊 Database Statistics:');
    
    const attendanceCount = await Attendance.countDocuments();
    const examCount = await ExamPerformance.countDocuments();
    
    console.log(`   - Total Attendance Records: ${attendanceCount}`);
    console.log(`   - Total Exam Records: ${examCount}`);
    
    // Get attendance stats
    const attendanceStats = await Attendance.getAttendanceStats();
    console.log('\n📈 Attendance Stats:');
    console.log(`   - Average Attendance: ${attendanceStats.avgAttendance.toFixed(2)}%`);
    console.log(`   - Regular (≥75%): ${attendanceStats.regularCount} students`);
    console.log(`   - Warning (60-74%): ${attendanceStats.warningCount} students`);
    console.log(`   - Critical (<60%): ${attendanceStats.criticalCount} students`);
    
    // Get exam stats
    const examStats = await ExamPerformance.getExamStats();
    console.log('\n📈 Exam Stats:');
    console.log(`   - Average Score: ${examStats.avgPercentage.toFixed(2)}%`);
    console.log(`   - Pass Count: ${examStats.passCount} exams`);
    console.log(`   - Fail Count: ${examStats.failCount} exams`);
    console.log(`   - Pass Rate: ${examStats.passRate.toFixed(2)}%`);
    console.log('\n   Grade Distribution:');
    for (const [grade, count] of Object.entries(examStats.gradeDistribution)) {
      console.log(`     ${grade}: ${count}`);
    }
    
    // Get high-risk students
    const highRiskStudents = await ExamPerformance.getHighRiskStudents();
    console.log(`\n⚠️  High-Risk Students: ${highRiskStudents.length}`);
    
    // Get low attendance students
    const lowAttendanceStudents = await Attendance.getLowAttendanceStudents(75);
    console.log(`⚠️  Low Attendance Students (<75%): ${lowAttendanceStudents.length}`);
    
  } catch (error) {
    console.error('❌ Error displaying statistics:', error);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting Sample Data Population...\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Check if students exist
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      console.error('\n❌ ERROR: No students found in database!');
      console.log('Please create at least 5 students with IDs: STU001, STU002, STU003, STU004, STU005');
      console.log('You can use the existing student creation endpoint or manual insertion.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${studentCount} students in database\n`);
    
    // Populate data
    await populateAttendance();
    await populateExams();
    
    // Display statistics
    await displayStatistics();
    
    console.log('\n✅ Sample data population completed successfully!');
    console.log('\n📍 Next Steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Visit http://localhost:5174/attendance to view attendance records');
    console.log('   3. Visit http://localhost:5174/exams to view exam performance');
    console.log('   4. Visit http://localhost:5174/dashboard to see aggregated metrics');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
main();
