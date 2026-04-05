import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, ClipboardList, CheckCircle,
  AlertTriangle, Clock, TrendingUp, Award, PlayCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const greetingFor = (hour) =>
  hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

const ScoreBadge = ({ pct, flagged }) => {
  if (flagged) return <span className="stu-badge stu-badge-red">Flagged</span>;
  if (pct >= 80) return <span className="stu-badge stu-badge-green">{pct}%</span>;
  if (pct >= 50) return <span className="stu-badge stu-badge-yellow">{pct}%</span>;
  return <span className="stu-badge stu-badge-red">{pct}%</span>;
};

const StudentHome = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [assignmentSummary, setAssignmentSummary] = useState({ total: 0, pending: 0, submitted: 0 });

  useEffect(() => {
    api.get('/test/my-results')
      .then((r) => setResults(r.data.data || []))
      .catch(() => setError('Could not load test history.'))
      .finally(() => setLoading(false));

    api.get('/assignments/assigned')
      .then((r) => {
        const list = r.data.data || [];
        const submitted = list.filter((a) => a.submitted).length;
        setAssignmentSummary({
          total: list.length,
          submitted,
          pending: list.length - submitted,
        });
      })
      .catch(() => {
        setAssignmentSummary({ total: 0, pending: 0, submitted: 0 });
      });
  }, []);

  const totalTests   = results.length;
  const avgScore     = totalTests
    ? Math.round(results.reduce((s, r) => s + (r.percentageScore || 0), 0) / totalTests)
    : null;
  const bestScore    = totalTests ? Math.max(...results.map((r) => r.percentageScore || 0)) : null;
  const flaggedCount = results.filter((r) => r.status === 'flagged').length;

  const greeting = greetingFor(new Date().getHours());

  return (
    <>
      {/* Welcome Banner */}
      <div className="stu-welcome">
        <div>
          <h1 className="stu-welcome-title">
            {greeting}, {user?.name?.split(' ')[0] ?? 'Student'}
          </h1>
          <p className="stu-welcome-sub">
            Here&apos;s your academic overview. Ready to take a test?
          </p>
          {user?.studentId && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Student ID: <strong>{user.studentId}</strong>
            </p>
          )}
        </div>
        <div className="stu-welcome-icon">
          <GraduationCap size={28} />
        </div>
      </div>

      {/* Warning if student ID not linked */}
      {!user?.studentId && (
        <div className="stu-alert stu-alert-warn">
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Your Student ID is not linked. Contact your institution&apos;s admin to
            associate your account with academic records.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="stu-stats-grid">
        <div className="stu-stat">
          <div className="stu-stat-icon">
            <ClipboardList size={18} color="#334155" />
          </div>
          <div className="stu-stat-value">{totalTests}</div>
          <div className="stu-stat-label">Tests Taken</div>
        </div>

        <div className="stu-stat">
          <div className="stu-stat-icon">
            <TrendingUp size={18} color="#334155" />
          </div>
          <div className="stu-stat-value">{avgScore !== null ? `${avgScore}%` : '—'}</div>
          <div className="stu-stat-label">Average Score</div>
        </div>

        <div className="stu-stat">
          <div className="stu-stat-icon">
            <Award size={18} color="#334155" />
          </div>
          <div className="stu-stat-value">{bestScore !== null ? `${bestScore}%` : '—'}</div>
          <div className="stu-stat-label">Best Score</div>
        </div>

        <div className="stu-stat">
          <div className="stu-stat-icon">
            <AlertTriangle size={18} color="#334155" />
          </div>
          <div className="stu-stat-value">
            {flaggedCount}
          </div>
          <div className="stu-stat-label">Flagged Sessions</div>
        </div>

        <div className="stu-stat">
          <div className="stu-stat-icon">
            <ClipboardList size={18} color="#334155" />
          </div>
          <div className="stu-stat-value">
            {assignmentSummary.pending}
          </div>
          <div className="stu-stat-label">Pending Assignments</div>
        </div>
      </div>

      {/* Alerts */}
      {flaggedCount > 0 && (
        <div className="stu-alert stu-alert-warn" style={{ marginBottom: '1.75rem' }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>{flaggedCount} session{flaggedCount > 1 ? 's' : ''}</strong> flagged for suspicious
            activity. Your faculty has been notified. Ensure compliance with exam policies.
          </span>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button className="stu-btn-primary" onClick={() => navigate('/student-dashboard/test')}>
          <PlayCircle size={16} />
          Start New Test
        </button>
        <button className="stu-btn-primary" onClick={() => navigate('/student-dashboard/assignments')}>
          <ClipboardList size={16} />
          View Assignments ({assignmentSummary.total})
        </button>
      </div>

      {/* Test History */}
      <div className="stu-card">
        <h3 className="stu-card-title">
          <Clock size={15} color="#475569" />
          Test History
        </h3>

        {loading && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            Loading test history…
          </div>
        )}

        {error && !loading && (
          <div className="stu-alert stu-alert-warn">{error}</div>
        )}

        {!loading && !error && results.length === 0 && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem',
          }}>
            <ClipboardList size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <p style={{ margin: 0 }}>No tests taken yet.</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
              Click <strong>Start New Test</strong> to begin.
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="stu-table-wrap">
            <table className="stu-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Questions</th>
                  <th>Score</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r._id}>
                    <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                    <td>
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>{r.totalMarks ?? '—'}</td>
                    <td>
                      <ScoreBadge pct={r.percentageScore} flagged={r.status === 'flagged'} />
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {r.duration ? `${Math.round(r.duration / 60)} min` : '—'}
                    </td>
                    <td>
                      {r.status === 'submitted' ? (
                        <span className="stu-badge stu-badge-green">
                          <CheckCircle size={10} /> Submitted
                        </span>
                      ) : (
                        <span className="stu-badge stu-badge-red">
                          <AlertTriangle size={10} /> Flagged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentHome;
