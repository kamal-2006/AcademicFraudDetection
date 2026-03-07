const Question = require('../models/Question');
const TestSession = require('../models/TestSession');
const TestFraudLog = require('../models/TestFraudLog');

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
    }
    if (scoreNow >= 100 || eventType === 'terminated') {
      session.status = 'flagged';
      session.terminated = true;
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

// GET /api/test/proctoring/logs — faculty/admin: all fraud logs across sessions
exports.getAllProctoringLogs = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.eventType) filter.eventType = req.query.eventType;
    if (req.query.userId)    filter.userId    = req.query.userId;

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
