import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, FileText, ShieldAlert,
  RefreshCw, ChevronRight, Shield,
} from 'lucide-react';
import {
  Bar, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import api from '../api/axios';

// ── Palette ───────────────────────────────────────────────────────────
const C = {
  purple: '#7c3aed', green: '#10b981', orange: '#f59e0b',
  red: '#ef4444', blue: '#3b82f6', gray: '#6b7280',
  teal: '#0d9488',
};

// ── Reusable components ───────────────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, sub, accent = C.purple, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff', borderRadius: 16, padding: '1.5rem',
      borderLeft: `4px solid ${accent}`,
      boxShadow: '0 2px 8px rgba(79,42,170,0.05), 0 1px 2px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: '1rem',
      cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={(e) => onClick && Object.assign(e.currentTarget.style, { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(79,42,170,0.1)' })}
    onMouseLeave={(e) => onClick && Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(79,42,170,0.05)' })}
  >
    <div style={{ width: 50, height: 50, borderRadius: 13, flexShrink: 0, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={24} color={accent} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
      <p style={{ margin: '0.1rem 0 0', fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.04em' }}>{value ?? '—'}</p>
      {sub && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: C.gray }}>{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 8px rgba(79,42,170,0.05), 0 1px 2px rgba(0,0,0,0.04)', border: '1.5px solid #f1f5f9' }}>
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</p>
      {subtitle && <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: C.gray }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.625rem 0.875rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ margin: '0.15rem 0', fontSize: '0.8rem', color: p.color, fontWeight: 600 }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.dataKey === 'avgScore' ? `${p.value}%` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const EmptyChart = ({ text = 'No data available yet.' }) => (
  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray, fontSize: '0.875rem', background: '#fafaf9', borderRadius: 10 }}>{text}</div>
);

const sessionBadge = (status, terminated) => {
  if (terminated)           return { label: 'Terminated', bg: '#fee2e2', color: '#dc2626' };
  if (status === 'flagged') return { label: 'Flagged',    bg: '#fef9c3', color: '#92400e' };
  return { label: 'Submitted', bg: '#dcfce7', color: '#166534' };
};

// ═══════════════════════════════════════════════════════════════════════
//  Dashboard
// ═══════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const navigate                    = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [stats, setStats]           = useState(null);
  const [trends, setTrends]         = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
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

  const s    = stats || {};
  const perf = s.testPerformance || {};

  if (loading) return <Loading fullScreen />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: C.gray }}>
            Academic fraud detection &amp; exam monitoring overview
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 9, background: '#f5f3ff', border: '1.5px solid #ddd6fe', fontSize: '0.8rem', fontWeight: 700, color: C.purple, cursor: 'pointer' }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── Primary KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <StatCard
          icon={Users} title="Registered Students" accent={C.blue}
          value={s.totalStudents ?? 0}
          sub="Accounts registered on platform"
          onClick={() => navigate('/students')}
        />
        <StatCard
          icon={FileText} title="Quizzes Completed" accent={C.purple}
          value={s.totalTestsCompleted ?? 0}
          sub={`${s.flaggedSessions ?? 0} flagged · ${s.terminatedSessions ?? 0} terminated`}
          onClick={() => navigate('/proctoring-logs')}
        />
        <StatCard
          icon={Shield} title="Total Fraud Cases" accent={C.red}
          value={s.totalFraudCases ?? (s.totalFraudAlerts ?? 0)}
          sub={`${s.flaggedSessions ?? 0} quiz · ${(s.marksheetFake ?? 0) + (s.marksheetSuspicious ?? 0)} marksheet`}
          onClick={() => navigate('/fraud-reports')}
        />
        <StatCard
          icon={ShieldAlert} title="Proctoring Violations" accent={C.red}
          value={s.malpracticeLogs ?? 0}
          sub={`${s.activeInvestigations ?? 0} active investigations`}
          onClick={() => navigate('/proctoring-logs')}
        />
      </div>

      {/* ── Compact summary row ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f1f5f9', boxShadow: '0 2px 8px rgba(79,42,170,0.05)', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.72rem', color: C.gray, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Avg Quiz Score</span>
            <span style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>{perf.avgScore ?? 0}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.72rem', color: C.gray, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Pass Rate</span>
            <span style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>{perf.passRate ?? 0}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.72rem', color: C.gray, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Suspicious Submissions</span>
            <span style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>{s.plagiarismCasesCount ?? 0}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.72rem', color: C.gray, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>High-Risk Students</span>
            <span style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>{s.highRiskPlagiarismStudents ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ── Primary trend chart ── */}
      <ChartCard title="Core Activity Trend (Last 6 Months)" subtitle="Total tests, flagged tests, and proctoring violations">
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={trends} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar yAxisId="left" dataKey="testsTotal" name="Tests" fill={C.blue} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="testsFlagged" name="Flagged" fill={C.orange} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" dataKey="fraudEvents" name="Violations" stroke={C.red} strokeWidth={2.5} dot={{ r: 3, fill: C.red }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <EmptyChart text="No trend data available yet." />}
      </ChartCard>

      {/* ── Recent Flagged Sessions ── */}
      {(s.recentFlaggedSessions?.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 8px rgba(79,42,170,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Recent Flagged Quiz Sessions</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: C.gray }}>Latest sessions flagged or terminated due to suspicious activity</p>
            </div>
            <button onClick={() => navigate('/proctoring-logs')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 700, color: C.purple, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f9f8fd' }}>
                  {['Student', 'Quiz Score', 'Fraud Score', 'Violations', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1.1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '2px solid #ede9fe' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.recentFlaggedSessions.map((session, i) => {
                  const badge = sessionBadge(session.status, session.terminated);
                  const name  = session.userName || session.userEmail || session.userId?.name || 'Unknown';
                  return (
                    <tr key={session._id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#faf9fe' }}>
                      <td style={{ padding: '0.875rem 1.1rem', fontWeight: 700, color: '#0f172a' }}>
                        {name}
                        {session.userId?.studentId && (
                          <div style={{ fontSize: '0.7rem', color: C.purple, fontFamily: 'monospace', fontWeight: 600 }}>{session.userId.studentId}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <span style={{ fontWeight: 800, color: (session.percentageScore ?? 0) >= 50 ? C.green : C.red }}>
                          {session.percentageScore ?? 0}%
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <span style={{ fontWeight: 800, color: (session.fraudScore ?? 0) >= 70 ? C.red : (session.fraudScore ?? 0) >= 40 ? C.orange : C.gray }}>
                          {session.fraudScore ?? 0}<span style={{ fontWeight: 400, color: C.gray }}>/100</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem', color: '#6b7280', fontWeight: 600 }}>{session.fraudCount ?? 0}</td>
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <span style={{ padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem', color: '#9ca3af', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {session.submittedAt ? new Date(session.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
