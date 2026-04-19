const Question = require('../models/Question');
const TestSession = require('../models/TestSession');
const TestFraudLog = require('../models/TestFraudLog');
const User = require('../models/User');

// GET /api/test/questions
exports.getQuestions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const subject = req.query.subject;
    const filter = { active: true };
    if (subject) filter.subject = subject;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
      // Strip correct answer before sending to client
      { $project: { correctAnswer: 0 } },
    ]);

    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/test/sessions — start a new test session
exports.startSession = async (req, res) => {
  try {
    const { questionIds } = req.body;
    const userId = req.user._id;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'questionIds are required' });
    }

    // If a session is already in progress, resume it
    const existing = await TestSession.findOne({ userId, status: 'in-progress' });
    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const session = await TestSession.create({
      userId,
      userEmail: req.user.email,
      userName: req.user.name,
      questions: questionIds,
      totalMarks: questionIds.length,
    });

    // Track this session as the user's active quiz session (for concurrent-login detection)
    await User.findByIdAndUpdate(userId, { activeSessionId: session._id });

    await TestFraudLog.create({
      sessionId: session._id,
      userId,
      eventType: 'session_start',
      details: 'Test session started',
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/test/sessions/:id/submit — submit answers, calculate score
exports.submitSession = async (req, res) => {
  try {
    const { answers } = req.body;
    const sessionId = req.params.id;
    const userId = req.user._id;

    const session = await TestSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'in-progress') {
      // Already submitted — return the existing session
      return res.json({ success: true, data: session });
    }

    // Fetch questions with correct answers to score
    const questions = await Question.find({ _id: { $in: session.questions } });
    const correctMap = {};
    questions.forEach((q) => { correctMap[q._id.toString()] = q.correctAnswer; });

    let score = 0;
    const processedAnswers = (answers || []).map((a) => {
      const isCorrect = correctMap[a.questionId] === a.selectedOption;
      if (isCorrect) score += 1;
      return {
        questionId: a.questionId,
        selectedOption: a.selectedOption || null,
        isCorrect,
        answeredAt: new Date(),
      };
    });

    const totalQ = session.questions.length;
    const duration = Math.round((Date.now() - session.startedAt.getTime()) / 1000);
    const percentageScore = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;

    session.answers = processedAnswers;
    session.score = score;
    session.totalMarks = totalQ;
    session.percentageScore = percentageScore;
    session.submittedAt = new Date();
    session.duration = duration;
    session.suspicious = session.fraudCount > 0;
    session.status = session.fraudCount > 3 ? 'flagged' : 'submitted';
    await session.save();

    // Release the active session lock so another login is no longer a fraud signal
    await User.findByIdAndUpdate(userId, { activeSessionId: null });

    await TestFraudLog.create({
      sessionId: session._id,
      userId,
      eventType: 'session_end',
      details: `Submitted. Score: ${score}/${totalQ} (${percentageScore}%). Fraud events: ${session.fraudCount}`,
    });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/test/sessions/:id/fraud — log a fraud event
exports.logFraudEvent = async (req, res) => {
  try {
    const { eventType, details, faceCount, pointsAdded, fraudScoreAtTime } = req.body;
    const sessionId = req.params.id;
    const userId = req.user._id;

    const VALID_EVENTS = [
      'multiple_faces', 'no_face', 'fullscreen_exit',
      'camera_disabled', 'tab_switch', 'noise_detected',
      'looking_left', 'looking_right', 'looking_up', 'looking_down', 'head_turned_away',
      'copy_paste', 'devtools_open',
      'attention_dot_hit', 'attention_dot_delayed', 'attention_dot_missed', 'low_attention',
      'session_start', 'session_end', 'terminated',
    ];
    if (!VALID_EVENTS.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid event type' });
    }

    const session = await TestSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const pts = Number(pointsAdded) || 0;
    const scoreNow = Number(fraudScoreAtTime) || 0;

    const log = await TestFraudLog.create({
      sessionId,
      userId,
      eventType,
      details: details || '',
      faceCount: faceCount ?? null,
      pointsAdded: pts,
      fraudScoreAtTime: scoreNow,
    });

    // Only count events that add points as fraud incidents
    if (pts > 0) {
      session.fraudCount += 1;
      session.fraudScore = scoreNow;
      session.suspicious = true;

      // Populate user/student to get name/id for notification
      const userDoc = await require('../models/User').findById(userId);
      const studentDoc = userDoc && userDoc.studentId ? await require('../models/Student').findOne({ studentId: userDoc.studentId }) : null;
      const studentName = userDoc ? userDoc.name : 'Unknown';
      const studentIdStr = userDoc && userDoc.studentId ? userDoc.studentId : 'Unknown ID';
      const studentRefId = studentDoc ? studentDoc._id : null;

      // Create Notification
      const { createNotification } = require('./notificationController');
      await createNotification({
        title: 'Test Fraud Detected',
        message: `Suspicious activity (${eventType}) detected for student ${studentName} (${studentIdStr}). Details: ${details || 'None'}.`,
        studentId: studentRefId,
        fraudType: eventType,
        relatedId: log._id,
        relatedModel: 'TestFraudLog',
        targetRoles: ['admin', 'faculty']
      });
    }
    if (scoreNow >= 100 || eventType === 'terminated') {
      session.status = 'flagged';
      session.terminated = true;
      // Release the active session lock when terminated by proctoring
      await require('../models/User').findByIdAndUpdate(session.userId, { activeSessionId: null });
    }
    await session.save();

    res.status(201).json({
      success: true,
      data: log,
      session: { fraudCount: session.fraudCount, fraudScore: session.fraudScore, status: session.status },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/test/my-results — get all completed sessions for the logged-in student
exports.getMyResults = async (req, res) => {
  try {
    const userId = req.user._id;

    const results = await TestSession.find(
      { userId, status: { $in: ['submitted', 'flagged'] } },
      { answers: 0 } // exclude detailed answers from list view
    ).sort({ submittedAt: -1 }).limit(20);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/test/sessions/:id — get a single session detail
exports.getSessionDetail = async (req, res) => {
  try {
    const session = await TestSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('questions', '-correctAnswer');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Also fetch fraud logs for this session
    const fraudLogs = await TestFraudLog.find({ sessionId: req.params.id })
      .select('-__v')
      .sort({ timestamp: 1 });

    res.json({ success: true, data: { session, fraudLogs } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/test/results/all — faculty/admin: all completed quiz sessions
exports.getAllTestResults = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { status: { $in: ['submitted', 'flagged'] } };
    if (req.query.status && ['submitted', 'flagged'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const users = await User.find({
        $or: [
          { name:      { $regex: req.query.search, $options: 'i' } },
          { studentId: { $regex: req.query.search, $options: 'i' } },
          { email:     { $regex: req.query.search, $options: 'i' } },
        ],
      }).select('_id');
      filter.userId = { $in: users.map((u) => u._id) };
    }

    const [results, total, allSummary] = await Promise.all([
      TestSession.find(filter, { answers: 0 })
        .populate('userId', 'name email studentId')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      TestSession.countDocuments(filter),
      TestSession.find(
        { status: { $in: ['submitted', 'flagged'] } },
        { percentageScore: 1, status: 1, fraudScore: 1, duration: 1 }
      ),
    ]);

    const avgScore = allSummary.length
      ? Math.round(allSummary.reduce((s, r) => s + (r.percentageScore || 0), 0) / allSummary.length)
      : 0;
    const passCount    = allSummary.filter((r) => (r.percentageScore || 0) >= 50).length;
    const flaggedCount = allSummary.filter((r) => r.status === 'flagged').length;

    res.json({
      success: true,
      data: results,
      stats: { total: allSummary.length, avgScore, passCount, flaggedCount },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/test/proctoring/logs — faculty/admin: all fraud logs across sessions
exports.getAllProctoringLogs = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.eventType) filter.eventType = req.query.eventType;
    if (req.query.userId)    filter.userId    = req.query.userId;

    // Student name/ID full-text search
    if (req.query.search) {
      const matchedUsers = await User.find({
        $or: [
          { name:      { $regex: req.query.search, $options: 'i' } },
          { studentId: { $regex: req.query.search, $options: 'i' } },
          { email:     { $regex: req.query.search, $options: 'i' } },
        ],
      }).select('_id');
      filter.userId = { $in: matchedUsers.map((u) => u._id) };
    }

    const [logs, total] = await Promise.all([
      TestFraudLog.find(filter)
        .populate('userId', 'name email role studentId')
        .populate('sessionId', 'status fraudScore fraudCount percentageScore startedAt submittedAt')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      TestFraudLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/test/proctoring/sessions — faculty/admin: all flagged/suspicious sessions
exports.getProctoringSessionSummary = async (req, res) => {
  try {
    const sessions = await TestSession.find(
      { suspicious: true },
      { answers: 0 }
    )
      .populate('userId', 'name email studentId')
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/test/proctoring/analyze — proxy a base64 frame to the Python service
// The Python service (proctoring_service.py) must be running on PROCTORING_SERVICE_URL.
exports.analyzeFrame = async (req, res) => {
  const serviceUrl = process.env.PROCTORING_SERVICE_URL || 'http://localhost:5001';

  if (!req.body || !req.body.frame) {
    return res.status(400).json({ success: false, message: "Missing 'frame' field" });
  }

  try {
    const response = await fetch(`${serviceUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frame: req.body.frame, sessionId: req.body.sessionId }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ success: false, message: `Proctoring service error: ${errText}` });
    }

    const data = await response.json();

    // Persist each violation as a fraud log entry (best-effort)
    const sessionId = req.body.sessionId;
    const userId    = req.user._id;
    if (sessionId && Array.isArray(data.violations) && data.violations.length > 0) {
      const POINTS_MAP = {
        no_face: 20, multiple_faces: 30,
        looking_left: 10, looking_right: 10, looking_up: 10, looking_down: 10,
        head_turned_away: 15,
      };

      const session = await TestSession.findOne({ _id: sessionId, userId }).catch(() => null);
      if (session) {
        for (const v of data.violations) {
          const pts = POINTS_MAP[v.type] || 0;
          await TestFraudLog.create({
            sessionId, userId,
            eventType: v.type,
            details: v.message || '',
            pointsAdded: pts,
            fraudScoreAtTime: (session.fraudScore || 0) + pts,
          }).catch(() => {});
        }
      }
    }

    return res.json({ success: true, data });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      // Python service is not running — return a degraded response instead of an error
      return res.json({ success: true, data: { available: false, face_count: null, head_pose: null, alerts: [], violations: [] } });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/test/sessions/:id/heartbeat — lightweight poll endpoint for TakeTest frontend.
// Returns current session status fields so the client can detect remote termination
// (e.g. concurrent login fraud) without fetching the full session + questions.
exports.getSessionHeartbeat = async (req, res) => {
  try {
    const session = await TestSession.findOne(
      { _id: req.params.id, userId: req.user._id },
      { status: 1, terminated: 1, fraudScore: 1, fraudCount: 1, concurrentLoginDetected: 1 },
    );
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/test/fraud-cases — admin/faculty: all flagged sessions as fraud case list
exports.getQuizFraudCases = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { status: 'flagged' };
    if (req.query.search) {
      const users = await User.find({
        $or: [
          { name:      { $regex: req.query.search, $options: 'i' } },
          { studentId: { $regex: req.query.search, $options: 'i' } },
          { email:     { $regex: req.query.search, $options: 'i' } },
        ],
      }).select('_id');
      filter.userId = { $in: users.map((u) => u._id) };
    }

    const [sessions, total] = await Promise.all([
      TestSession.find(filter, { answers: 0 })
        .populate('userId', 'name email studentId')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      TestSession.countDocuments(filter),
    ]);

    // Attach fraud log highlights (top violations per session)
    const enriched = await Promise.all(
      sessions.map(async (s) => {
        const topLogs = await TestFraudLog.find(
          { sessionId: s._id, pointsAdded: { $gt: 0 } },
          { eventType: 1, pointsAdded: 1, timestamp: 1, details: 1 },
        ).sort({ timestamp: 1 }).limit(5);
        return { session: s.toObject(), topViolations: topLogs };
      })
    );

    res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
