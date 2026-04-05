import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  Info,
  Eye,
  Award,
} from 'lucide-react';
import api from '../api/axios';

const STATUS_MAP = {
  likely_original: { label: 'Likely Original', bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  suspicious: { label: 'Suspicious', bg: '#fef9c3', color: '#92400e', icon: AlertTriangle },
  likely_fake: { label: 'Likely Fake', bg: '#fee2e2', color: '#991b1b', icon: XCircle },
  pending: { label: 'Pending', bg: '#f1f5f9', color: '#334155', icon: Clock },
};

const CERT_TYPES = [
  'General',
  'Internship',
  'Workshop',
  'Course Completion',
  'Achievement',
  'Sports',
  'Research',
];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';

const fmtSize = (bytes) => {
  if (!bytes) return '--';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const CertificateUpload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [certificateType, setCertificateType] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myList, setMyList] = useState([]);

  const fileRef = useRef();

  useEffect(() => {
    api.get('/certificates/my')
      .then((r) => setMyList(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setSubmitMsg({ type: 'error', text: 'Only PDF, JPG, JPEG, PNG, or WEBP files are accepted.' });
      return;
    }

    setFile(f);
    setSubmitMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setSubmitMsg({ type: 'error', text: 'Please select a certificate file to upload.' });
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title.trim());
    fd.append('certificateType', certificateType);

    try {
      const res = await api.post('/certificates', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const d = res.data.data;
      const type = d.verificationStatus === 'likely_fake'
        ? 'error'
        : d.verificationStatus === 'suspicious'
          ? 'warn'
          : d.verificationStatus === 'likely_original'
            ? 'success'
            : 'info';

      setSubmitMsg({ type, text: res.data.message });
      setFile(null);
      setTitle('');
      setCertificateType('General');
      if (fileRef.current) fileRef.current.value = '';

      setMyList((prev) => [d, ...prev]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Certificate upload failed. Please try again.';
      setSubmitMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const openCertificate = async (id, fileName) => {
    try {
      const response = await api.get(`/certificates/${id}/file`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data);
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        setSubmitMsg({ type: 'warn', text: `Popup blocked. Please allow popups to view ${fileName}.` });
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      setSubmitMsg({ type: 'error', text: 'Unable to open certificate file.' });
    }
  };

  return (
    <>
      <div className="stu-card" style={{ maxWidth: 760, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Award size={20} color="#334155" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Certificate Upload
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280' }}>
              Upload your certificates for automated authenticity verification
            </p>
          </div>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'flex-start',
        }}>
          <Info size={15} color="#475569" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.55 }}>
            Upload certificate files in <strong>PDF or image format</strong>. The system runs fraud checks
            and returns a fraud score with one of three statuses: likely original, suspicious, or likely fake.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Certificate title (optional)"
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 10,
                padding: '0.6rem 0.75rem',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 10,
                padding: '0.6rem 0.75rem',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#fff',
              }}
            >
              {CERT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <label
            htmlFor="certificate-file"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              border: `2px dashed ${file ? '#64748b' : '#d1d5db'}`,
              borderRadius: 12,
              padding: '2rem 1.5rem',
              cursor: 'pointer',
              background: file ? '#f8fafc' : '#fafafa',
              transition: 'all 0.15s',
              userSelect: 'none',
              marginBottom: '1rem',
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: file ? '#e2e8f0' : '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {file ? <FileText size={22} color="#334155" /> : <Upload size={22} color="#9ca3af" />}
            </div>
            {file ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.15rem', fontWeight: 700, color: '#334155', fontSize: '0.875rem' }}>
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{fmtSize(file.size)}</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.15rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Click to select certificate file
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>PDF, JPG, JPEG, PNG, WEBP (max 8 MB)</p>
              </div>
            )}
            <input
              id="certificate-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {submitMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 10,
              marginBottom: '1rem',
              background:
                submitMsg.type === 'success' ? '#f0fdf4' :
                submitMsg.type === 'error' ? '#fef2f2' :
                submitMsg.type === 'warn' ? '#fffbeb' : '#f8fafc',
              border: `1px solid ${
                submitMsg.type === 'success' ? '#bbf7d0' :
                submitMsg.type === 'error' ? '#fecaca' :
                submitMsg.type === 'warn' ? '#fde68a' : '#d1d5db'
              }`,
              color:
                submitMsg.type === 'success' ? '#166534' :
                submitMsg.type === 'error' ? '#991b1b' :
                submitMsg.type === 'warn' ? '#92400e' : '#334155',
              fontSize: '0.82rem',
              lineHeight: 1.5,
            }}>
              {submitMsg.type === 'success' ? <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                : submitMsg.type === 'error' ? <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
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
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  display: 'inline-block',
                  animation: 'stu-spin 0.8s linear infinite',
                }} />
                Uploading...
              </>
            ) : (
              <><Upload size={14} /> Upload Certificate</>
            )}
          </button>
        </form>
      </div>

      <div className="stu-card">
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Certificate History
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
            Loading...
          </div>
        ) : myList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
            <Shield size={32} color="#e5e7eb" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0 }}>No certificates uploaded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myList.map((item) => {
              const s = STATUS_MAP[item.verificationStatus] || STATUS_MAP.pending;
              const Icon = s.icon;
              return (
                <div key={item._id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 10,
                  background: '#fafafa',
                  border: '1px solid #f0edf8',
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: s.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={16} color={s.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.83rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 260,
                      }}>
                        {item.title || item.fileName}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 999,
                        background: s.bg,
                        color: s.color,
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.775rem', color: '#6b7280', lineHeight: 1.45 }}>
                      {item.verificationSummary || 'Verification in progress.'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.72rem', color: '#9ca3af', flexWrap: 'wrap' }}>
                      <span>Type: <strong style={{ color: '#374151' }}>{item.certificateType || 'General'}</strong></span>
                      <span>Fraud score: <strong style={{ color: '#374151' }}>{item.fraudScore ?? 0}/100</strong></span>
                      <span>Uploaded: {fmt(item.uploadedAt)}</span>
                      <span>Size: {fmtSize(item.fileSize)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCertificate(item._id, item.fileName)}
                    style={{
                      border: '1px solid #d1d5db',
                      background: '#f8fafc',
                      color: '#334155',
                      borderRadius: 8,
                      padding: '0.4rem 0.55rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={13} /> View
                  </button>
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

export default CertificateUpload;