const Assignment = require('../models/Assignment');
const AssignedAssignment = require('../models/AssignedAssignment');
const Student = require('../models/Student');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { simHash64, hammingDistance, similarityFromDistance, riskFromDistance } = require('../utils/simhash');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/assignments');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

async function extractText(buffer, ext) {
  try {
    if (ext === '.txt') return buffer.toString('utf8').trim();

    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return (data.text || '').trim();
    }

    if (ext === '.docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim();
    }
  } catch (e) {
    console.error(`Text extraction failed (${ext}):`, e.message);
  }
  return '';
}

const normalizeStudentIds = (ids = []) => {
  const clean = ids
    .map((id) => String(id || '').trim())
    .filter(Boolean);
  return [...new Set(clean)];
};

const parseYear = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
};

const resolveCurrentStudent = async (user) => {
  if (!user?.email) return null;

  const email = String(user.email).trim().toLowerCase();
  let student = await Student.findOne({ email }).select('studentId name email department year').lean();

  if (!student && user.studentId) {
    student = await Student.findOne({ studentId: String(user.studentId).trim() })
      .select('studentId name email department year')
      .lean();
  }

  return {
    studentId: student?.studentId || user.studentId || user._id.toString().slice(-8).toUpperCase(),
    studentName: student?.name || user.name,
    studentEmail: student?.email || email,
    department: student?.department || user.department || null,
    year: student?.year ?? null,
  };
};

const createSubmissionRecord = async ({ req, title, subject, assignmentTaskId = null }) => {
  const studentProfile = await resolveCurrentStudent(req.user);
  const rawText = String(req.body?.submissionText || '').trim();

  if (!req.file && !rawText) {
    throw new Error('Either file upload or submission text is required.');
  }

  const ext = req.file ? path.extname(req.file.originalname).toLowerCase() : '.txt';
  const uniqueName = req.file ? `${Date.now()}_${req.user._id}${ext}` : '';

  let textContent = rawText;
  let hash = crypto.createHash('sha256').update(rawText || '').digest('hex');

  if (req.file) {
    hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    fs.writeFileSync(path.join(UPLOAD_DIR, uniqueName), req.file.buffer);

    const extractedText = (await extractText(req.file.buffer, ext)).trim();
    textContent = (extractedText || rawText).slice(0, 50000);
  }

  if (!textContent) {
    throw new Error('Unable to extract text content from submission.');
  }

  const fingerprint = simHash64(textContent);
  const comparisonQuery = assignmentTaskId
    ? { assignmentTask: assignmentTaskId, user: { $ne: req.user._id } }
    : {
        subject: { $regex: new RegExp(`^${subject.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        user: { $ne: req.user._id },
      };

  const existing = await Assignment.find(comparisonQuery)
    .select('_id studentId studentName studentEmail simhash textContent')
    .lean();

  let maxSimilarity = 0;
  let minDistance = 64;
  let topMatch = null;
  const rawMatches = [];

  for (const prior of existing) {
    const priorSimHash = prior.simhash || simHash64(prior.textContent || '');
    const distance = hammingDistance(fingerprint, priorSimHash);
    const similarity = similarityFromDistance(distance);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      minDistance = distance;
      topMatch = prior;
    }

    if (distance <= 15) {
      rawMatches.push({
        assignmentId: prior._id,
        studentId: prior.studentId,
        studentName: prior.studentName,
        hammingDistance: distance,
        similarity,
      });
    }
  }

  const { riskLevel, plagiarismStatus } = riskFromDistance(minDistance);
  const plagiarismScore = Number(maxSimilarity.toFixed(2));

  const newAssignment = await Assignment.create({
    user: req.user._id,
    assignmentTask: assignmentTaskId,
    studentId: studentProfile?.studentId,
    studentEmail: studentProfile?.studentEmail,
    studentName: studentProfile?.studentName,
    title: title.trim(),
    subject: subject.trim(),
    fileName: req.file ? req.file.originalname : 'text_submission.txt',
    filePath: uniqueName,
    fileHash: hash,
    fileType: ext.replace('.', ''),
    textContent,
    simhash: fingerprint,
    plagiarismScore,
    matchedStudentId: topMatch?.studentId || '',
    riskLevel,
    plagiarismStatus,
    highestSimilarity: plagiarismScore,
    matches: rawMatches,
  });

  const message =
    plagiarismStatus === 'fraud'
      ? `Assignment submitted. High similarity detected (${plagiarismScore}%). Potential plagiarism flagged.`
      : plagiarismStatus === 'suspected'
        ? `Assignment submitted. Medium similarity detected (${plagiarismScore}%). Review recommended.`
        : 'Assignment submitted successfully. No plagiarism detected.';

  return {
    newAssignment,
    message,
    plagiarismStatus,
    plagiarismScore,
    riskLevel,
    hammingDistance: minDistance,
    matchedStudentId: topMatch?.studentId || null,
    matchCount: rawMatches.length,
  };
};

exports.createAssignedAssignment = async (req, res) => {
  try {
    const { title, subject, description = '', dueDate, assignmentMode, studentIds = [], studentEmails = [], department, year } = req.body;

    if (!title?.trim() || !subject?.trim() || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, subject, and due date are required.' });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid due date.' });
    }

    const mode = assignmentMode === 'group' ? 'group' : 'students';
    let assignedStudentIds = [];
    let groupFilter = { department: '', year: null };

    if (mode === 'students') {
      const requestedEmails = normalizeStudentIds(studentEmails.length ? studentEmails : studentIds)
        .map((e) => String(e).trim().toLowerCase())
        .filter(Boolean);

      assignedStudentIds = [...new Set(requestedEmails)];
      if (!assignedStudentIds.length) {
        return res.status(400).json({ success: false, message: 'Select at least one student.' });
      }

      const userCount = await User.countDocuments({ role: 'student', email: { $in: assignedStudentIds } });
      if (userCount !== assignedStudentIds.length) {
        return res.status(400).json({ success: false, message: 'One or more selected students are invalid.' });
      }
    } else {
      const query = {};
      const cleanDepartment = String(department || '').trim();
      const parsedYear = parseYear(year);

      if (cleanDepartment) query.department = cleanDepartment;
      if (parsedYear !== null) query.year = parsedYear;

      if (!Object.keys(query).length) {
        return res.status(400).json({ success: false, message: 'Select a department or year for group assignment.' });
      }

      const students = await Student.find(query).select('studentId');
      assignedStudentIds = normalizeStudentIds(students.map((s) => s.studentId));

      if (!assignedStudentIds.length) {
        return res.status(400).json({ success: false, message: 'No students found for the selected group.' });
      }

      groupFilter = { department: cleanDepartment, year: parsedYear };
    }

    const assignment = await AssignedAssignment.create({
      createdBy: req.user._id,
      createdByName: req.user.name,
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      dueDate: parsedDueDate,
      assignmentMode: mode,
      assignedStudentIds,
      groupFilter,
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created and assigned successfully.',
      data: {
        ...assignment.toObject(),
        assignedCount: assignedStudentIds.length,
      },
    });
  } catch (err) {
    console.error('createAssignedAssignment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create assignment.', error: err.message });
  }
};

exports.getAssignableStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .sort({ name: 1 })
      .select('_id name email studentId department');

    return res.json({ success: true, data: students });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students.', error: err.message });
  }
};

exports.getFacultyAssignedAssignments = async (req, res) => {
  try {
    const assignments = await AssignedAssignment.find({ createdBy: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const ids = assignments.map((a) => a._id);
    const submissionStats = await Assignment.aggregate([
      { $match: { assignmentTask: { $in: ids } } },
      { $group: { _id: '$assignmentTask', submittedCount: { $sum: 1 } } },
    ]);

    const countById = new Map(submissionStats.map((s) => [String(s._id), s.submittedCount]));

    const result = assignments.map((a) => {
      const submittedCount = countById.get(String(a._id)) || 0;
      const totalAssigned = a.assignedStudentIds.length;
      return {
        ...a,
        totalAssigned,
        submittedCount,
        pendingCount: Math.max(totalAssigned - submittedCount, 0),
      };
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assigned assignments.', error: err.message });
  }
};

exports.getFacultyAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignmentTask = await AssignedAssignment.findById(assignmentId).lean();
    if (!assignmentTask) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (assignmentTask.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these submissions.' });
    }

    const submissions = await Assignment.find({ assignmentTask: assignmentId })
      .sort({ submittedAt: -1 })
      .select('-textContent -filePath -fileHash');

    return res.json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch submissions.', error: err.message });
  }
};

exports.getStudentAssignedAssignments = async (req, res) => {
  try {
    const studentProfile = await resolveCurrentStudent(req.user);
    if (!studentProfile?.studentId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve student profile for this account.' });
    }

    const now = new Date();
    const tasks = await AssignedAssignment.find({
      isActive: true,
      assignedStudentIds: { $in: [studentProfile.studentEmail, studentProfile.studentId] },
    })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const taskIds = tasks.map((t) => t._id);
    const mySubmissions = await Assignment.find({ studentEmail: studentProfile.studentEmail, assignmentTask: { $in: taskIds } })
      .select('assignmentTask fileName plagiarismStatus plagiarismScore riskLevel matchedStudentId highestSimilarity submittedAt studentId studentEmail')
      .lean();

    const submissionMap = new Map(mySubmissions.map((s) => [String(s.assignmentTask), s]));

    const data = tasks.map((task) => {
      const submission = submissionMap.get(String(task._id));
      return {
        ...task,
        submitted: Boolean(submission),
        isOverdue: !submission && new Date(task.dueDate) < now,
        submission: submission || null,
      };
    });

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch your assigned tasks.', error: err.message });
  }
};

exports.submitAssignedAssignment = async (req, res) => {
  try {
    const studentProfile = await resolveCurrentStudent(req.user);
    if (!studentProfile?.studentId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve student profile for this account.' });
    }

    if (!req.file && !String(req.body?.submissionText || '').trim()) {
      return res.status(400).json({ success: false, message: 'Upload a file or provide submission text.' });
    }

    const { assignmentId } = req.params;
    const task = await AssignedAssignment.findById(assignmentId);

    if (!task || !task.isActive) {
      return res.status(404).json({ success: false, message: 'Assigned assignment not found.' });
    }

    const isAssignedToStudent = task.assignedStudentIds.includes(studentProfile.studentEmail)
      || task.assignedStudentIds.includes(studentProfile.studentId);

    if (!isAssignedToStudent) {
      return res.status(403).json({ success: false, message: 'This assignment is not assigned to you.' });
    }

    if (new Date(task.dueDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Submission window is closed for this assignment.' });
    }

    const existing = await Assignment.findOne({ studentEmail: studentProfile.studentEmail, assignmentTask: task._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already submitted this assignment.' });
    }

    const result = await createSubmissionRecord({
      req,
      title: task.title,
      subject: task.subject,
      assignmentTaskId: task._id,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        id: result.newAssignment._id,
        assignmentId: task._id,
        title: task.title,
        subject: task.subject,
        studentId: result.newAssignment.studentId,
        studentEmail: result.newAssignment.studentEmail,
        plagiarismStatus: result.plagiarismStatus,
        plagiarismScore: result.plagiarismScore,
        riskLevel: result.riskLevel,
        hammingDistance: result.hammingDistance,
        matchedStudentId: result.matchedStudentId,
        highestSimilarity: result.plagiarismScore,
        matchCount: result.matchCount,
      },
    });
  } catch (err) {
    console.error('submitAssignedAssignment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit assignment.', error: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    if (!req.file && !String(req.body?.submissionText || '').trim()) {
      return res.status(400).json({ success: false, message: 'Upload a file or provide submission text.' });
    }

    const { title, subject } = req.body;
    if (!title?.trim() || !subject?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and subject are required.' });
    }

    const result = await createSubmissionRecord({ req, title, subject });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        id: result.newAssignment._id,
        title: result.newAssignment.title,
        subject: result.newAssignment.subject,
        studentId: result.newAssignment.studentId,
        studentEmail: result.newAssignment.studentEmail,
        plagiarismStatus: result.plagiarismStatus,
        plagiarismScore: result.plagiarismScore,
        riskLevel: result.riskLevel,
        hammingDistance: result.hammingDistance,
        matchedStudentId: result.matchedStudentId,
        highestSimilarity: result.plagiarismScore,
        matchCount: result.matchCount,
      },
    });
  } catch (err) {
    console.error('submitAssignment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit assignment.', error: err.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const studentProfile = await resolveCurrentStudent(req.user);
    const assignments = await Assignment.find({ studentEmail: studentProfile?.studentEmail || req.user.email.toLowerCase() })
      .sort({ submittedAt: -1 })
      .select('-textContent -filePath -fileHash');
    return res.json({ success: true, data: assignments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch your assignments.', error: err.message });
  }
};

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .sort({ submittedAt: -1 })
      .select('-textContent -filePath -fileHash');
    return res.json({ success: true, data: assignments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments.', error: err.message });
  }
};

exports.getPlagiarismCases = async (req, res) => {
  try {
    const cases = await Assignment.find({
      plagiarismStatus: { $in: ['suspected', 'fraud'] },
    })
      .sort({ plagiarismScore: -1, submittedAt: -1 })
      .select('-textContent -filePath -fileHash');

    return res.json({ success: true, data: cases });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plagiarism cases.', error: err.message });
  }
};

exports.getLoggedInStudentDetails = async (req, res) => {
  try {
    const studentProfile = await resolveCurrentStudent(req.user);
    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    return res.json({ success: true, data: studentProfile });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student profile.', error: err.message });
  }
};

exports.getStudentPlagiarismReport = async (req, res) => {
  try {
    const studentProfile = await resolveCurrentStudent(req.user);
    if (!studentProfile?.studentEmail) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const report = await Assignment.find({ studentEmail: studentProfile.studentEmail })
      .sort({ submittedAt: -1 })
      .select('-textContent -filePath -fileHash');

    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plagiarism report.', error: err.message });
  }
};

exports.getAssignmentStats = async (req, res) => {
  try {
    const [total, fraud, suspected, involvedUsers, highRiskStudents, suspiciousCases] = await Promise.all([
      Assignment.countDocuments(),
      Assignment.countDocuments({ plagiarismStatus: 'fraud' }),
      Assignment.countDocuments({ plagiarismStatus: 'suspected' }),
      Assignment.distinct('user', { plagiarismStatus: { $in: ['suspected', 'fraud'] } }),
      Assignment.distinct('studentId', { riskLevel: 'high' }),
      Assignment.countDocuments({ riskLevel: { $in: ['high', 'medium'] } }),
    ]);

    return res.json({
      success: true,
      data: {
        totalSubmissions: total,
        fraudDetected: fraud,
        suspected,
        suspiciousCases,
        highRiskStudents: highRiskStudents.length,
        studentsInvolved: involvedUsers.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assignment stats.', error: err.message });
  }
};
