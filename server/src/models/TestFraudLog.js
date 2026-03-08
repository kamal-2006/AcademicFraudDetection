const mongoose = require('mongoose');

const testFraudLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSession',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'multiple_faces',
        'no_face',
        'fullscreen_exit',
        'camera_disabled',
        'tab_switch',
        'noise_detected',
        'looking_left',
        'looking_right',
        'looking_up',
        'looking_down',
        'head_turned_away',
        'copy_paste',
        'devtools_open',
        'session_start',
        'session_end',
        'terminated',
        'concurrent_login',
      ],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, default: '' },
    faceCount: { type: Number, default: null },
    pointsAdded: { type: Number, default: 0 },
    fraudScoreAtTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testFraudLogSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model('TestFraudLog', testFraudLogSchema);
