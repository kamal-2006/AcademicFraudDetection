import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, FileText, ShieldAlert,
  TrendingUp, CheckCircle, XCircle, Clock,
  RefreshCw, ChevronRight, Copy,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import api from '../api/axios';

// â”€â”€ Palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  purple: '#7c3aed',
  green:  '#10b981',
  orange: '#f59e0b',
  red:    '#ef4444',
  blue:   '#3b82f6',
  gray:   '#6b7280',
  red2:   '#dc2626',
};

// â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatCard = ({ icon: Icon, title, value, sub, accent = C.purple, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem',
      borderLeft: `4px solid ${accent}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: '1rem',
      cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s',
    }}
    onMouseEnter={(e) => onClick && (e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)')}
    onMouseLeave={(e) => onClick && (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
  >
    <div style={{
      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
      background: `${accent}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={22} color={accent} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </p>
      <p style={{ margin: '0.15rem 0 0', fontSize: '1.75rem', fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>
        {value ?? 'â€“'}
      </p>
      {sub && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: C.gray }}>{sub}</p>}
    </div>
  </div>
);

// â”€â”€ Chart card wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ChartCard = ({ title, subtitle, children }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{title}</p>
      {subtitle && <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: C.gray }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

// â”€â”€ Custom tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ margin: '0.15rem 0', fontSize: '0.8rem', color: p.color, fontWeight: 600 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// â”€â”€ Status badge helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const statusBadge = (status, terminated) => {
  if (terminated)         return { label: 'Terminated', bg: '#fee2e2', color: C.red2 };
  if (status === 'flagged') return { label: 'Flagged',  bg: '#fef9c3', color: '#92400e' };
  return { label: 'Submitted', bg: '#dcfce7', color: '#166534' };
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Main Dashboard Component
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [stats, setStats]           = useState(null);
  const [trends, setTrends]         = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // â”€â”€ Fetch both stats and trends in one shot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [statsRes, trendsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/trends?months=6'),
      ]);
      setStats(statsRes.data.data);
      setTrends(trendsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // â”€â”€ Derived values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const s    = stats || {};
  const perf = s.testPerformance || {};

  const testResultsData = [
    { name: 'Passed',  value: perf.passCount   || 0, color: C.green  },
    { name: 'Failed',  value: perf.failCount   || 0, color: C.red    },
    { name: 'Flagged', value: perf.flaggedCount || 0, color: C.orange },
  ];

  const fraudTypes = (s.fraudByType || []).map((ft) => ({
    name: (ft._id || 'Unknown'),
    count: ft.count,
  }));

  if (loading) return <Loading fullScreen />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: C.gray }}>
            Academic fraud detection &amp; exam monitoring overview
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8, background: '#f9f8fd', border: '1px solid #e0d9f7', fontSize: '0.8rem', fontWeight: 600, color: C.purple, cursor: 'pointer' }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshingâ€¦' : 'Refresh'}
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* â”€â”€ 4 KPI stat cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard icon={Users}        title="Total Students"   value={s.totalStudents ?? 0}    sub="Registered in system"                                                  accent={C.blue}   onClick={() => navigate('/students')} />
        <StatCard icon={FileText}     title="Tests Conducted"  value={s.totalTestsCompleted ?? 0} sub={`${s.flaggedSessions ?? 0} flagged Â· ${s.terminatedSessions ?? 0} terminated`} accent={C.purple} onClick={() => navigate('/proctoring-logs')} />
        <StatCard icon={AlertTriangle} title="Fraud Alerts"    value={s.totalFraudAlerts ?? 0}  sub={`${s.recentFraudReports ?? 0} in last 7 days`}                       accent={C.orange} onClick={() => navigate('/fraud-reports')} />
        <StatCard icon={ShieldAlert}  title="Malpractice Logs" value={s.malpracticeLogs ?? 0}   sub={`${s.activeInvestigations ?? 0} active investigations`}              accent={C.red}    onClick={() => navigate('/fraud-reports')} />
      </div>

      {/* â”€â”€ 5 mini metric tiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Avg Test Score',    value: `${perf.avgScore    ?? 0}%`, color: C.purple, icon: TrendingUp   },
          { label: 'Pass Rate',         value: `${perf.passRate    ?? 0}%`, color: C.green,  icon: CheckCircle  },
          { label: 'Flagged Sessions',  value: perf.flaggedCount   ?? 0,   color: C.orange, icon: AlertTriangle },
          { label: 'Terminated',        value: s.terminatedSessions ?? 0,  color: C.red,    icon: XCircle      },
          { label: 'Pending Review',    value: s.activeInvestigations ?? 0, color: C.blue,  icon: Clock        },
          { label: 'Assignments',       value: s.totalAssignments  ?? 0,   color: C.purple, icon: FileText     },
          { label: 'Plagiarism Cases',  value: s.plagiarismCasesCount ?? 0, color: C.red,   icon: Copy         },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color={color} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: '0.7rem', color: C.gray, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* â”€â”€ Charts row 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
        <ChartCard title="Fraud Events Over Time" subtitle="Monthly malpractice violations logged (last 6 months)">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trends} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                <Bar dataKey="fraudEvents" name="Fraud Events" fill={C.red} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ padding: '2rem 0', textAlign: 'center', color: C.gray, fontSize: '0.875rem' }}>No trend data available yet.</p>
          )}
        </ChartCard>

        <ChartCard title="Tests Conducted Over Time" subtitle="Monthly test completions and flagged sessions (last 6 months)">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trends} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                <Bar dataKey="testsTotal"   name="Total Tests" fill={C.blue}   radius={[5, 5, 0, 0]} />
                <Bar dataKey="testsFlagged" name="Flagged"     fill={C.orange} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ padding: '2rem 0', textAlign: 'center', color: C.gray, fontSize: '0.875rem' }}>No trend data available yet.</p>
          )}
        </ChartCard>
      </div>

      {/* â”€â”€ Charts row 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        <ChartCard title="Test Results Summary" subtitle="Breakdown of all completed test sessions">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={testResultsData} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} width={70} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Sessions" radius={[0, 5, 5, 0]}>
                {testResultsData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {testResultsData.map((d) => (
              <div key={d.name} style={{ flex: 1, minWidth: 80, textAlign: 'center', background: `${d.color}12`, borderRadius: 8, padding: '0.5rem 0.25rem' }}>
                <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: d.color }}>{d.value}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: C.gray, fontWeight: 600, textTransform: 'uppercase' }}>{d.name}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Fraud Alert Types" subtitle="Distribution of fraud report categories">
          {fraudTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fraudTypes} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#374151' }} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reports" fill={C.purple} radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ padding: '2rem 0', textAlign: 'center', color: C.gray, fontSize: '0.875rem' }}>No fraud reports recorded yet.</p>
          )}
        </ChartCard>
      </div>

      {/* â”€â”€ Recent Flagged Sessions table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(s.recentFlaggedSessions?.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Recent Flagged Test Sessions</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: C.gray }}>Latest sessions flagged or terminated due to malpractice</p>
            </div>
            <button onClick={() => navigate('/proctoring-logs')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600, color: C.purple, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafaf9' }}>
                  {['Student', 'Score', 'Fraud Score', 'Violations', 'Status', 'Submitted At'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.recentFlaggedSessions.map((session) => {
                  const badge = statusBadge(session.status, session.terminated);
                  const name  = session.userName || session.userEmail || 'Unknown';
                  return (
                    <tr key={session._id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#1f2937', fontWeight: 600 }}>{name}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: (session.percentageScore ?? 0) >= 50 ? C.green : C.red }}>
                          {session.percentageScore ?? 0}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: (session.fraudScore ?? 0) >= 70 ? C.red : (session.fraudScore ?? 0) >= 40 ? C.orange : C.gray }}>
                          {session.fraudScore ?? 0}<span style={{ fontWeight: 400, color: C.gray }}> / 100</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{session.fraudCount ?? 0}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: C.gray, whiteSpace: 'nowrap' }}>
                        {session.submittedAt
                          ? new Date(session.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'â€”'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Dashboard;
