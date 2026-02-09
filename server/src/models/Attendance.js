const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    totalClasses: {
      type: Number,
      required: [true, 'Total classes is required'],
      min: [0, 'Total classes cannot be negative'],
      default: 0,
    },
    attendedClasses: {
      type: Number,
      required: [true, 'Attended classes is required'],
      min: [0, 'Attended classes cannot be negative'],
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    semester: {
      type: String,
      enum: ['Fall', 'Spring', 'Summer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['regular', 'warning', 'critical'],
      default: 'regular',
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

// Calculate attendance percentage before saving
attendanceSchema.pre('save', function (next) {
  if (this.totalClasses > 0) {
    this.attendancePercentage = (this.attendedClasses / this.totalClasses) * 100;
    this.attendancePercentage = Math.round(this.attendancePercentage * 100) / 100; // Round to 2 decimals
  } else {
    this.attendancePercentage = 0;
  }

  // Set status based on attendance percentage
  if (this.attendancePercentage >= 75) {
    this.status = 'regular';
  } else if (this.attendancePercentage >= 60) {
    this.status = 'warning';
  } else {
    this.status = 'critical';
  }

  next();
});

// Validate attended classes doesn't exceed total classes
attendanceSchema.pre('save', function (next) {
  if (this.attendedClasses > this.totalClasses) {
    next(new Error('Attended classes cannot exceed total classes'));
  }
  next();
});

// Compound index for efficient queries
attendanceSchema.index({ studentId: 1, subject: 1, month: 1, year: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ semester: 1, year: 1 });

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        avgAttendance: { $avg: '$attendancePercentage' },
        totalRecords: { $sum: 1 },
        regularCount: {
          $sum: { $cond: [{ $eq: ['$status', 'regular'] }, 1, 0] },
        },
        warningCount: {
          $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] },
        },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : null;
};

// Static method to get low attendance students
attendanceSchema.statics.getLowAttendanceStudents = async function (threshold = 75) {
  return this.aggregate([
    {
      $match: {
        attendancePercentage: { $lt: threshold },
      },
    },
    {
      $group: {
        _id: '$studentId',
        avgAttendance: { $avg: '$attendancePercentage' },
        totalSubjects: { $sum: 1 },
        criticalSubjects: {
          $sum: { $cond: [{ $lt: ['$attendancePercentage', 60] }, 1, 0] },
        },
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
        avgAttendance: { $round: ['$avgAttendance', 2] },
        totalSubjects: 1,
        criticalSubjects: 1,
      },
    },
    {
      $sort: { avgAttendance: 1 },
    },
  ]);
};

// Instance method to update attendance
attendanceSchema.methods.updateAttendance = function (attended, total) {
  if (total !== undefined) {
    this.totalClasses = total;
  }
  if (attended !== undefined) {
    this.attendedClasses = attended;
  }
  return this.save();
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
