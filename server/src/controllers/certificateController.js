const crypto = require('crypto');
const path = require('path');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

const TRUST_KEYWORDS = [
  'certificate',
  'certify',
  'awarded',
  'issued',
  'completion',
  'university',
  'institute',
  'board',
  'registrar',
  'principal',
  'seal',
];

const SUSPICIOUS_TERMS = ['sample', 'demo', 'template', 'fake', 'editable', 'for practice'];

const extractTextFromBuffer = async (buffer, mimeType, fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  let rawText = '';

  try {
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        rawText = data?.text || '';
      } catch {
        rawText = '';
      }
    }
  } catch {
    rawText = '';
  }

  return rawText.slice(0, 4000);
};

const analyzeCertificate = ({ fileName, mimeType, fileSize, extractedText, hasCrossUserDuplicate }) => {
  let score = 0;
  const suspiciousSignals = [];

  const ext = path.extname(fileName).toLowerCase();
  const extMimeMap = {
    '.pdf': ['application/pdf'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.webp': ['image/webp'],
  };

  if (extMimeMap[ext] && !extMimeMap[ext].includes(mimeType)) {
    score += 18;
    suspiciousSignals.push('File extension and MIME type mismatch.');
  }

  if (fileSize < 40 * 1024) {
    score += 18;
    suspiciousSignals.push('File size is unusually small for a certificate.');
  }

  if (hasCrossUserDuplicate) {
    score += 35;
    suspiciousSignals.push('Exact duplicate file hash found across different users.');
  }

  const lower = (extractedText || '').toLowerCase();
  const matchedKeywords = TRUST_KEYWORDS.filter((kw) => lower.includes(kw));
  const matchedSuspiciousTerms = SUSPICIOUS_TERMS.filter((kw) => lower.includes(kw));

  if (lower) {
    if (lower.length < 140) {
      score += 16;
      suspiciousSignals.push('Extracted certificate text is very short.');
    }

    if (matchedKeywords.length < 2) {
      score += 24;
      suspiciousSignals.push('Missing expected certificate terminology.');
    }

    if (!/\b(19|20)\d{2}\b/.test(lower)) {
      score += 8;
      suspiciousSignals.push('No valid year detected in extracted text.');
    }

    if (!/(signature|registrar|principal|controller|authority|seal)/i.test(lower)) {
      score += 10;
      suspiciousSignals.push('No signature or issuing authority keywords detected.');
    }

    if (matchedSuspiciousTerms.length > 0) {
      score += 40;
      suspiciousSignals.push(`Suspicious terms found: ${matchedSuspiciousTerms.join(', ')}.`);
    }

    if (matchedKeywords.length >= 4 && lower.length > 250 && matchedSuspiciousTerms.length === 0) {
      score -= 12;
    }
  } else {
    score += mimeType === 'application/pdf' ? 30 : 22;
    suspiciousSignals.push('Could not extract text for semantic verification.');
  }

  score = Math.max(0, Math.min(100, score));

  let verificationStatus = 'likely_original';
  if (score >= 70) verificationStatus = 'likely_fake';
  else if (score >= 40) verificationStatus = 'suspicious';

  const summary =
    verificationStatus === 'likely_fake'
      ? 'Certificate appears likely fake based on multiple fraud indicators.'
      : verificationStatus === 'suspicious'
        ? 'Certificate appears suspicious and should be manually reviewed.'
        : 'Certificate appears likely original based on automated checks.';

  return {
    fraudScore: score,
    verificationStatus,
    verificationSummary: summary,
    matchedKeywords,
    suspiciousSignals,
  };
};

exports.uploadCertificate = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No certificate file uploaded.' });
    }

    const user = await User.findById(userId).select('name email studentId');
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const duplicate = await Certificate.findOne({ fileHash }).select('userId');
    const hasCrossUserDuplicate = Boolean(
      duplicate && String(duplicate.userId) !== String(userId)
    );

    const extractedText = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);
    const analysis = analyzeCertificate({
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      extractedText,
      hasCrossUserDuplicate,
    });

    const record = await Certificate.create({
      userId,
      studentName: user?.name || '',
      studentEmail: user?.email || '',
      studentId: user?.studentId || '',
      certificateType: req.body?.certificateType || 'General',
      title: req.body?.title || '',
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileHash,
      fileData: file.buffer,
      extractedText,
      matchedKeywords: analysis.matchedKeywords,
      suspiciousSignals: analysis.suspiciousSignals,
      verificationStatus: analysis.verificationStatus,
      fraudScore: analysis.fraudScore,
      verificationSummary: analysis.verificationSummary,
    });

    const responseRecord = record.toObject();
    delete responseRecord.fileData;
    delete responseRecord.extractedText;

    res.status(201).json({
      success: true,
      message:
        analysis.verificationStatus === 'likely_fake'
          ? 'Certificate uploaded and flagged as likely fake.'
          : analysis.verificationStatus === 'suspicious'
            ? 'Certificate uploaded and marked suspicious for review.'
            : 'Certificate uploaded and marked likely original.',
      data: responseRecord,
    });
  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyCertificates = async (req, res) => {
  try {
    const docs = await Certificate.find({ userId: req.user._id })
      .select('-fileData -extractedText')
      .sort({ uploadedAt: -1 })
      .limit(25);

    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCertificates = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.verificationStatus = req.query.status;
    if (req.query.search) {
      const re = { $regex: req.query.search, $options: 'i' };
      filter.$or = [{ studentName: re }, { studentId: re }, { studentEmail: re }, { title: re }];
    }

    const [docs, total] = await Promise.all([
      Certificate.find(filter)
        .select('-fileData -extractedText')
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
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

exports.getCertificateFile = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .select('fileData mimeType fileName userId');

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (req.user.role === 'student' && String(cert.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this certificate.' });
    }

    res.setHeader('Content-Type', cert.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${cert.fileName}"`);
    return res.send(cert.fileData);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};