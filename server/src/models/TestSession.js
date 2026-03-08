const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: String, default: null },
    isCorrect: { type: Boolean, default: false },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const testSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: { type: String },
    userName: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentageScore: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    duration: { type: Number, default: 0 }, // seconds
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'flagged', 'abandoned'],
      default: 'in-progress',
    },
    suspicious: { type: Boolean, default: false },
    fraudCount: { type: Number, default: 0 },
    fraudScore: { type: Number, default: 0 },
    terminated: { type: Boolean, default: false },
    concurrentLoginDetected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

testSessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('TestSession', testSessionSchema);
