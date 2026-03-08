const mongoose = require('mongoose');

const marksheetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName:  { type: String, default: '' },
    studentEmail: { type: String, default: '' },
    studentId:    { type: String, default: '' },

    fileName:     { type: String, required: true },
    fileSize:     { type: Number, default: 0 },        // bytes
    mimeType:     { type: String, default: '' },

    // Extracted GPA/marks from the document
    extractedGpa: { type: Number, default: null },
    rawExtractedText: { type: String, default: '' },    // first 2000 chars of parsed text

    // GPA stored in student profile at upload time
    storedGpa: { type: Number, default: null },

    // Comparison result
    status: {
      type: String,
      enum: ['pending', 'verified', 'suspicious', 'fake'],
      default: 'pending',
      index: true,
    },
    // Human-readable verdict message
    verdict: { type: String, default: '' },

    uploadedAt: { type: Date, default: Date.now, index: true },
    reviewedBy: { type: String, default: null },
    reviewNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

marksheetSchema.index({ userId: 1, uploadedAt: -1 });

module.exports = mongoose.model('Marksheet', marksheetSchema);
