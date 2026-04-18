import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Clock, BookOpen, CalendarDays } from 'lucide-react';
import { assignmentService } from '../api/services';

const STATUS_MAP = {
  clean: { label: 'Clean', bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  suspected: { label: 'Plagiarism Suspected', bg: '#fef9c3', color: '#92400e', icon: AlertTriangle },
  fraud: { label: 'Fraud Detected', bg: '#fee2e2', color: '#991b1b', icon: XCircle },
};

const RISK_MAP = {
  low: { label: 'Low Risk', bg: '#dcfce7', color: '#166534' },
  medium: { label: 'Medium Risk', bg: '#fef9c3', color: '#92400e' },
  high: { label: 'High Risk', bg: '#fee2e2', color: '#991b1b' },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const AssignmentSubmission = () => {
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [file, setFile] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const fileRef = useRef();

  const refreshAssigned = async () => {
    const res = await assignmentService.getStudentAssignedAssignments();
    setAssigned(res.data || []);
  };

  useEffect(() => {
    Promise.all([
      refreshAssigned(),
      assignmentService.getLoggedInStudentDetails(),
    ])
      .then(([, profileRes]) => {
        setStudentDetails(profileRes.data || null);
      })
      .catch((err) => {
        setSubmitMsg({
          type: 'error',
          text: err.response?.data?.message || 'Failed to load assigned assignments.',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingAssignments = useMemo(
    () => assigned.filter((a) => !a.submitted && !a.isOverdue),
    [assigned]
  );

  useEffect(() => {
    if (!selectedAssignmentId && pendingAssignments.length > 0) {
      setSelectedAssignmentId(pendingAssignments[0]._id);
    }

    if (selectedAssignmentId && !pendingAssignments.some((a) => a._id === selectedAssignmentId)) {
      setSelectedAssignmentId(pendingAssignments[0]?._id || '');
    }
  }, [pendingAssignments, selectedAssignmentId]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setSubmitMsg({ type: 'error', text: 'Only PDF, DOCX, or TXT files are allowed.' });
      if (fileRef.current) fileRef.current.value = '';
      setFile(null);
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setSubmitMsg({ type: 'error', text: 'File too large. Maximum file size is 10MB.' });
      if (fileRef.current) fileRef.current.value = '';
      setFile(null);
      return;
    }

    setFile(f);
    setSubmitMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAssignmentId) {
      setSubmitMsg({ type: 'error', text: 'Select an assignment to submit.' });
      return;
    }

    if (!studentDetails?.studentId) {
      setSubmitMsg({ type: 'error', text: 'Student profile is incomplete. Please contact admin.' });
      return;
    }

    if (!file && !submissionText.trim()) {
      setSubmitMsg({ type: 'error', text: 'Upload a file or enter assignment text.' });
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);
    setLastResult(null);

    const fd = new FormData();
    if (file) fd.append('file', file);
    if (submissionText.trim()) fd.append('submissionText', submissionText.trim());

    try {
      const res = await assignmentService.submitAssignedAssignment(selectedAssignmentId, fd);
      const resultData = res.data || null;
      setLastResult(resultData);

      let successText = res.message || 'Assignment submitted successfully.';
      if (resultData) {
        const score = Number(resultData.plagiarismScore || 0).toFixed(2);
        const status = String(resultData.plagiarismStatus || 'clean').toLowerCase();
        const statusLabel = STATUS_MAP[status]?.label || 'Clean';
        successText = `${successText} Fraud check result: ${statusLabel} (${score}%).`;
      }

      setSubmitMsg({ type: 'success', text: successText });
      setFile(null);
      setSubmissionText('');
      if (fileRef.current) fileRef.current.value = '';
      await refreshAssigned();
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const serverError = err.response?.data?.error;
      const baseMessage = serverMessage || serverError || 'Assignment submission failed. Please verify your input and retry.';
      setSubmitMsg({
        type: 'error',
        text: baseMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const bannerStyle = (type) => ({
    padding: '0.75rem 1rem',
    borderRadius: 10,
    border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}`,
    background: type === 'success' ? '#f0fdf4' : '#fef2f2',
    color: type === 'success' ? '#166534' : '#991b1b',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="stu-welcome" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="stu-welcome-title" style={{ fontSize: '1.3rem' }}>
            Assigned Assignments
          </h1>
          <p className="stu-welcome-sub">
            View only assignments assigned to you and submit your work before the due date.
          </p>
        </div>
      </div>

      {studentDetails && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem 1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Logged-in Student Profile
          </p>
          <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', fontSize: '0.84rem' }}>
            <div><strong>Name:</strong> {studentDetails.studentName || '-'}</div>
            <div><strong>Email:</strong> {studentDetails.studentEmail || '-'}</div>
            <div><strong>Student ID:</strong> {studentDetails.studentId || '-'}</div>
            <div><strong>Department:</strong> {studentDetails.department || '-'}</div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={16} color="#334155" />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Submit Assignment</p>
        </div>

        {submitMsg && (
          <div style={{ ...bannerStyle(submitMsg.type), marginBottom: '1rem' }}>
            {submitMsg.type === 'success'
              ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              : <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
            {submitMsg.text}
          </div>
        )}

        {lastResult && (
          <div
            style={{
              marginBottom: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              background: '#f8fafc',
              padding: '0.75rem 1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: '#334155',
            }}
          >
            <div><strong>Plagiarism Status:</strong> {STATUS_MAP[lastResult.plagiarismStatus]?.label || 'Clean'}</div>
            <div><strong>Plagiarism Score:</strong> {Number(lastResult.plagiarismScore || 0).toFixed(2)}%</div>
            <div><strong>Risk Level:</strong> {RISK_MAP[lastResult.riskLevel]?.label || 'Low Risk'}</div>
            <div><strong>Matched Student:</strong> {lastResult.matchedStudentId || '-'}</div>
          </div>
        )}

        {pendingAssignments.length === 0 ? (
          <div style={{ border: '1px dashed #d1d5db', borderRadius: 10, padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            No open assignments pending submission.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) minmax(220px,1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Assigned Task</label>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  style={{
                    padding: '0.6rem 0.875rem',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    color: '#111827',
                    background: '#fafafa',
                  }}
                >
                  {pendingAssignments.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.title} ({item.subject}) - due {fmtDate(item.dueDate)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Assignment File</label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.875rem',
                    borderRadius: 8,
                    border: `1px solid ${file ? '#64748b' : '#d1d5db'}`,
                    background: file ? '#f8fafc' : '#fafafa',
                    cursor: 'pointer',
                    minHeight: 42,
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <Upload size={16} color={file ? '#334155' : '#6b7280'} />
                  <span style={{ fontSize: '0.84rem', color: file ? '#334155' : '#6b7280' }}>
                    {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Choose PDF, DOCX, or TXT'}
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Submission Text (optional)</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={4}
                placeholder="Paste extracted assignment content here for stronger fraud analysis"
                style={{ padding: '0.7rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fafafa', resize: 'vertical', fontSize: '0.84rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                alignSelf: 'flex-start',
                padding: '0.65rem 1.5rem',
                borderRadius: 9,
                background: submitting ? '#cbd5e1' : '#1e293b',
                color: '#fff',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </form>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} color="#475569" />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111827' }}>My Assigned Tasks</p>
          <span style={{ marginLeft: 'auto', background: '#f3f4f6', borderRadius: 20, padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>
            {assigned.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Loading assigned assignments...
          </div>
        ) : assigned.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <FileText size={36} color="#d1d5db" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              No assignments assigned to your account yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Title', 'Subject', 'Due Date', 'Status', 'Submission', 'Score', 'Risk', 'Matched Student'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assigned.map((a) => {
                  const st = STATUS_MAP[a.submission?.plagiarismStatus] || STATUS_MAP.clean;
                  const Icon = st.icon;
                  const risk = RISK_MAP[a.submission?.riskLevel] || RISK_MAP.low;
                  const statusText = a.submitted ? 'Submitted' : a.isOverdue ? 'Overdue' : 'Pending';
                  const statusColor = a.submitted ? '#166534' : a.isOverdue ? '#991b1b' : '#92400e';
                  const statusBg = a.submitted ? '#dcfce7' : a.isOverdue ? '#fee2e2' : '#fef3c7';

                  return (
                    <tr key={a._id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111827' }}>{a.title}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{a.subject}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <CalendarDays size={12} /> {fmtDate(a.dueDate)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: statusBg, color: statusColor, borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>
                          {statusText}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{fmtDate(a.submission?.submittedAt)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {a.submitted ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '0.2rem 0.65rem',
                              borderRadius: 999,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: st.bg,
                              color: st.color,
                            }}
                          >
                            <Icon size={11} />
                            {Number(a.submission?.plagiarismScore || 0).toFixed(2)}%
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {a.submitted ? (
                          <span style={{ background: risk.bg, color: risk.color, borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>
                            {risk.label}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                        {a.submission?.matchedStudentId || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
        <Clock size={16} color="#475569" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
          <strong>Submission Policy</strong><br />
          Submit before due date to avoid rejection. SimHash fraud checks run automatically: Hamming distance 0 to 5 is high risk, 6 to 15 is medium risk, and greater than 15 is low risk.
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmission;
