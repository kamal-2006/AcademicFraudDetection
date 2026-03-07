import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATUS_MAP = {
  clean:     { label: 'Clean',              bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  suspected: { label: 'Plagiarism Suspected', bg: '#fef9c3', color: '#92400e', icon: AlertTriangle },
  fraud:     { label: 'Fraud Detected',      bg: '#fee2e2', color: '#991b1b', icon: XCircle },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const AssignmentSubmission = () => {
  const { user } = useAuth();

  // Form state
  const [title,   setTitle]   = useState('');
  const [subject, setSubject] = useState('');
  const [file,    setFile]    = useState(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg,  setSubmitMsg]  = useState(null);   // { type: 'success'|'error'|'warn', text }
  const [loading,    setLoading]    = useState(true);
  const [myList,     setMyList]     = useState([]);

  const fileRef = useRef();

  // Load student's own submissions on mount
  useEffect(() => {
    api.get('/assignments/my')
      .then(r  => setMyList(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setSubmitMsg({ type: 'error', text: 'Only PDF, DOCX, or TXT files are allowed.' });
      return;
    }
    setFile(f);
    setSubmitMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim())   return setSubmitMsg({ type: 'error', text: 'Please enter an assignment title.' });
    if (!subject.trim()) return setSubmitMsg({ type: 'error', text: 'Please enter the subject name.' });
    if (!file)           return setSubmitMsg({ type: 'error', text: 'Please select a file to upload.' });

    setSubmitting(true);
    setSubmitMsg(null);

    const fd = new FormData();
    fd.append('file',    file);
    fd.append('title',   title.trim());
    fd.append('subject', subject.trim());

    try {
      const res = await api.post('/assignments', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data.data;
      const type = d.plagiarismStatus === 'fraud' ? 'error'
                 : d.plagiarismStatus === 'suspected' ? 'warn'
                 : 'success';
      setSubmitMsg({ type, text: res.data.message });

      // Reset form
      setTitle('');
      setSubject('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';

      // Refresh list
      const updated = await api.get('/assignments/my');
      setMyList(updated.data.data || []);
    } catch (err) {
      setSubmitMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit assignment. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Alert banner colours ─────────────────────────────────────────────────
  const bannerStyle = (type) => ({
    padding: '0.75rem 1rem',
    borderRadius: 10,
    border: `1px solid ${type === 'success' ? '#a7f3d0' : type === 'warn' ? '#fde68a' : '#fecaca'}`,
    background: type === 'success' ? '#f0fdf4' : type === 'warn' ? '#fffbeb' : '#fef2f2',
    color: type === 'success' ? '#166534' : type === 'warn' ? '#92400e' : '#991b1b',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="stu-welcome" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="stu-welcome-title" style={{ fontSize: '1.3rem' }}>
            Assignment Submission
          </h1>
          <p className="stu-welcome-sub">
            Upload your assignments below. Each submission is automatically scanned for plagiarism.
          </p>
        </div>
      </div>

      {/* ── Upload form ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={16} color="#7c3aed" />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Upload New Assignment</p>
        </div>

        {submitMsg && (
          <div style={{ ...bannerStyle(submitMsg.type), marginBottom: '1rem' }}>
            {submitMsg.type === 'success' ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              : submitMsg.type === 'warn' ? <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              : <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
            {submitMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                Assignment Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Data Structures Lab 3"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                style={{
                  padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db',
                  fontSize: '0.875rem', color: '#111827', outline: 'none', background: '#fafafa',
                }}
                onFocus={e  => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e   => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Subject */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                Subject <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={100}
                style={{
                  padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db',
                  fontSize: '0.875rem', color: '#111827', outline: 'none', background: '#fafafa',
                }}
                onFocus={e  => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e   => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>
          </div>

          {/* File picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
              Assignment File <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <label
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', padding: '1.5rem', borderRadius: 10,
                border: `2px dashed ${file ? '#7c3aed' : '#d1d5db'}`,
                background: file ? '#f5f3ff' : '#fafafa',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {file ? (
                <>
                  <FileText size={26} color="#7c3aed" />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#7c3aed' }}>{file.name}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <Upload size={26} color="#9ca3af" />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Click to upload</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>PDF, DOCX, or TXT · Max 10 MB</p>
                </>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              alignSelf: 'flex-start', padding: '0.65rem 1.5rem', borderRadius: 9,
              background: submitting ? '#c4b5fd' : '#7c3aed', color: '#fff',
              border: 'none', fontSize: '0.875rem', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Assignment'}
          </button>
        </form>
      </div>

      {/* ── My Submissions ─────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} color="#7c3aed" />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111827' }}>My Submissions</p>
          <span style={{ marginLeft: 'auto', background: '#f3f4f6', borderRadius: 20, padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>
            {myList.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Loading…
          </div>
        ) : myList.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <FileText size={36} color="#d1d5db" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              No submissions yet. Upload your first assignment above.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Title', 'Subject', 'File', 'Status', 'Similarity', 'Submitted'].map(h => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem', textAlign: 'left',
                      fontSize: '0.7rem', fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myList.map(a => {
                  const st = STATUS_MAP[a.plagiarismStatus] || STATUS_MAP.clean;
                  const Icon = st.icon;
                  return (
                    <tr key={a._id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111827', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.title}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{a.subject}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.fileName}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '0.2rem 0.65rem', borderRadius: 999,
                          fontSize: '0.7rem', fontWeight: 700,
                          background: st.bg, color: st.color,
                        }}>
                          <Icon size={11} />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {a.highestSimilarity > 0 ? (
                          <span style={{
                            fontWeight: 700,
                            color: a.highestSimilarity >= 80 ? '#991b1b'
                                 : a.highestSimilarity >= 50 ? '#92400e'
                                 : '#166534',
                          }}>
                            {a.highestSimilarity}%
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {fmt(a.submittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Info box ───────────────────────────────────────────────────── */}
      <div style={{ background: '#eff6ff', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid #bfdbfe', display: 'flex', gap: '0.75rem' }}>
        <Clock size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.82rem', color: '#1e40af' }}>
          <strong>Plagiarism Detection Policy</strong><br />
          Submissions with <strong>≥ 80%</strong> similarity are marked <em>Fraud Detected</em>.
          Submissions with <strong>50–79%</strong> similarity are marked <em>Suspected</em> and flagged for review.
          Always submit your own original work.
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmission;
