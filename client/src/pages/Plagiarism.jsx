import { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, FileText, Users, CheckCircle, XCircle } from 'lucide-react';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import api from '../api/axios';

const C = {
  purple: '#7c3aed', green: '#10b981', orange: '#f59e0b',
  red: '#ef4444', blue: '#3b82f6', gray: '#6b7280',
};

const StatCard = ({ icon: Icon, title, value, sub, accent }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '1rem 1.25rem',
    borderLeft: `4px solid ${accent}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', gap: '0.875rem',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
      background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={20} color={accent} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</p>
      <p style={{ margin: '0.1rem 0 0', fontSize: '1.5rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{value ?? 0}</p>
      {sub && <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: C.gray }}>{sub}</p>}
    </div>
  </div>
);

const STATUS = {
  fraud:     { label: 'Fraud Detected',       bg: '#fee2e2', color: '#991b1b' },
  suspected: { label: 'Plagiarism Suspected', bg: '#fef9c3', color: '#92400e' },
  clean:     { label: 'Clean',                bg: '#dcfce7', color: '#166534' },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'â€”';

const Plagiarism = () => {
  const [cases,   setCases]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [casesRes, statsRes] = await Promise.all([
        api.get('/assignments/plagiarism'),
        api.get('/assignments/stats'),
      ]);
      setCases(casesRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plagiarism data.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    const ms =
      c.studentId?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.subject?.toLowerCase().includes(q);
    const mf = !filter || c.plagiarismStatus === filter;
    return ms && mf;
  });

  if (loading) return <Loading fullScreen />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>
          Assignment Plagiarism Detection
        </h1>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: C.gray }}>
          Detected duplicate and highly similar assignment submissions
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stat cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCard icon={FileText}      title="Total Submissions"    value={stats.totalSubmissions} accent={C.blue}   />
          <StatCard icon={XCircle}       title="Fraud Detected"       value={stats.fraudDetected}    accent={C.red}    sub=">= 80% similarity" />
          <StatCard icon={AlertTriangle} title="Plagiarism Suspected" value={stats.suspected}        accent={C.orange} sub="50 to 79% similarity" />
          <StatCard icon={Users}         title="Students Involved"    value={stats.studentsInvolved} accent={C.purple} />
        </div>
      )}

      {/* Critical alert */}
      {cases.filter(c => c.plagiarismStatus === 'fraud').length > 0 && (
        <div style={{ background: '#fef2f2', borderRadius: 10, padding: '0.875rem 1.25rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} color={C.red} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b', fontWeight: 600 }}>
            {cases.filter(c => c.plagiarismStatus === 'fraud').length} submission(s) flagged as Fraud Detected (&ge; 80% similarity) &mdash; immediate review required.
          </p>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Search size={15} color={C.gray} />
          <input
            type="text"
            placeholder="Search by student, title, or subjectâ€¦"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#111827' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Filter size={14} color={C.gray} />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: '#374151' }}>
            <option value="">All Cases</option>
            <option value="fraud">Fraud Detected</option>
            <option value="suspected">Suspected</option>
          </select>
        </div>
        <button onClick={fetchAll}
          style={{ padding: '0.45rem 1rem', borderRadius: 8, background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '0.8rem', fontWeight: 600, color: C.purple, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Cases table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Plagiarism Cases</p>
          <span style={{ background: '#f3f4f6', borderRadius: 20, padding: '0.15rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle size={36} color="#d1d5db" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, color: C.gray, fontSize: '0.875rem' }}>
              {cases.length === 0 ? 'No plagiarism cases detected yet.' : 'No records match your search.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Student', 'Assignment Title', 'Subject', 'Similarity', 'Status', 'Matched With', 'Submitted'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const st = STATUS[c.plagiarismStatus] || STATUS.clean;
                  const matchNames = (c.matches || [])
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, 3)
                    .map(m => `${m.studentName} (${m.similarity}%)`)
                    .join(', ');
                  return (
                    <tr key={c._id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{c.studentName}</p>
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: C.gray }}>{c.studentId}</p>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151', fontWeight: 500 }}>
                        {c.title}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{c.subject}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: c.highestSimilarity >= 80 ? C.red : c.highestSimilarity >= 50 ? C.orange : C.green }}>
                            {c.highestSimilarity}%
                          </span>
                          <div style={{ flexShrink: 0, width: 50, height: 5, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${c.highestSimilarity}%`, background: c.highestSimilarity >= 80 ? C.red : c.highestSimilarity >= 50 ? C.orange : C.green }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.78rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {matchNames || 'â€”'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: C.gray, whiteSpace: 'nowrap' }}>
                        {fmt(c.submittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ background: '#eff6ff', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid #bfdbfe' }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#1e40af' }}>Similarity Score Guidelines</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#1e40af' }}>
          {[
            { range: '0 to 29%',   label: 'Acceptable',    color: C.green  },
            { range: '30 to 49%',  label: 'Monitor',        color: '#65a30d'},
            { range: '50 to 79%',  label: 'Suspected',      color: C.orange },
            { range: '80 to 100%', label: 'Fraud Detected', color: C.red    },
          ].map(({ range, label, color }) => (
            <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span><strong>{range}</strong> - {label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Plagiarism;
