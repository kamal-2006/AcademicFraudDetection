const User          = require('../models/User');
const Student       = require('../models/Student');
const FraudReport   = require('../models/FraudReport');
const Attendance    = require('../models/Attendance');
const ExamPerformance = require('../models/ExamPerformance');
const TestSession   = require('../models/TestSession');
const TestFraudLog  = require('../models/TestFraudLog');
const Assignment    = require('../models/Assignment');
const Certificate   = require('../models/Certificate');

// ── Shared month-key helpers ─────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const makeKey  = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
const makeLabel = (d)   => `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;

/**
 * GET /api/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      registeredStudents,
      totalFraudReports,
      activeInvestigations,
      recentFraudReports,
      totalTestsCompleted,
      flaggedSessions,
      terminatedSessions,
      testScoreAgg,
      malpracticeLogCount,
      fraudByType,
      recentFlaggedSessions,
      totalAssignments,
      plagiarismCasesCount,
      highRiskPlagiarismStudents,
      certificateLikelyFake,
      certificateSuspicious,
      recentCertificateFraud,
    ] = await Promise.all([
      // Only count users who registered via the website with role = student
      User.countDocuments({ role: 'student' }),
      FraudReport.countDocuments(),
      FraudReport.countDocuments({ status: { $in: ['Pending', 'Under Review'] } }),
      FraudReport.countDocuments({ detectionTimestamp: { $gte: sevenDaysAgo } }),
      TestSession.countDocuments({ status: { $in: ['submitted', 'flagged'] } }),
      TestSession.countDocuments({ status: 'flagged' }),
      TestSession.countDocuments({ terminated: true }),
      TestSession.aggregate([
        { $match: { status: { $in: ['submitted', 'flagged'] } } },
        {
          $group: {
            _id: null,
            avgScore:  { $avg: '$percentageScore' },
            passCount: { $sum: { $cond: [{ $gte: ['$percentageScore', 50] }, 1, 0] } },
            failCount: { $sum: { $cond: [{ $lt:  ['$percentageScore', 50] }, 1, 0] } },
            total:     { $sum: 1 },
          },
        },
      ]),
      TestFraudLog.countDocuments({ pointsAdded: { $gt: 0 } }),
      FraudReport.aggregate([
        { $group: { _id: '$fraudType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      TestSession.find({ status: 'flagged' })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate('userId', 'name email studentId')
        .select('userName userEmail fraudScore fraudCount percentageScore submittedAt status terminated'),
      Assignment.countDocuments(),
      Assignment.countDocuments({ plagiarismStatus: { $in: ['suspected', 'fraud'] } }),
      Assignment.distinct('studentId', { riskLevel: 'high' }),
      Certificate.countDocuments({ verificationStatus: 'likely_fake' }),
      Certificate.countDocuments({ verificationStatus: 'suspicious' }),
      Certificate.find({ verificationStatus: { $in: ['likely_fake', 'suspicious'] } })
        .sort({ uploadedAt: -1 })
        .limit(5)
        .select('studentName studentId studentEmail verificationStatus verificationSummary fraudScore uploadedAt'),
    ]);

    const perf     = testScoreAgg[0] || { avgScore: 0, passCount: 0, failCount: 0, total: 0 };
    const passRate = perf.total > 0 ? Math.round((perf.passCount / perf.total) * 100) : 0;

    // Build a unified fraud-type distribution that includes quiz and certificate violations.
    const fraudTypeMap = {};
    fraudByType.forEach((f) => { fraudTypeMap[f._id] = f.count; });
    if (flaggedSessions > 0)   fraudTypeMap['Quiz Violation']    = (fraudTypeMap['Quiz Violation']    || 0) + flaggedSessions;
    if (certificateLikelyFake > 0) {
      fraudTypeMap['Fake Certificate'] = (fraudTypeMap['Fake Certificate'] || 0) + certificateLikelyFake;
    }
    if (certificateSuspicious > 0) {
      fraudTypeMap['Suspicious Certificate'] =
        (fraudTypeMap['Suspicious Certificate'] || 0) + certificateSuspicious;
    }
    if (plagiarismCasesCount > 0) fraudTypeMap['Plagiarism']    = (fraudTypeMap['Plagiarism']          || 0) + plagiarismCasesCount;

    const unifiedFraudByType = Object.entries(fraudTypeMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count);

    const totalUnifiedFraudCases =
      flaggedSessions +
      certificateLikelyFake +
      certificateSuspicious +
      plagiarismCasesCount +
      totalFraudReports;

    res.json({
      success: true,
      data: {
        totalStudents:       registeredStudents,
        totalTestsCompleted,
        totalFraudAlerts:    totalFraudReports,
        totalFraudCases:     totalUnifiedFraudCases,
        malpracticeLogs:     malpracticeLogCount,
        flaggedSessions,
        terminatedSessions,
        activeInvestigations,
        recentFraudReports,
        certificateLikelyFake,
        certificateSuspicious,
        recentCertificateFraud,
        testPerformance: {
          avgScore:     Math.round((perf.avgScore || 0) * 10) / 10,
          passCount:    perf.passCount,
          failCount:    perf.failCount,
          flaggedCount: flaggedSessions,
          passRate,
        },
        fraudByType: unifiedFraudByType,
        recentFlaggedSessions,
        totalAssignments,
        plagiarismCasesCount,
        highRiskPlagiarismStudents: highRiskPlagiarismStudents.length,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * GET /api/dashboard/trends?months=6
 * Returns a unified array of monthly data points consumed by the frontend charts.
 */
exports.getDashboardTrends = async (req, res) => {
  try {
    const months = Math.min(12, parseInt(req.query.months) || 6);
    const since  = new Date();
    since.setMonth(since.getMonth() - months);

    const [fraudTrend, testsTrend, registrationsTrend] = await Promise.all([
      // Monthly proctoring violations
      TestFraudLog.aggregate([
        { $match: { createdAt: { $gte: since }, pointsAdded: { $gt: 0 } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Monthly completed tests
      TestSession.aggregate([
        { $match: { submittedAt: { $gte: since }, status: { $in: ['submitted', 'flagged'] } } },
        {
          $group: {
            _id:      { year: { $year: '$submittedAt' }, month: { $month: '$submittedAt' } },
            total:    { $sum: 1 },
            flagged:  { $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } },
            avgScore: { $avg: '$percentageScore' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Monthly new student registrations (User model, role=student)
      User.aggregate([
        { $match: { role: 'student', createdAt: { $gte: since } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Index by key string for O(1) lookup
    const fraudMap = {};
    fraudTrend.forEach((r) => { fraudMap[makeKey(r._id.year, r._id.month)] = r.count; });

    const testsMap = {};
    testsTrend.forEach((r) => {
      testsMap[makeKey(r._id.year, r._id.month)] = {
        total:    r.total,
        flagged:  r.flagged,
        avgScore: Math.round((r.avgScore || 0) * 10) / 10,
      };
    });

    const regMap = {};
    registrationsTrend.forEach((r) => { regMap[makeKey(r._id.year, r._id.month)] = r.count; });

    // Build a contiguous month array (oldest → newest)
    const combined = [];
    for (let i = months - 1; i >= 0; i--) {
      const d   = new Date();
      d.setMonth(d.getMonth() - i);
      const key = makeKey(d.getFullYear(), d.getMonth() + 1);
      combined.push({
        month:         makeLabel(d),
        fraudEvents:   fraudMap[key]          || 0,
        testsTotal:    testsMap[key]?.total   || 0,
        testsFlagged:  testsMap[key]?.flagged || 0,
        avgScore:      testsMap[key]?.avgScore || 0,
        newStudents:   regMap[key]            || 0,
      });
    }

    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Dashboard trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard trends' });
  }
};

/**
 * GET /api/dashboard/recent-activities
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const [recentFraudReports, recentAttendance, recentFailingExams] = await Promise.all([
      FraudReport.find()
        .populate('student', 'studentId name email department')
        .sort('-detectionTimestamp')
        .limit(parseInt(limit)),
      Attendance.find({ status: 'critical' })
        .populate('student', 'studentId name email department')
        .sort('-createdAt')
        .limit(parseInt(limit)),
      ExamPerformance.find({ status: 'Fail' })
        .populate('student', 'studentId name email department')
        .sort('-examDate')
        .limit(parseInt(limit)),
    ]);
    res.json({ success: true, data: { recentFraudReports, recentAttendance, recentFailingExams } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recent activities' });
  }
};

/**
 * GET /api/dashboard/high-risk-students
 */
exports.getHighRiskStudents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const highRiskStudents = await Student.find({ riskLevel: { $in: ['Critical', 'High'] } })
      .sort({ riskLevel: -1, gpa: 1, attendance: 1 })
      .limit(parseInt(limit));

    const studentsWithFraudCounts = await Promise.all(
      highRiskStudents.map(async (s) => {
        const fraudCount = await FraudReport.countDocuments({ studentId: s.studentId });
        return { ...s.toObject(), fraudReportCount: fraudCount };
      })
    );
    res.json({ success: true, data: studentsWithFraudCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch high-risk students' });
  }
};
