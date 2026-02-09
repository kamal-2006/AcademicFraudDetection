// Sample Attendance Data for Testing
// To use: POST to http://localhost:5000/api/attendance

const sampleAttendanceRecords = [
  {
    studentId: 'STU001',
    subject: 'Data Structures',
    totalClasses: 40,
    attendedClasses: 35,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Good attendance'
  },
  {
    studentId: 'STU001',
    subject: 'Computer Networks',
    totalClasses: 35,
    attendedClasses: 32,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Regular'
  },
  {
    studentId: 'STU002',
    subject: 'Data Structures',
    totalClasses: 40,
    attendedClasses: 28,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Several absences'
  },
  {
    studentId: 'STU002',
    subject: 'Computer Networks',
    totalClasses: 35,
    attendedClasses: 20,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Critical - needs attention'
  },
  {
    studentId: 'STU003',
    subject: 'Data Structures',
    totalClasses: 40,
    attendedClasses: 18,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Very low attendance'
  },
  {
    studentId: 'STU003',
    subject: 'Computer Networks',
    totalClasses: 35,
    attendedClasses: 15,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Critical'
  },
  {
    studentId: 'STU004',
    subject: 'Data Structures',
    totalClasses: 40,
    attendedClasses: 38,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Excellent attendance'
  },
  {
    studentId: 'STU005',
    subject: 'Data Structures',
    totalClasses: 40,
    attendedClasses: 22,
    month: 'January',
    year: 2026,
    semester: 'Spring',
    remarks: 'Below threshold'
  },
  // February data
  {
    studentId: 'STU001',
    subject: 'Data Structures',
    totalClasses: 38,
    attendedClasses: 33,
    month: 'February',
    year: 2026,
    semester: 'Spring',
    remarks: 'Consistent'
  },
  {
    studentId: 'STU002',
    subject: 'Data Structures',
    totalClasses: 38,
    attendedClasses: 25,
    month: 'February',
    year: 2026,
    semester: 'Spring',
    remarks: 'Slight improvement'
  }
];

module.exports = sampleAttendanceRecords;

// To bulk insert, you can use this in MongoDB shell or create an endpoint:
// db.attendances.insertMany(sampleAttendanceRecords.map(record => ({
//   ...record,
//   // You'll need to get the actual student ObjectId from the students collection
//   student: db.students.findOne({ studentId: record.studentId })._id
// })));
