const Assignment = require('../models/Assignment');
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');

// ── Upload directory ────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/assignments');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Text extraction ─────────────────────────────────────────────────────────
async function extractText(buffer, ext) {
  try {
    if (ext === '.txt')  return buffer.toString('utf8').trim();

    if (ext === '.pdf') {
      // pdf-parse is imported lazily to avoid test-fixture side-effects at startup
      const pdfParse = require('pdf-parse');
      const data     = await pdfParse(buffer);
      return (data.text || '').trim();
    }

    if (ext === '.docx') {
      const mammoth = require('mammoth');
      const result  = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim();
    }
  } catch (e) {
    console.error(`Text extraction failed (${ext}):`, e.message);
  }
  return '';
}

// ── Similarity engine ───────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'can','this','that','these','those','it','its','as','if','not','no',
  'all','both','each','more','most','other','some','into','over','also',
  'very','just','which','who','what','when','where','how','why',
  'i','we','you','he','she','they','me','us','him','her','them',
  'my','our','your','his','their','any','am','so','then','than',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function jaccard(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : Math.round((inter / union) * 100);
}

function ngramSet(tokens, n) {
  const s = new Set();
  for (let i = 0; i <= tokens.length - n; i++)
    s.add(tokens.slice(i, i + n).join('|'));
  return s;
}

function computeSimilarity(textA, textB) {
  if (!textA || !textB) return 0;
  const tA = tokenize(textA);
  const tB = tokenize(textB);
  if (!tA.length || !tB.length) return 0;

  const wordScore = jaccard(new Set(tA), new Set(tB));

  // 4-gram overlap (catches copied sequences even with word substitutions)
  const ng4Score = tA.length >= 4 && tB.length >= 4
    ? jaccard(ngramSet(tA, 4), ngramSet(tB, 4))
    : wordScore;

  // Take the higher of the two — conservative (flags both exact copies & paraphrasing)
  return Math.max(wordScore, ng4Score);
}

// ── POST /api/assignments ───────────────────────────────────────────────────
exports.submitAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { title, subject } = req.body;
    if (!title?.trim() || !subject?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and subject are required.' });
    }

    const ext  = path.extname(req.file.originalname).toLowerCase();
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Persist file to disk
    const uniqueName = `${Date.now()}_${req.user._id}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, uniqueName), req.file.buffer);

    // Extract searchable text (capped at 50 000 chars for DB efficiency)
    const textContent = (await extractText(req.file.buffer, ext)).slice(0, 50000);

    // Sanitise subject for regex (prevent injection)
    const escapedSubject = subject.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Fetch all other students' submissions for the same subject
    const existing = await Assignment.find({
      subject: { $regex: new RegExp(`^${escapedSubject}$`, 'i') },
      user:    { $ne: req.user._id },
    }).select('_id user studentId studentName textContent fileHash highestSimilarity plagiarismStatus');

    let highestSimilarity = 0;
    const rawMatches = [];

    for (const prior of existing) {
      let sim = prior.fileHash && prior.fileHash === hash
        ? 100   // identical file → 100 %
        : computeSimilarity(textContent, prior.textContent || '');

      if (sim >= 30) {
        rawMatches.push({
          assignmentId: prior._id,
          studentId:    prior.studentId,
          studentName:  prior.studentName,
          similarity:   sim,
        });
        if (sim > highestSimilarity) highestSimilarity = sim;
      }
    }

    const plagiarismStatus =
      highestSimilarity >= 80 ? 'fraud' :
      highestSimilarity >= 50 ? 'suspected' :
      'clean';

    const newAssignment = await Assignment.create({
      user:              req.user._id,
      studentId:         req.user.studentId || req.user._id.toString().slice(-8).toUpperCase(),
      studentName:       req.user.name,
      title:             title.trim(),
      subject:           subject.trim(),
      fileName:          req.file.originalname,
      filePath:          uniqueName,
      fileHash:          hash,
      fileType:          ext.replace('.', ''),
      textContent,
      plagiarismStatus,
      highestSimilarity,
      matches:           rawMatches,
    });

    // Back-update every prior submission that was matched at ≥ 50 %
    for (const match of rawMatches.filter(m => m.similarity >= 50)) {
      const prior = await Assignment.findById(match.assignmentId);
      if (!prior) continue;

      const alreadyIn = prior.matches.some(
        m => m.assignmentId?.toString() === newAssignment._id.toString()
      );
      if (!alreadyIn) {
        prior.matches.push({
          assignmentId: newAssignment._id,
          studentId:    newAssignment.studentId,
          studentName:  newAssignment.studentName,
          similarity:   match.similarity,
        });
      }
      if (match.similarity > prior.highestSimilarity) {
        prior.highestSimilarity = match.similarity;
      }
      prior.plagiarismStatus =
        prior.highestSimilarity >= 80 ? 'fraud' :
        prior.highestSimilarity >= 50 ? 'suspected' :
        'clean';
      await prior.save();
    }

    const message =
      plagiarismStatus === 'fraud'
        ? `Assignment submitted. High similarity detected (${highestSimilarity}%) — marked as Fraud Detected.`
        : plagiarismStatus === 'suspected'
          ? `Assignment submitted. Potential similarity (${highestSimilarity}%) detected — marked as Suspected.`
          : 'Assignment submitted successfully. No plagiarism detected.';

    res.status(201).json({
      success: true,
      message,
      data: {
        id: newAssignment._id,
        title: newAssignment.title,
        subject: newAssignment.subject,
        plagiarismStatus,
        highestSimilarity,
        matchCount: rawMatches.length,
      },
    });
  } catch (err) {
    console.error('submitAssignment error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit assignment.', error: err.message });
  }
};

// ── GET /api/assignments/my ─────────────────────────────────────────────────
exports.getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ user: req.user._id })
      .sort({ submittedAt: -1 })
      .select('-textContent -filePath -fileHash');
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your assignments.', error: err.message });
  }
};

// ── GET /api/assignments ────────────────────────────────────────────────────
exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .sort({ submittedAt: -1 })
      .select('-textContent -filePath -fileHash');
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments.', error: err.message });
  }
};

// ── GET /api/assignments/plagiarism ─────────────────────────────────────────
exports.getPlagiarismCases = async (req, res) => {
  try {
    const cases = await Assignment.find({
      plagiarismStatus: { $in: ['suspected', 'fraud'] },
    })
      .sort({ highestSimilarity: -1, submittedAt: -1 })
      .select('-textContent -filePath -fileHash');
    res.json({ success: true, data: cases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch plagiarism cases.', error: err.message });
  }
};

// ── GET /api/assignments/stats ──────────────────────────────────────────────
exports.getAssignmentStats = async (req, res) => {
  try {
    const [total, fraud, suspected, involvedUsers] = await Promise.all([
      Assignment.countDocuments(),
      Assignment.countDocuments({ plagiarismStatus: 'fraud' }),
      Assignment.countDocuments({ plagiarismStatus: 'suspected' }),
      Assignment.distinct('user', { plagiarismStatus: { $in: ['suspected', 'fraud'] } }),
    ]);
    res.json({
      success: true,
      data: {
        totalSubmissions:  total,
        fraudDetected:     fraud,
        suspected,
        studentsInvolved:  involvedUsers.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignment stats.', error: err.message });
  }
};
