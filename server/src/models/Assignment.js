const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    studentId:    { type: String },
    studentName:  { type: String },
    similarity:   { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId:   { type: String, required: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true },
    subject:     { type: String, required: true, trim: true, index: true },
    fileName:    { type: String, required: true },
    filePath:    { type: String, required: true },
    fileHash:    { type: String, default: '' },
    fileType:    { type: String, enum: ['txt', 'pdf', 'docx'], required: true },
    textContent: { type: String, default: '' },
    plagiarismStatus: {
      type: String,
      enum: ['clean', 'suspected', 'fraud'],
      default: 'clean',
      index: true,
    },
    highestSimilarity: { type: Number, default: 0, min: 0, max: 100 },
    matches:           [matchSchema],
    submittedAt:       { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
