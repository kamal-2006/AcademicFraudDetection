const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be between 1 and 5'],
      max: [5, 'Year must be between 1 and 5'],
    },
    gpa: {
      type: Number,
      required: [true, 'GPA is required'],
      min: [0, 'GPA must be between 0 and 4'],
      max: [4, 'GPA must be between 0 and 4'],
    },
    attendance: {
      type: Number,
      required: [true, 'Attendance is required'],
      min: [0, 'Attendance must be between 0 and 100'],
      max: [100, 'Attendance must be between 0 and 100'],
    },
    riskLevel: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: 'Risk level must be Low, Medium, High, or Critical',
      },
      default: 'Low',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient searching
studentSchema.index({ name: 'text', email: 'text', studentId: 'text' });
studentSchema.index({ riskLevel: 1 });

// Method to calculate risk level based on GPA and attendance
studentSchema.methods.calculateRiskLevel = function () {
  if (this.gpa < 2.0 || this.attendance < 50) {
    this.riskLevel = 'Critical';
  } else if (this.gpa < 2.5 || this.attendance < 70) {
    this.riskLevel = 'High';
  } else if (this.gpa < 3.0 || this.attendance < 85) {
    this.riskLevel = 'Medium';
  } else {
    this.riskLevel = 'Low';
  }
  return this.riskLevel;
};

// Static method to get risk statistics
studentSchema.statics.getRiskStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 },
        avgGpa: { $avg: '$gpa' },
        avgAttendance: { $avg: '$attendance' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
  return stats;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
