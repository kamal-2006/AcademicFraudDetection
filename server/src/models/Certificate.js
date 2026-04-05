const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: { type: String, default: '' },
    studentEmail: { type: String, default: '' },
    studentId: { type: String, default: '' },

    certificateType: { type: String, default: 'General' },
    title: { type: String, default: '' },

    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    fileHash: { type: String, required: true, index: true },
    fileData: { type: Buffer, required: true },

    extractedText: { type: String, default: '' },
    matchedKeywords: [{ type: String }],
    suspiciousSignals: [{ type: String }],

    verificationStatus: {
      type: String,
      enum: ['pending', 'likely_original', 'suspicious', 'likely_fake'],
      default: 'pending',
      index: true,
    },
    fraudScore: { type: Number, default: 0 },
    verificationSummary: { type: String, default: '' },

    uploadedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

certificateSchema.index({ userId: 1, uploadedAt: -1 });
certificateSchema.index({ verificationStatus: 1, uploadedAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);