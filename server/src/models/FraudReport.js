const mongoose = require('mongoose');

const fraudReportSchema = new mongoose.Schema(
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
    fraudType: {
      type: String,
      enum: [
        'Plagiarism',
        'Attendance Manipulation',
        'Identity Fraud',
        'Exam Cheating',
        'Grade Tampering',
        'Multiple Fraud Types',
      ],
      required: [true, 'Fraud type is required'],
      index: true,
    },
    // Plagiarism-specific fields
    plagiarismScore: {
      type: Number,
      min: [0, 'Plagiarism score must be between 0 and 100'],
      max: [100, 'Plagiarism score must be between 0 and 100'],
      default: null,
    },
    matchedSources: [
      {
        source: {
          type: String,
          trim: true,
        },
        similarity: {
          type: Number,
          min: 0,
          max: 100,
        },
        url: {
          type: String,
          trim: true,
        },
      },
    ],
    // Attendance-specific fields
    attendanceIrregularities: {
      suspiciousPatterns: [
        {
          date: {
            type: Date,
          },
          pattern: {
            type: String,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
        },
      ],
      inconsistentRecords: {
        type: Number,
        default: 0,
      },
      proxyAttendanceIndicators: {
        type: Number,
        default: 0,
      },
    },
    // Identity-specific fields
    identityAnomalies: {
      biometricMismatch: {
        type: Boolean,
        default: false,
      },
      ipAddressAnomalies: [
        {
          date: {
            type: Date,
          },
          ipAddress: {
            type: String,
            trim: true,
          },
          location: {
            type: String,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
        },
      ],
      deviceAnomalies: [
        {
          date: {
            type: Date,
          },
          deviceId: {
            type: String,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
        },
      ],
      multipleSimultaneousLogins: {
        type: Number,
        default: 0,
      },
    },
    // Risk assessment
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score must be between 0 and 100'],
      max: [100, 'Risk score must be between 0 and 100'],
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
    },
    // Detection metadata
    detectionTimestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    detectionMethod: {
      type: String,
      enum: ['Automated', 'Manual Review', 'AI Analysis', 'Hybrid'],
      default: 'Automated',
    },
    // System remarks and actions
    systemRemarks: {
      type: String,
      trim: true,
      maxlength: [2000, 'System remarks cannot exceed 2000 characters'],
    },
    evidenceFiles: [
      {
        fileName: {
          type: String,
          trim: true,
        },
        fileType: {
          type: String,
          trim: true,
        },
        fileUrl: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Status tracking
    status: {
      type: String,
      enum: ['Pending Review', 'Under Investigation', 'Confirmed', 'Dismissed', 'Resolved'],
      default: 'Pending Review',
      index: true,
    },
    reviewedBy: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review notes cannot exceed 2000 characters'],
    },
    // Actions taken
    actionTaken: {
      type: String,
      enum: [
        'None',
        'Warning Issued',
        'Grade Penalty',
        'Suspension',
        'Expulsion',
        'Under Review',
      ],
      default: 'None',
    },
    actionDate: {
      type: Date,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
fraudReportSchema.index({ studentId: 1, fraudType: 1 });
fraudReportSchema.index({ detectionTimestamp: -1 });
fraudReportSchema.index({ riskScore: -1 });
fraudReportSchema.index({ status: 1 });

// Pre-save middleware to calculate risk level based on risk score
fraudReportSchema.pre('save', function (next) {
  if (this.isModified('riskScore')) {
    if (this.riskScore >= 80) {
      this.riskLevel = 'Critical';
    } else if (this.riskScore >= 60) {
      this.riskLevel = 'High';
    } else if (this.riskScore >= 30) {
      this.riskLevel = 'Medium';
    } else {
      this.riskLevel = 'Low';
    }
  }
  next();
});

// Virtual for formatted detection date
fraudReportSchema.virtual('formattedDetectionDate').get(function () {
  return this.detectionTimestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Virtual for days since detection
fraudReportSchema.virtual('daysSinceDetection').get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.detectionTimestamp);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to calculate overall fraud severity
fraudReportSchema.methods.calculateSeverity = function () {
  let severity = this.riskScore;

  // Adjust based on fraud type
  const fraudTypeWeights = {
    'Identity Fraud': 1.2,
    'Grade Tampering': 1.15,
    'Exam Cheating': 1.1,
    'Plagiarism': 1.0,
    'Attendance Manipulation': 0.9,
    'Multiple Fraud Types': 1.25,
  };

  severity *= fraudTypeWeights[this.fraudType] || 1.0;

  // Adjust based on plagiarism score if available
  if (this.plagiarismScore && this.plagiarismScore > 70) {
    severity *= 1.1;
  }

  return Math.min(100, Math.round(severity));
};

// Static method to get fraud statistics
fraudReportSchema.statics.getStatistics = async function (filters = {}) {
  const stats = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        averageRiskScore: { $avg: '$riskScore' },
        criticalCases: {
          $sum: { $cond: [{ $eq: ['$riskLevel', 'Critical'] }, 1, 0] },
        },
        highRiskCases: {
          $sum: { $cond: [{ $eq: ['$riskLevel', 'High'] }, 1, 0] },
        },
        mediumRiskCases: {
          $sum: { $cond: [{ $eq: ['$riskLevel', 'Medium'] }, 1, 0] },
        },
        lowRiskCases: {
          $sum: { $cond: [{ $eq: ['$riskLevel', 'Low'] }, 1, 0] },
        },
        pendingReview: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending Review'] }, 1, 0] },
        },
        underInvestigation: {
          $sum: { $cond: [{ $eq: ['$status', 'Under Investigation'] }, 1, 0] },
        },
        confirmedCases: {
          $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : null;
};

// Static method to get fraud trends by type
fraudReportSchema.statics.getFraudTypeDistribution = async function (filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$fraudType',
        count: { $sum: 1 },
        averageRiskScore: { $avg: '$riskScore' },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$riskLevel', 'Critical'] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Configure JSON output
fraudReportSchema.set('toJSON', { virtuals: true });
fraudReportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FraudReport', fraudReportSchema);
