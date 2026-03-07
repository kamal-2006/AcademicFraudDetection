import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, FileText, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { examService } from '../api/services';

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

const gradeColor = g => {
  if (['A+', 'A', 'A-'].includes(g)) return C.green;
  if (['B+', 'B', 'B-'].includes(g)) return C.blue;
  if (['C+', 'C', 'C-'].includes(g)) return C.orange;
  return C.red;
};

const ExamPerformance = () => {
  const [examData, setExamData]             = useState([]);
  const [stats, setStats]                   = useState(null);
  const [failingStudents, setFailingStudents] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterStatus, setFilterStatus]     = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [examRes, statsRes, failingRes] = await Promise.all([
        examService.getAllExams({}),
        examService.getExamStats(),
        examService.getFailingStudents(),
      ]);
      setExamData(examRes.data || []);
      setStats(statsRes.data || null);
      setFailingStudents(failingRes.data || []);
    } catch {
      setError('Failed to load exam data.');
      setExamData([]);
      setFailingStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Anomaly detection: score > 25 pts above student average AND student avg < 65
  const anomalies = useMemo(() => {
    const byStudent = {};
    examData.forEach(r => {
      if (!r.studentId) return;
      if (!byStudent[r.studentId]) byStudent[r.studentId] = { records: [], sum: 0 };
      byStudent[r.studentId].records.push(r);
      byStudent[r.studentId].sum += r.percentage || 0;
    });
    const spikes = [];
    Object.values(byStudent).forEach(({ records, sum }) => {
      if (records.length < 2) return;
      const avg = sum / records.length;
      records.forEach(r => {
        if ((r.percentage || 0) > avg + 25 && avg < 65) {
          spikes.push({ ...r, studentAvg: avg });
        }
      });
    });
    return spikes;
  }, [examData]);

  const filtered = examData.filter(r => {
    const q = searchTerm.toLowerCase();
    const ms = r.studentId?.toLowerCase().includes(q) || r.student?.name?.toLowerCase().includes(q) || r.examName?.toLowerCase().includes(q) || r.subject?.toLowerCase().includes(q);
    const mf = !filterStatus || r.status === filterStatus;
    return ms && mf;
  });

  if (loading) return <Loading fullScreen />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Exam Performance</h1>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: C.gray }}>Monitor exam scores and detect performance anomalies</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCard icon={FileText}    title="Total Exams"   value={stats.totalExams || 0}                                  accent={C.blue}   />
          <StatCard icon={TrendingUp}  title="Average Score" value={`${stats.avgPercentage?.toFixed(1) ?? 0}%`}             accent={C.purple} />
          <StatCard icon={Award}       title="Pass Rate"     value={`${stats.passRate?.toFixed(1) ?? 0}%`} sub={`${stats.passCount || 0} passed`} accent={C.green} />
          <StatCard icon={TrendingDown} title="Failed Exams" value={stats.failCount || 0} sub="Require attention"           accent={C.red}    />
        </div>
      )}

      {/* Alerts */}
      {failingStudents.length > 0 && (
        <div style={{ background: '#fff7ed', borderRadius: 10, padding: '0.875rem 1.25rem', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} color={C.orange} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
            {failingStudents.length} student(s) have low average exam performance and require attention.
          </p>
        </div>
      )}

      {anomalies.length > 0 && (
        <div style={{ background: '#fef2f2', borderRadius: 10, padding: '0.875rem 1.25rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} color={C.red} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b', fontWeight: 600 }}>
            {anomalies.length} score spike(s) detected — possible anomaly (score &gt;25% above personal average). See table below.
          </p>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Search size={15} color={C.gray} />
          <input type="text" placeholder="Search by student, exam name or subject…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#111827' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb' }}>
          <Filter size={14} color={C.gray} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: '#374151' }}>
            <option value="">All Status</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </div>
      </div>

      {/* Exam Records Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Exam Records ({filtered.length})</p>
        </div>
        {filtered.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Student ID', 'Name', 'Exam', 'Subject', 'Marks', 'Percentage', 'Grade', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r._id || i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#374151', whiteSpace: 'nowrap' }}>{r.studentId}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{r.student?.name || '–'}</td>
                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{r.examName}</td>
                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{r.subject}</td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', color: '#374151' }}>{r.obtainedMarks}/{r.totalMarks}</td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 700, color: (r.percentage||0) >= 50 ? C.green : C.red }}>{(r.percentage||0).toFixed(1)}%</td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 700, color: gradeColor(r.grade) }}>{r.grade}</td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: r.status === 'Pass' ? '#dcfce7' : '#fee2e2', color: r.status === 'Pass' ? '#166534' : '#991b1b' }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: C.gray, fontSize: '0.875rem' }}>No exam records found.</div>
        )}
      </div>

      {/* Low Performance Students */}
      {failingStudents.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#991b1b' }}>Low Performance Students ({failingStudents.length})</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: C.gray }}>Students with multiple failed exams or very low average score</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Student ID', 'Name', 'Department', 'Avg Score', 'Failed Exams'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {failingStudents.map(s => (
                  <tr key={s.studentId} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#374151' }}>{s.studentId}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: '#111827' }}>{s.name}</td>
                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{s.department}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: C.red }}>{s.avgPercentage?.toFixed(1)}%</td>
                    <td style={{ padding: '0.7rem 1rem', color: C.orange, fontWeight: 700 }}>{s.failCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Score Spike Anomaly Detection */}
      {anomalies.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #fecaca', background: '#fef2f2' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#991b1b' }}>⚠ Score Spike Anomalies ({anomalies.length})</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: C.gray }}>Scores &gt;25% above student's personal average — possible malpractice</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Student ID', 'Name', 'Exam', 'Subject', 'Score', 'Personal Avg', 'Spike'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalies.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6', background: '#fffafa' }}>
                    <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#374151' }}>{r.studentId}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: '#111827' }}>{r.student?.name || '–'}</td>
                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{r.examName}</td>
                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{r.subject}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: C.green }}>{(r.percentage||0).toFixed(1)}%</td>
                    <td style={{ padding: '0.7rem 1rem', color: C.gray }}>{r.studentAvg.toFixed(1)}%</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: C.red }}>+{(r.percentage - r.studentAvg).toFixed(1)}%</td>
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

export default ExamPerformance;
