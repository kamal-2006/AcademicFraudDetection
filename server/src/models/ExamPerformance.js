const mongoose = require('mongoose');

const examPerformanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    examType: {
      type: String,
      enum: ['Midterm', 'Final', 'Quiz', 'Assignment', 'Project'],
      required: [true, 'Exam type is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [0, 'Total marks cannot be negative'],
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Obtained marks is required'],
      min: [0, 'Obtained marks cannot be negative'],
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail'],
      required: true,
    },
    semester: {
      type: String,
      enum: ['Fall', 'Spring', 'Summer'],
      required: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    examDate: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate percentage and grade before saving
examPerformanceSchema.pre('save', function (next) {
  // Calculate percentage
  if (this.totalMarks > 0) {
    this.percentage = (this.obtainedMarks / this.totalMarks) * 100;
    this.percentage = Math.round(this.percentage * 100) / 100; // Round to 2 decimals
  } else {
    this.percentage = 0;
  }

  // Determine grade based on percentage
  if (this.percentage >= 95) {
    this.grade = 'A+';
  } else if (this.percentage >= 90) {
    this.grade = 'A';
  } else if (this.percentage >= 85) {
    this.grade = 'A-';
  } else if (this.percentage >= 80) {
    this.grade = 'B+';
  } else if (this.percentage >= 75) {
    this.grade = 'B';
  } else if (this.percentage >= 70) {
    this.grade = 'B-';
  } else if (this.percentage >= 65) {
    this.grade = 'C+';
  } else if (this.percentage >= 60) {
    this.grade = 'C';
  } else if (this.percentage >= 55) {
    this.grade = 'C-';
  } else if (this.percentage >= 50) {
    this.grade = 'D';
  } else {
    this.grade = 'F';
  }

  // Determine pass/fail status
  this.status = this.percentage >= 50 ? 'Pass' : 'Fail';

  next();
});

// Validate obtained marks doesn't exceed total marks
examPerformanceSchema.pre('save', function (next) {
  if (this.obtainedMarks > this.totalMarks) {
    next(new Error('Obtained marks cannot exceed total marks'));
  }
  next();
});

// Compound indexes for efficient queries
examPerformanceSchema.index({ studentId: 1, subject: 1, examType: 1 });
examPerformanceSchema.index({ status: 1 });
examPerformanceSchema.index({ semester: 1, year: 1 });
examPerformanceSchema.index({ examDate: -1 });

// Static method to get exam statistics
examPerformanceSchema.statics.getExamStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        avgPercentage: { $avg: '$percentage' },
        totalExams: { $sum: 1 },
        passCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0] },
        },
        failCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Fail'] }, 1, 0] },
        },
        gradeDistribution: {
          $push: '$grade',
        },
      },
    },
  ]);

  if (stats.length > 0) {
    // Calculate grade distribution
    const gradeCount = {};
    stats[0].gradeDistribution.forEach((grade) => {
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    });

    return {
      ...stats[0],
      gradeDistribution: gradeCount,
      passRate:
        stats[0].totalExams > 0
          ? Math.round((stats[0].passCount / stats[0].totalExams) * 100 * 100) / 100
          : 0,
    };
  }

  return null;
};

// Static method to get failing students
examPerformanceSchema.statics.getFailingStudents = async function () {
  return this.aggregate([
    {
      $match: {
        status: 'Fail',
      },
    },
    {
      $group: {
        _id: '$studentId',
        failedExams: { $sum: 1 },
        avgPercentage: { $avg: '$percentage' },
        subjects: { $addToSet: '$subject' },
      },
    },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: 'studentId',
        as: 'studentInfo',
      },
    },
    {
      $unwind: '$studentInfo',
    },
    {
      $project: {
        studentId: '$_id',
        name: '$studentInfo.name',
        email: '$studentInfo.email',
        department: '$studentInfo.department',
        failedExams: 1,
        avgPercentage: { $round: ['$avgPercentage', 2] },
        subjects: 1,
      },
    },
    {
      $sort: { failedExams: -1 },
    },
  ]);
};

// Static method to get high-risk students based on exam performance
examPerformanceSchema.statics.getHighRiskStudents = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$studentId',
        avgPercentage: { $avg: '$percentage' },
        totalExams: { $sum: 1 },
        failedExams: {
          $sum: { $cond: [{ $eq: ['$status', 'Fail'] }, 1, 0] },
        },
        lowScoreExams: {
          $sum: { $cond: [{ $lt: ['$percentage', 60] }, 1, 0] },
        },
      },
    },
    {
      $match: {
        $or: [
          { avgPercentage: { $lt: 60 } },
          { failedExams: { $gte: 2 } },
          { lowScoreExams: { $gte: 3 } },
        ],
      },
    },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: 'studentId',
        as: 'studentInfo',
      },
    },
    {
      $unwind: '$studentInfo',
    },
    {
      $project: {
        studentId: '$_id',
        name: '$studentInfo.name',
        email: '$studentInfo.email',
        department: '$studentInfo.department',
        avgPercentage: { $round: ['$avgPercentage', 2] },
        totalExams: 1,
        failedExams: 1,
        lowScoreExams: 1,
      },
    },
    {
      $sort: { avgPercentage: 1 },
    },
  ]);
};

const ExamPerformance = mongoose.model('ExamPerformance', examPerformanceSchema);

module.exports = ExamPerformance;
