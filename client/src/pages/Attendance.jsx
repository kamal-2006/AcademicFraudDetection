import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { attendanceService } from '../api/services';

const C = {
  purple: '#7c3aed', green: '#10b981', orange: '#f59e0b',
  red: '#ef4444', blue: '#3b82f6', gray: '#6b7280',
};

const StatCard = ({ icon: Icon, title, value, sub, accent }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', borderLeft: `4px solid ${accent}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
  regular:  { bg: '#dcfce7', color: '#166534', label: 'Regular' },
  warning:  { bg: '#fef9c3', color: '#92400e', label: 'Warning' },
  critical: { bg: '#fee2e2', color: '#991b1b', label: 'Critical' },
};

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [lowStudents, setLowStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [attRes, statsRes, lowRes] = await Promise.all([
        attendanceService.getAllAttendance({}),
        attendanceService.getAttendanceStats(),
        attendanceService.getLowAttendanceStudents(75),
      ]);
      setAttendanceData(attRes.data || []);
      setStats(statsRes.data || null);
      setLowStudents(lowRes.data || []);
    } catch {
      setError('Failed to load attendance data.');
      setAttendanceData([]);
      setLowStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = attendanceData.filter(r => {
    const q = searchTerm.toLowerCase();
    const ms = r.studentId?.toLowerCase().includes(q) || r.student?.name?.toLowerCase().includes(q) || r.subject?.toLowerCase().includes(q);
    const mf = !filterStatus || r.status === filterStatus;
    return ms && mf;
  });

  if (loading) return <Loading fullScreen />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Attendance Monitoring</h1>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: C.gray }}>Track and monitor student attendance records</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCard icon={TrendingUp}  title="Average Attendance"  value={`${stats.avgAttendance?.toFixed(1) ?? 0}%`} accent={C.blue} />
          <StatCard icon={CheckCircle} title="Regular (≥75%)"      value={stats.regularCount  || 0} accent={C.green}  />
          <StatCard icon={AlertCircle} title="Warning (60–74%)"    value={stats.warningCount  || 0} accent={C.orange} />
          <StatCard icon={XCircle}     title="Critical (<60%)"     value={stats.criticalCount || 0} accent={C.red}    />
        </div>
      )}

      {/* Low Attendance Alert */}
      {lowStudents.length > 0 && (
        <div style={{ background: '#fff7ed', borderRadius: 10, padding: '0.875rem 1.25rem', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={18} color={C.orange} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
            {lowStudents.length} student(s) have attendance below 75% and require attention.
          </p>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Search size={15} color={C.gray} />
          <input type="text" placeholder="Search by student ID, name or subject…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#111827' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Filter size={14} color={C.gray} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: '#374151' }}>
            <option value="">All Status</option>
            <option value="regular">Regular</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Attendance Records ({filtered.length})</p>
        </div>
        {filtered.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Student ID', 'Name', 'Subject', 'Month / Year', 'Attended / Total', 'Percentage', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const st  = STATUS[r.status] || STATUS.regular;
                  const pct = r.attendancePercentage ?? 0;
                  return (
                    <tr key={r._id || i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#374151', whiteSpace: 'nowrap' }}>{r.studentId}</td>
                      <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{r.student?.name || '–'}</td>
                      <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{r.subject}</td>
                      <td style={{ padding: '0.7rem 1rem', color: C.gray }}>{r.month} {r.year}</td>
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'center', color: '#374151' }}>{r.attendedClasses}/{r.totalClasses}</td>
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 700, color: pct >= 75 ? C.green : pct >= 60 ? C.orange : C.red }}>{pct.toFixed(1)}%</td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray, fontSize: '0.875rem' }}>No attendance records found.</div>
        )}
      </div>

      {/* Low Attendance Students */}
      {lowStudents.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#991b1b' }}>Low Attendance Students ({lowStudents.length})</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: C.gray }}>Students with overall attendance below 75%</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Student ID', 'Name', 'Department', 'Avg Attendance', 'Critical Subjects'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStudents.map(s => (
                  <tr key={s.studentId} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#374151' }}>{s.studentId}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: '#111827' }}>{s.name}</td>
                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{s.department}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: C.red }}>{s.avgAttendance?.toFixed(1)}%</td>
                    <td style={{ padding: '0.7rem 1rem', color: C.orange, fontWeight: 700 }}>{s.criticalSubjects || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Attendance;
