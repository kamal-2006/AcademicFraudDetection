import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Clock, GraduationCap, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATUS_MAP = {
  verified:   { label: 'Verified',    bg: '#dcfce7', color: '#166534', icon: CheckCircle  },
  suspicious: { label: 'Suspicious',  bg: '#fef9c3', color: '#92400e', icon: AlertTriangle },
  fake:       { label: 'Fake / Fraud',bg: '#fee2e2', color: '#991b1b', icon: XCircle      },
  pending:    { label: 'Pending',     bg: '#ede9fe', color: '#5b21b6', icon: Clock        },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtSize = (bytes) => {
  if (!bytes) return '—';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const MarksheetUpload = () => {
  const { user } = useAuth();

  const [file,       setFile]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg,  setSubmitMsg]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [myList,     setMyList]     = useState([]);

  const fileRef = useRef();

  useEffect(() => {
    api.get('/marksheets/my')
      .then((r)  => setMyList(r.data.data || []))
      .catch(()  => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) {
      setSubmitMsg({ type: 'error', text: 'Only PDF or TXT files are accepted.' });
      return;
    }
    setFile(f);
    setSubmitMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setSubmitMsg({ type: 'error', text: 'Please select a file to upload.' });

    setSubmitting(true);
    setSubmitMsg(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await api.post('/marksheets', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data.data;
      const type = d.status === 'fake' ? 'error'
                 : d.status === 'suspicious' ? 'warn'
                 : d.status === 'verified' ? 'success'
                 : 'info';
      setSubmitMsg({ type, text: res.data.message });

      setFile(null);
      if (fileRef.current) fileRef.current.value = '';

      // Prepend to list
      setMyList((prev) => [d, ...prev]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      setSubmitMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Upload form */}
      <div className="stu-card" style={{ maxWidth: 600, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1a0836' }}>
              Marksheet Upload
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280' }}>
              Upload your marksheet for GPA verification
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div style={{
          background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 10,
          padding: '0.75rem 1rem', marginBottom: '1.25rem',
          display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
        }}>
          <Info size={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#4c1d95', lineHeight: 1.55 }}>
            Upload your official marksheet as a <strong>PDF or TXT</strong> file. The system will
            automatically extract your GPA and compare it with the GPA on record in your student
            profile. Any discrepancy will be flagged for review.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Drop zone */}
          <label
            htmlFor="marksheet-file"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '0.625rem',
              border: `2px dashed ${file ? '#7c3aed' : '#d8d3ee'}`,
              borderRadius: 12, padding: '2rem 1.5rem', cursor: 'pointer',
              background: file ? '#f5f3ff' : '#fafafa',
              transition: 'all 0.15s', userSelect: 'none', marginBottom: '1rem',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: file ? '#ede9fe' : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {file ? <FileText size={22} color="#7c3aed" /> : <Upload size={22} color="#9ca3af" />}
            </div>
            {file ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.15rem', fontWeight: 700, color: '#7c3aed', fontSize: '0.875rem' }}>
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{fmtSize(file.size)}</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.15rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Click to select file
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>PDF or TXT, max 5 MB</p>
              </div>
            )}
            <input
              id="marksheet-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {/* Status message */}
          {submitMsg && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem',
              background:
                submitMsg.type === 'success' ? '#f0fdf4' :
                submitMsg.type === 'error'   ? '#fef2f2' :
                submitMsg.type === 'warn'    ? '#fffbeb' : '#ede9fe',
              border: `1px solid ${
                submitMsg.type === 'success' ? '#bbf7d0' :
                submitMsg.type === 'error'   ? '#fecaca' :
                submitMsg.type === 'warn'    ? '#fde68a' : '#c4b5fd'
              }`,
              color:
                submitMsg.type === 'success' ? '#166534' :
                submitMsg.type === 'error'   ? '#991b1b' :
                submitMsg.type === 'warn'    ? '#92400e' : '#5b21b6',
              fontSize: '0.82rem', lineHeight: 1.5,
            }}>
              {submitMsg.type === 'success' ? <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
               : submitMsg.type === 'error' ? <XCircle     size={14} style={{ flexShrink: 0, marginTop: 1 }} />
               : <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
              {submitMsg.text}
            </div>
          )}

          <button
            type="submit"
            className="stu-btn-primary"
            disabled={!file || submitting}
            style={{ opacity: (!file || submitting) ? 0.55 : 1 }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                  display: 'inline-block', animation: 'stu-spin 0.8s linear infinite',
                }} />
                Uploading…
              </>
            ) : (
              <><Upload size={14} /> Upload Marksheet</>
            )}
          </button>
        </form>
      </div>

      {/* Upload history */}
      <div className="stu-card">
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Upload History
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
            Loading…
          </div>
        ) : myList.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2.5rem 1rem',
            color: '#9ca3af', fontSize: '0.85rem',
          }}>
            <FileText size={32} color="#e5e7eb" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0 }}>No marksheets uploaded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myList.map((item) => {
              const s = STATUS_MAP[item.status] || STATUS_MAP.pending;
              const Icon = s.icon;
              return (
                <div key={item._id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                  padding: '0.875rem 1rem', borderRadius: 10,
                  background: '#fafafa', border: '1px solid #f0edf8',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={s.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.83rem', fontWeight: 600, color: '#1a0836',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
                      }}>
                        {item.fileName}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                        borderRadius: 999, background: s.bg, color: s.color,
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.775rem', color: '#6b7280', lineHeight: 1.45 }}>
                      {item.verdict || 'Processing…'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.72rem', color: '#9ca3af' }}>
                      <span>Uploaded: {fmt(item.uploadedAt)}</span>
                      {item.extractedGpa !== null && item.extractedGpa !== undefined && (
                        <span>Extracted GPA: <strong style={{ color: '#374151' }}>{item.extractedGpa}</strong></span>
                      )}
                      {item.storedGpa !== null && item.storedGpa !== undefined && (
                        <span>Profile GPA: <strong style={{ color: '#374151' }}>{item.storedGpa}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes stu-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default MarksheetUpload;
