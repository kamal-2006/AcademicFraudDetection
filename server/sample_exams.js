// Sample Exam Performance Data for Testing
// To use: POST to http://localhost:5000/api/exams

const sampleExamRecords = [
  {
    studentId: 'STU001',
    examName: 'Midterm Exam',
    examType: 'Midterm',
    subject: 'Data Structures',
    totalMarks: 100,
    obtainedMarks: 88,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-01',
    remarks: 'Strong performance'
  },
  {
    studentId: 'STU001',
    examName: 'Quiz 1',
    examType: 'Quiz',
    subject: 'Data Structures',
    totalMarks: 20,
    obtainedMarks: 18,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-01-15',
    remarks: 'Excellent'
  },
  {
    studentId: 'STU001',
    examName: 'Assignment 1',
    examType: 'Assignment',
    subject: 'Computer Networks',
    totalMarks: 50,
    obtainedMarks: 45,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-01-20',
    remarks: 'Well done'
  },
  {
    studentId: 'STU002',
    examName: 'Midterm Exam',
    examType: 'Midterm',
    subject: 'Data Structures',
    totalMarks: 100,
    obtainedMarks: 65,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-01',
    remarks: 'Needs improvement'
  },
  {
    studentId: 'STU002',
    examName: 'Quiz 1',
    examType: 'Quiz',
    subject: 'Data Structures',
    totalMarks: 20,
    obtainedMarks: 12,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-01-15',
    remarks: 'Below average'
  },
  {
    studentId: 'STU003',
    examName: 'Midterm Exam',
    examType: 'Midterm',
    subject: 'Data Structures',
    totalMarks: 100,
    obtainedMarks: 42,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-01',
    remarks: 'Failed - requires intervention'
  },
  {
    studentId: 'STU003',
    examName: 'Quiz 1',
    examType: 'Quiz',
    subject: 'Data Structures',
    totalMarks: 20,
    obtainedMarks: 8,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-01-15',
    remarks: 'Poor performance'
  },
  {
    studentId: 'STU003',
    examName: 'Assignment 1',
    examType: 'Assignment',
    subject: 'Computer Networks',
    totalMarks: 50,
    obtainedMarks: 22,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-01-20',
    remarks: 'Failing'
  },
  {
    studentId: 'STU004',
    examName: 'Midterm Exam',
    examType: 'Midterm',
    subject: 'Data Structures',
    totalMarks: 100,
    obtainedMarks: 95,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-01',
    remarks: 'Outstanding performance'
  },
  {
    studentId: 'STU004',
    examName: 'Quiz 1',
    examType: 'Quiz',
    subject: 'Data Structures',
    totalMarks: 20,
    obtainedMarks: 20,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-01-15',
    remarks: 'Perfect score'
  },
  {
    studentId: 'STU005',
    examName: 'Midterm Exam',
    examType: 'Midterm',
    subject: 'Data Structures',
    totalMarks: 100,
    obtainedMarks: 38,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-01',
    remarks: 'Failed'
  },
  {
    studentId: 'STU005',
    examName: 'Quiz 1',
    examType: 'Quiz',
    subject: 'Data Structures',
    totalMarks: 20,
    obtainedMarks: 9,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-01-15',
    remarks: 'Below threshold'
  },
  // Final Exams
  {
    studentId: 'STU001',
    examName: 'Final Exam',
    examType: 'Final',
    subject: 'Data Structures',
    totalMarks: 150,
    obtainedMarks: 135,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-25',
    remarks: 'Excellent final performance'
  },
  {
    studentId: 'STU002',
    examName: 'Final Exam',
    examType: 'Final',
    subject: 'Data Structures',
    totalMarks: 150,
    obtainedMarks: 90,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-25',
    remarks: 'Passed but needs improvement'
  },
  {
    studentId: 'STU003',
    examName: 'Final Exam',
    examType: 'Final',
    subject: 'Data Structures',
    totalMarks: 150,
    obtainedMarks: 60,
    semester: 'Spring',
    year: 2026,
    examDate: '2026-02-25',
    remarks: 'Failed final exam'
  }
];

module.exports = sampleExamRecords;

// Grade Distribution Expected:
// A+: 2 exams (STU004)
// A-: 2 exams (STU001)
// C: 2 exams (STU002)
// F: 5 exams (STU003, STU005)
// Pass Rate: ~60%
