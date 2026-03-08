import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, TrendingUp, Award, AlertTriangle, Search,
  Filter, X, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  BarChart2, Zap, RefreshCw, Clock,
} from 'lucide-react';
import { testService } from '../api/testService';
import { examService } from '../api/services';

// ── Helpers ──────────────────────────────────────────────────────────
const C = {
  purple: '#7c3aed', green: '#10b981', yellow: '#f59e0b', red: '#ef4444',
  blue: '#3b82f6', gray: '#6b7280',
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDur = (secs) => {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const gradeColor = (g) => {
  if (!g) return C.gray;
  if (['A+', 'A', 'A-'].includes(g)) return C.green;
  if (['B+', 'B', 'B-'].includes(g)) return C.blue;
  if (['C+', 'C', 'C-'].includes(g)) return C.yellow;
  return C.red;
};

// ── Sub-components ────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div style={{
    background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem',
    boxShadow: '0 2px 8px rgba(79,42,170,0.05), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1.5px solid #f1f5f9',
    display: 'flex', alignItems: 'center', gap: '1rem',
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '0.1rem 0 0', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.04em' }}>{value ?? '—'}</p>
      {sub && <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: C.gray }}>{sub}</p>}
    </div>
  </div>
);

const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '0.55rem 1.25rem', borderRadius: 9, fontSize: '0.875rem', fontWeight: 700,
      border: active ? '1.5px solid #7c3aed' : '1.5px solid #e5e7eb',
      background: active ? '#7c3aed' : '#fff', color: active ? '#fff' : '#374151',
      cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7,
    }}
  >
    {children}
  </button>
);

const StatusPill = ({ ok, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
    background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b',
    border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
  }}>
    {ok ? <CheckCircle size={10} /> : <XCircle size={10} />} {label}
  </span>
);

// ──────────────────────────────────────────────────────────────────────
// Tab 1 — Quiz Results (TestSession)
// ──────────────────────────────────────────────────────────────────────
const QuizResultsTab = () => {
  const [results, setResults]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const debRef = useRef(null);
  const LIMIT = 20;

  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setSearchQuery(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(debRef.current);
  }, [searchInput]);

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: LIMIT };
      if (searchQuery)  params.search = searchQuery;
      if (filterStatus) params.status = filterStatus;
      const res = await testService.getAllResults(params);
      setResults(res.data || []);
      setStats(res.stats || null);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch {
      setError('Failed to load quiz results.');
    } finally { setLoading(false); }
  }, [page, searchQuery, filterStatus]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [filterStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCard icon={ClipboardList} label="Total Quizzes"  value={stats.total}       color={C.blue}   />
          <StatCard icon={TrendingUp}    label="Average Score"  value={`${stats.avgScore}%`} color={C.purple} />
          <StatCard icon={Award}         label="Pass Count"     value={stats.passCount}   sub={`≥50% to pass`} color={C.green} />
          <StatCard icon={AlertTriangle} label="Flagged"        value={stats.flaggedCount} sub="Fraud detected" color={C.red}   />
        </div>
      )}

      {/* Search + filter */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '0.875rem 1rem',
        border: '1.5px solid #f1f5f9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
      }}>
        <div style={{
          flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8,
          background: '#f8fafc', borderRadius: 9, padding: '0.45rem 0.75rem',
          border: `1.5px solid ${searchQuery ? C.purple : '#e5e7eb'}`,
        }}>
          <Search size={14} color={searchQuery ? C.purple : '#9ca3af'} />
          <input
            type="text"
            placeholder="Search by student name, ID or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.84rem', width: '100%', color: '#0f172a' }}
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearchQuery(''); }}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f8fafc', borderRadius: 9, padding: '0.45rem 0.75rem', border: '1.5px solid #e5e7eb' }}>
          <Filter size={13} color="#9ca3af" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.84rem', color: '#374151', cursor: 'pointer' }}>
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
        <button onClick={fetch} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.875rem',
          borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff',
          fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: 'pointer',
        }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
          {total} record{total !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', color: C.red, fontSize: '0.85rem', display: 'flex', gap: 8 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1.5px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(79,42,170,0.05)',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3.5rem', gap: 12, color: C.purple, fontSize: '0.875rem' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite' }} />
            Loading quiz results…
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <ClipboardList size={44} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#374151' }}>No quiz results found</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem' }}>Students haven't completed any quizzes yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f8fd', borderBottom: '2px solid #ede9fe' }}>
                  {['Student', 'Score', 'Duration', 'Fraud Score', 'Date', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1.1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const pct     = r.percentageScore ?? 0;
                  const passing = pct >= 50;
                  const flagged = r.status === 'flagged';
                  return (
                    <tr key={r._id || i} style={{ borderBottom: '1px solid #f3f4f6', background: flagged ? '#fff8f8' : i % 2 === 0 ? '#fff' : '#faf9fe' }}>
                      {/* Student */}
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                          {r.userId?.name || r.userName || 'Unknown'}
                        </div>
                        {(r.userId?.studentId || r.userId?.email) && (
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>
                            {r.userId.studentId
                              ? <span style={{ fontFamily: 'monospace', color: C.purple, fontWeight: 600 }}>{r.userId.studentId}</span>
                              : r.userId.email}
                          </div>
                        )}
                      </td>
                      {/* Score */}
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem', color: passing ? C.green : C.red, lineHeight: 1 }}>
                          {pct}%
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>
                          {r.score ?? 0}/{r.totalMarks ?? 0} correct
                        </div>
                      </td>
                      {/* Duration */}
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#64748b' }}>
                          <Clock size={12} color="#9ca3af" /> {fmtDur(r.duration)}
                        </div>
                      </td>
                      {/* Fraud score */}
                      <td style={{ padding: '0.875rem 1.1rem', minWidth: 110 }}>
                        {r.fraudCount > 0 ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 5, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, r.fraudScore || 0)}%`, background: (r.fraudScore || 0) >= 70 ? C.red : C.yellow, borderRadius: 999 }} />
                              </div>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: (r.fraudScore || 0) >= 70 ? C.red : C.yellow }}>
                                {r.fraudScore || 0}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{r.fraudCount} event{r.fraudCount !== 1 ? 's' : ''}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>Clean</span>
                        )}
                      </td>
                      {/* Date */}
                      <td style={{ padding: '0.875rem 1.1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{fmtDate(r.submittedAt)}</span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <StatusPill ok={!flagged} label={flagged ? 'Flagged' : 'Submitted'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderTop: '1px solid #f3f4f6', background: '#fafaf9' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.45 : 1 }}>
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.45 : 1 }}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Tab 2 — Traditional Exams (ExamPerformance model)
// ──────────────────────────────────────────────────────────────────────
const TraditionalExamsTab = () => {
  const [examData, setExamData]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [examRes, statsRes] = await Promise.all([
          examService.getAllExams({}),
          examService.getExamStats(),
        ]);
        setExamData(examRes.data || []);
        setStats(statsRes.data || null);
      } catch {
        setError('Failed to load exam records.');
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = examData.filter((r) => {
    const q = searchTerm.toLowerCase();
    const ms = !q
      || r.studentId?.toLowerCase().includes(q)
      || r.student?.name?.toLowerCase().includes(q)
      || r.examName?.toLowerCase().includes(q)
      || r.subject?.toLowerCase().includes(q);
    return ms && (!filterStatus || r.status === filterStatus);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCard icon={ClipboardList} label="Total Exams"    value={stats.totalExams ?? 0}                    color={C.blue}   />
          <StatCard icon={TrendingUp}    label="Average Score"  value={`${stats.avgPercentage?.toFixed(1) ?? 0}%`} color={C.purple} />
          <StatCard icon={Award}         label="Pass Rate"      value={`${stats.passRate?.toFixed(1) ?? 0}%`}      sub={`${stats.passCount || 0} passed`} color={C.green} />
          <StatCard icon={AlertTriangle} label="Failed"         value={stats.failCount ?? 0}                     color={C.red}    />
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', color: C.red, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '0.875rem 1rem', border: '1.5px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 9, padding: '0.45rem 0.75rem', border: '1.5px solid #e5e7eb' }}>
          <Search size={14} color="#9ca3af" />
          <input type="text" placeholder="Search by student, exam or subject…" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.84rem', width: '100%', color: '#0f172a' }} />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#9ca3af', display: 'flex' }}><X size={13} /></button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f8fafc', borderRadius: 9, padding: '0.45rem 0.75rem', border: '1.5px solid #e5e7eb' }}>
          <Filter size={13} color="#9ca3af" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.84rem', color: '#374151', cursor: 'pointer' }}>
            <option value="">All Status</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: C.purple, fontSize: '0.875rem' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite' }} />
          Loading exam records…
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 8px rgba(79,42,170,0.05)' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <ClipboardList size={44} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#374151' }}>No exam records found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f8fd', borderBottom: '2px solid #ede9fe' }}>
                    {['Student', 'Exam', 'Subject', 'Marks', 'Score', 'Grade', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '0.75rem 1.1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r._id || i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#faf9fe' }}>
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{r.student?.name || '—'}</div>
                        <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: C.purple, fontWeight: 600 }}>{r.studentId}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.84rem', color: '#374151' }}>{r.examName}</td>
                      <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.84rem', color: '#374151' }}>{r.subject}</td>
                      <td style={{ padding: '0.875rem 1.1rem', fontSize: '0.84rem', color: '#374151', textAlign: 'center' }}>{r.obtainedMarks}/{r.totalMarks}</td>
                      <td style={{ padding: '0.875rem 1.1rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: (r.percentage || 0) >= 50 ? C.green : C.red }}>{(r.percentage || 0).toFixed(1)}%</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, color: gradeColor(r.grade) }}>{r.grade || '—'}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.1rem' }}>
                        <StatusPill ok={r.status === 'Pass'} label={r.status || '—'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Root Component ────────────────────────────────────────────────────
const ExamPerformance = () => {
  const [tab, setTab] = useState('quiz');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}>
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Exam Performance</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>Monitor academic scores and detect performance anomalies</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <TabBtn active={tab === 'quiz'} onClick={() => setTab('quiz')}>
            <Zap size={14} /> Quiz Results
          </TabBtn>
          <TabBtn active={tab === 'exams'} onClick={() => setTab('exams')}>
            <ClipboardList size={14} /> Traditional Exams
          </TabBtn>
        </div>
      </div>

      {/* Active tab */}
      {tab === 'quiz'  && <QuizResultsTab />}
      {tab === 'exams' && <TraditionalExamsTab />}
    </div>
  );
};

export default ExamPerformance;
