const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    studentId:    { type: String },
    studentName:  { type: String },
    hammingDistance: { type: Number, min: 0, default: 0 },
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
    assignmentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssignedAssignment',
      default: null,
      index: true,
    },
    studentId:   { type: String, required: true, trim: true, index: true },
    studentEmail:{ type: String, required: true, trim: true, lowercase: true, index: true },
    studentName: { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true },
    subject:     { type: String, required: true, trim: true, index: true },
    fileName:    { type: String, required: true },
    filePath:    { type: String, required: true },
    fileHash:    { type: String, default: '' },
    fileType:    { type: String, enum: ['txt', 'pdf', 'docx'], required: true },
    textContent: { type: String, default: '' },
    simhash:     { type: String, default: '', index: true },
    plagiarismScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    isNoted: { type: Boolean, default: false },
    matchedStudentId: { type: String, default: '', trim: true },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
      index: true,
    },
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

assignmentSchema.index({ assignmentTask: 1, submittedAt: -1 });
assignmentSchema.index({ assignmentTask: 1, simhash: 1 });
assignmentSchema.index({ studentEmail: 1, submittedAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
