const path = require('path');
const Marksheet = require('../models/Marksheet');
const User = require('../models/User');

/* ── GPA extraction helpers ────────────────────────────────────────────────
   We support PDF (via pdf-parse) and plain-text files.
   Images are not supported for OCR in this build — students should upload PDF.
   Returns { gpa, rawText } or { gpa: null, rawText: '' } on failure.
*/
const extractGpaFromBuffer = async (buffer, mimeType, fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  let rawText = '';

  try {
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      // Dynamically require pdf-parse (optional dep — graceful fallback)
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        rawText = data.text || '';
      } catch {
        rawText = '';
      }
    } else if (['.txt', '.text'].includes(ext) || mimeType?.startsWith('text/')) {
      rawText = buffer.toString('utf8');
    }
  } catch {
    rawText = '';
  }

  // Try to find GPA patterns in text:
  // Examples: "GPA: 3.75", "CGPA: 3.75", "GPA 3.75", "Overall GPA 3.75 / 4.0"
  let gpa = null;
  if (rawText) {
    const patterns = [
      /(?:C?GPA|Grade\s*Point\s*Average)[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /(?:Total|Overall|Final|Cumulative)\s+(?:C?GPA)[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
      /([0-9]+(?:\.[0-9]+)?)\s*\/\s*(?:4\.0|10(?:\.0)?)\s*(?:C?GPA|Grade)/i,
    ];
    for (const re of patterns) {
      const m = rawText.match(re);
      if (m) {
        const val = parseFloat(m[1]);
        if (!isNaN(val) && val >= 0 && val <= 10) {
          gpa = Math.round(val * 100) / 100;
          break;
        }
      }
    }
  }

  return { gpa, rawText: rawText.slice(0, 2000) };
};

/* ── Compare GPAs and produce a verdict ───────────────────────────────── */
const compareGpa = (extracted, stored) => {
  if (extracted === null) {
    return {
      status: 'pending',
      verdict: 'Could not extract GPA from the uploaded document. Please upload a text-readable PDF.',
    };
  }
  if (stored === null) {
    return {
      status: 'pending',
      verdict: 'No GPA is recorded in your student profile. Upload cannot be verified automatically.',
    };
  }

  // Normalise both to 0-10 scale before comparing
  // Values <= 4 are assumed to be on a 4.0 scale → convert to 10.0
  const norm = (v) => (v <= 4.0 ? v * 2.5 : v);
  const diff = Math.abs(norm(extracted) - norm(stored));

  if (diff <= 0.25) {
    return { status: 'verified', verdict: `GPA matches profile (extracted: ${extracted}, on record: ${stored}).` };
  }
  if (diff <= 1.0) {
    return {
      status: 'suspicious',
      verdict: `GPA mismatch — extracted ${extracted} but profile shows ${stored}. Flagged for review.`,
    };
  }
  return {
    status: 'fake',
    verdict: `Significant GPA discrepancy — extracted ${extracted} but profile shows ${stored}. Marked as potentially fraudulent.`,
  };
};

/* ── POST /api/marksheets ── upload a marksheet ─────────────────────── */
exports.uploadMarksheet = async (req, res) => {
  try {
    const userId = req.user._id;
    const file   = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Fetch student profile to get stored GPA
    const user = await User.findById(userId).select('name email studentId gpa');
    const storedGpa = user?.gpa ?? null;

    // Extract GPA from uploaded file
    const { gpa: extractedGpa, rawText } = await extractGpaFromBuffer(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const { status, verdict } = compareGpa(extractedGpa, storedGpa);

    const record = await Marksheet.create({
      userId,
      studentName:  user?.name  || '',
      studentEmail: user?.email || '',
      studentId:    user?.studentId || '',
      fileName:     file.originalname,
      fileSize:     file.size,
      mimeType:     file.mimetype,
      extractedGpa,
      rawExtractedText: rawText,
      storedGpa,
      status,
      verdict,
    });

    res.status(201).json({
      success: true,
      message: status === 'verified'
        ? 'Marksheet verified successfully — GPA matches your profile.'
        : status === 'fake'
          ? 'Marksheet flagged: significant GPA discrepancy detected.'
          : status === 'suspicious'
            ? 'Marksheet flagged as suspicious: GPA does not match profile.'
            : 'Marksheet uploaded. GPA could not be verified automatically.',
      data: record,
    });
  } catch (error) {
    console.error('Marksheet upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── GET /api/marksheets/my ── student's own uploads ─────────────────── */
exports.getMyMarksheets = async (req, res) => {
  try {
    const docs = await Marksheet.find({ userId: req.user._id })
      .select('-rawExtractedText')
      .sort({ uploadedAt: -1 })
      .limit(20);
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── GET /api/marksheets ── admin/faculty: all uploads ───────────────── */
exports.getAllMarksheets = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const re = { $regex: req.query.search, $options: 'i' };
      filter.$or = [{ studentName: re }, { studentId: re }, { studentEmail: re }];
    }

    const [docs, total] = await Promise.all([
      Marksheet.find(filter)
        .select('-rawExtractedText')
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit),
      Marksheet.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: docs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
