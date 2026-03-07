import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Upload, X, Users, AlertTriangle, Award, TrendingUp, UserPlus } from 'lucide-react';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import api from '../api/axios';

const C = {
  purple: '#7c3aed', green: '#10b981', orange: '#f59e0b',
  red: '#ef4444', blue: '#3b82f6', gray: '#6b7280',
};

const RISK_STYLE = {
  Low:      { bg: '#dcfce7', color: '#166534' },
  Medium:   { bg: '#fef9c3', color: '#92400e' },
  High:     { bg: '#fee2e2', color: '#991b1b' },
  Critical: { bg: '#fce7f3', color: '#831843' },
};

const RiskBadge = ({ level }) => {
  const key = level ? level.charAt(0).toUpperCase() + level.slice(1).toLowerCase() : 'Low';
  const s = RISK_STYLE[key] || RISK_STYLE.Low;
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: s.bg, color: s.color }}>
      {key}
    </span>
  );
};

const StatCard = ({ icon: Icon, title, value, accent }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', borderLeft: `4px solid ${accent}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={accent} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</p>
      <p style={{ margin: '0.1rem 0 0', fontSize: '1.5rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{value ?? 0}</p>
    </div>
  </div>
);

const EMPTY = { studentId: '', name: '', email: '', department: '', year: '', gpa: '', attendance: '' };

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/students', { params: { limit: 1000 } });
      setStudents(res.data.data || []);
    } catch {
      setError('Failed to load students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const e = {};
    if (!form.studentId.trim()) e.studentId = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.department.trim()) e.department = 'Required';
    const yr = Number(form.year);
    if (!form.year || isNaN(yr) || yr < 1 || yr > 5) e.year = '1–5 only';
    const gpa = parseFloat(form.gpa);
    if (!form.gpa || isNaN(gpa) || gpa < 0 || gpa > 10) e.gpa = '0.0–10.0';
    const att = parseFloat(form.attendance);
    if (!form.attendance || isNaN(att) || att < 0 || att > 100) e.attendance = '0–100';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      await api.post('/students', {
        studentId: form.studentId.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        year: Number(form.year),
        gpa: parseFloat(form.gpa),
        attendance: parseFloat(form.attendance),
      });
      setSuccess('Student added successfully.');
      setShowModal(false);
      setForm(EMPTY);
      setFormErrors({});
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Please select a valid CSV file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
    setSelectedFile(file);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', selectedFile);
      const res = await api.post('/students/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { summary } = res.data;
      let msg = `Uploaded ${summary.inserted} student(s)`;
      if (summary.duplicates > 0 || summary.validationErrors > 0)
        msg += ` (${summary.duplicates} duplicates, ${summary.validationErrors} errors)`;
      setSuccess(msg);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStudents();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        const first = data.errors[0];
        const detail = Array.isArray(first.errors) ? first.errors.join('; ') : JSON.stringify(first);
        setError(`${data.message} — Row ${first.row}: ${detail}`);
      } else {
        setError(data?.message || 'Failed to upload CSV. Check that the file has columns: Student ID, Name, Email, Department, Year, GPA, Attendance.');
      }
    } finally {
      setUploading(false);
    }
  };

  const filtered = students.filter(s => {
    const q = searchTerm.toLowerCase();
    const ms = s.name?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    const mr = filterRisk === 'all' || (s.riskLevel || '').toLowerCase() === filterRisk.toLowerCase();
    return ms && mr;
  });

  const highRisk = students.filter(s => ['high', 'critical'].includes((s.riskLevel || '').toLowerCase())).length;
  const avgGPA  = students.length ? (students.reduce((a, s) => a + (s.gpa || 0), 0) / students.length).toFixed(2) : '0.00';
  const avgAtt  = students.length ? (students.reduce((a, s) => a + (s.attendance || 0), 0) / students.length).toFixed(1) + '%' : '0%';

  const INPUT = (key, label, placeholder, type = 'text', full = false) => (
    <div key={key} style={{ gridColumn: full ? '1 / -1' : 'span 1' }}>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: `1.5px solid ${formErrors[key] ? C.red : '#d1d5db'}`, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
      />
      {formErrors[key] && <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: C.red }}>{formErrors[key]}</p>}
    </div>
  );

  if (loading) return <Loading fullScreen />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Student Management</h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: C.gray }}>View and manage student records</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm(EMPTY); setFormErrors({}); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.1rem', borderRadius: 8, background: C.purple, border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard icon={Users}         title="Total Students"     value={students.length} accent={C.blue}   />
        <StatCard icon={AlertTriangle} title="High / Critical Risk" value={highRisk}       accent={C.red}    />
        <StatCard icon={Award}         title="Average CGPA"        value={avgGPA}          accent={C.green}  />
        <StatCard icon={TrendingUp}    title="Avg Attendance"      value={avgAtt}          accent={C.purple} />
      </div>

      {/* CSV Upload */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Upload size={18} color={C.purple} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>Bulk Upload via CSV</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: C.gray }}>Risk level is auto-computed from GPA &amp; attendance on upload</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} id="csv-up" disabled={uploading} />
          <label htmlFor="csv-up" style={{ padding: '0.45rem 1rem', borderRadius: 7, border: `1px solid ${C.purple}`, color: C.purple, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: '#f9f8fd' }}>
            {selectedFile ? 'Change File' : 'Choose CSV'}
          </label>
          {selectedFile && (
            <span style={{ fontSize: '0.8rem', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
              {selectedFile.name}
              <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.gray, padding: 0 }}><X size={14} /></button>
            </span>
          )}
          <button onClick={handleUpload} disabled={!selectedFile || uploading}
            style={{ padding: '0.45rem 1rem', borderRadius: 7, background: selectedFile && !uploading ? C.green : '#d1d5db', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: selectedFile ? 'pointer' : 'not-allowed' }}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: C.gray }}>
          <strong>Format:</strong> Student ID, Name, Email, Department, Year, GPA, Attendance · Max 5 MB
        </p>
      </div>

      {/* Search + Filter */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Search size={15} color={C.gray} />
          <input type="text" placeholder="Search by name, ID or email…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: '#111827', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Filter size={14} color={C.gray} />
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: '#374151' }}>
            <option value="all">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Students ({filtered.length})</p>
        </div>
        {filtered.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Student ID', 'Name', 'Email', 'Department', 'Year', 'GPA', 'Attendance', 'Risk Level'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id || s.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#374151', whiteSpace: 'nowrap' }}>{s.studentId}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td style={{ padding: '0.7rem 1rem', color: C.gray }}>{s.email}</td>
                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{s.department}</td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', color: '#374151' }}>{s.year}</td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 700, color: (s.gpa||0) >= 7.5 ? C.green : (s.gpa||0) >= 6.0 ? C.orange : C.red }}>{(s.gpa||0).toFixed(2)}</td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 700, color: (s.attendance||0) >= 75 ? C.green : (s.attendance||0) >= 60 ? C.orange : C.red }}>{s.attendance||0}%</td>
                    <td style={{ padding: '0.7rem 1rem' }}><RiskBadge level={s.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray, fontSize: '0.875rem' }}>
            {students.length === 0 ? 'No students yet. Add a student or upload a CSV.' : 'No students match the current filters.'}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Add New Student</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY); setFormErrors({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {INPUT('studentId',  'Student ID',   'STU001', 'text')}
              {INPUT('name',       'Full Name',     'John Doe', 'text')}
              {INPUT('email',      'Email',         'john@uni.edu', 'email', true)}
              {INPUT('department', 'Department',    'Computer Science', 'text')}
              {INPUT('year',       'Year (1–5)',    '2', 'number')}
              {INPUT('gpa',        'CGPA (0.0–10.0)', '8.5', 'number')}
              {INPUT('attendance', 'Attendance %',  '85', 'number')}
            </div>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: C.gray }}>Risk level is automatically calculated from GPA and attendance.</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => { setShowModal(false); setForm(EMPTY); setFormErrors({}); }}
                style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1.5px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                style={{ flex: 2, padding: '0.6rem', borderRadius: 8, border: 'none', background: saving ? '#a78bfa' : C.purple, color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                {saving ? 'Saving…' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
