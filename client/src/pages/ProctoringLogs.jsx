import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, AlertTriangle, Users, Camera, Volume2, Maximize2,
  Eye, Wifi, RefreshCw, ChevronLeft, ChevronRight, XCircle,
  Activity, Filter, LogIn, Search, X,
} from 'lucide-react';
import api from '../api/axios';

// ── Event type metadata ─────────────────────────────────────────────
const EVENT_META = {
  multiple_faces:   { label: 'Multiple Faces',   color: '#d97706', bg: '#fef3c7', icon: Users,      pts: 30  },
  no_face:          { label: 'No Face',           color: '#ea580c', bg: '#fff7ed', icon: Eye,         pts: 20  },
  fullscreen_exit:  { label: 'Fullscreen Exit',   color: '#7c3aed', bg: '#f5f3ff', icon: Maximize2,   pts: 25  },
  tab_switch:       { label: 'Tab Switch',        color: '#0284c7', bg: '#f0f9ff', icon: Wifi,        pts: 20  },
  noise_detected:   { label: 'Noise Detected',    color: '#0891b2', bg: '#ecfeff', icon: Volume2,     pts: 15  },
  camera_disabled:  { label: 'Camera Disabled',   color: '#dc2626', bg: '#fee2e2', icon: Camera,      pts: 40  },
  session_start:    { label: 'Session Start',     color: '#16a34a', bg: '#f0fdf4', icon: Activity,    pts: 0   },
  session_end:      { label: 'Session End',       color: '#16a34a', bg: '#f0fdf4', icon: Activity,    pts: 0   },
  terminated:       { label: 'Terminated',        color: '#dc2626', bg: '#fee2e2', icon: XCircle,     pts: 0   },
  concurrent_login: { label: 'Concurrent Login',  color: '#ea580c', bg: '#fff7ed', icon: LogIn,       pts: 100 },
};

const FILTER_EVENTS = [
  { value: '',                label: 'All Events'       },
  { value: 'multiple_faces',  label: 'Multiple Faces'   },
  { value: 'no_face',         label: 'No Face'          },
  { value: 'fullscreen_exit', label: 'Fullscreen Exit'  },
  { value: 'tab_switch',      label: 'Tab Switch'       },
  { value: 'noise_detected',  label: 'Noise Detected'   },
  { value: 'camera_disabled', label: 'Camera Disabled'  },
  { value: 'terminated',      label: 'Terminated'       },
  { value: 'concurrent_login',label: 'Concurrent Login' },
];

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── EventBadge ──────────────────────────────────────────────────────
const EventBadge = ({ type }) => {
  const meta = EVENT_META[type] || { label: type, color: '#9ca3af', bg: '#f9fafb', icon: AlertTriangle };
  const Icon = meta.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.73rem', fontWeight: 700,
      color: meta.color, background: meta.bg, whiteSpace: 'nowrap',
      border: `1px solid ${meta.color}22`,
    }}>
      <Icon size={11} /> {meta.label}
    </span>
  );
};

// ── FraudBar ────────────────────────────────────────────────────────
const FraudBar = ({ score }) => {
  const pct   = Math.min(100, score || 0);
  const color = pct >= 100 ? '#dc2626' : pct >= 70 ? '#d97706' : pct >= 40 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 800, color, minWidth: 30, textAlign: 'right' }}>
        {pct}
      </span>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────
const ProctoringLogs = () => {
  const [logs, setLogs]               = useState([]);
  const [summary, setSummary]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [filterEvent, setFilterEvent] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef(null);
  const LIMIT = 25;

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterEvent)  params.set('eventType', filterEvent);
      if (searchQuery)  params.set('search', searchQuery);

      const [logsRes, sessionsRes] = await Promise.all([
        api.get(`/test/proctoring/logs?${params}`),
        api.get('/test/proctoring/sessions'),
      ]);

      setLogs(logsRes.data.data || []);
      setTotal(logsRes.data.pagination?.total ?? 0);
      setTotalPages(logsRes.data.pagination?.pages ?? 1);

      const sessions = sessionsRes.data.data || [];
      setSummary({
        flagged:     sessions.length,
        terminated:  sessions.filter((s) => s.terminated).length,
        totalEvents: logsRes.data.pagination?.total ?? 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proctoring logs.');
    } finally {
      setLoading(false);
    }
  }, [page, filterEvent, searchQuery]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [filterEvent]);

  const clearSearch = () => { setSearchInput(''); setSearchQuery(''); };

  /* ─────────────────────────────────────── */
  return (
    <div>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}>
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Proctoring Logs
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>
              AI-proctored exam fraud events &amp; violations
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.45rem 1rem', borderRadius: 9,
            border: '1.5px solid #e5e7eb', background: '#fff',
            fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Summary ── */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Events',     value: summary.totalEvents, color: '#7c3aed', bg: '#f5f3ff', icon: Activity      },
            { label: 'Flagged Sessions', value: summary.flagged,     color: '#d97706', bg: '#fffbeb', icon: AlertTriangle  },
            { label: 'Terminated Exams', value: summary.terminated,  color: '#dc2626', bg: '#fef2f2', icon: XCircle        },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} style={{
              background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem',
              border: '1.5px solid #f1f5f9',
              boxShadow: '0 2px 8px rgba(79,42,170,0.05), 0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.625rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + Filter toolbar ── */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '0.875rem 1rem',
        border: '1.5px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        marginBottom: '1rem',
      }}>
        {/* Student search */}
        <div style={{
          flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8,
          background: '#f8fafc', borderRadius: 9, padding: '0.45rem 0.75rem',
          border: `1.5px solid ${searchQuery ? '#7c3aed' : '#e5e7eb'}`,
          transition: 'border-color 0.15s',
        }}>
          <Search size={14} color={searchQuery ? '#7c3aed' : '#9ca3af'} />
          <input
            type="text"
            placeholder="Search by student name, ID or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              border: 'none', background: 'none', outline: 'none',
              fontSize: '0.84rem', width: '100%', color: '#0f172a',
            }}
          />
          {searchInput && (
            <button onClick={clearSearch} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Event type filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f8fafc', borderRadius: 9, padding: '0.45rem 0.75rem', border: '1.5px solid #e5e7eb' }}>
          <Filter size={13} color="#9ca3af" />
          <select
            value={filterEvent}
            onChange={(e) => { setFilterEvent(e.target.value); setPage(1); }}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.84rem', color: '#374151', cursor: 'pointer' }}
          >
            {FILTER_EVENTS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {total} event{total !== 1 ? 's' : ''}
          {searchQuery && <span style={{ color: '#7c3aed' }}> · "{searchQuery}"</span>}
        </span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem',
          padding: '0.75rem 1rem', borderRadius: 10,
          background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem',
        }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── Table card ── */}
      <div style={{
        background: '#fff', borderRadius: 14,
        border: '1.5px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(79,42,170,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3.5rem', gap: 12, color: '#7c3aed', fontSize: '0.875rem' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              border: '3px solid #ede9fe', borderTopColor: '#7c3aed',
              animation: 'spin 0.8s linear infinite',
            }} />
            Loading proctoring logs…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#9ca3af' }}>
            <Shield size={44} style={{ marginBottom: '0.875rem', opacity: 0.25 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#374151' }}>
              {searchQuery ? `No results for "${searchQuery}"` : 'No events found'}
            </p>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem' }}>
              {searchQuery ? 'Try a different name or ID.' : 'No proctoring events match the current filter.'}
            </p>
            {searchQuery && (
              <button onClick={clearSearch} style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: 8, border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f8fd', borderBottom: '2px solid #ede9fe' }}>
                  {['Student', 'Event', 'Fraud Score', 'Details', 'Time'].map((h) => (
                    <th key={h} style={{
                      padding: '0.75rem 1.1rem', textAlign: 'left',
                      fontSize: '0.7rem', fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log._id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: log.eventType === 'terminated'
                        ? '#fff8f8'
                        : log.eventType === 'concurrent_login'
                          ? '#fff9f0'
                          : i % 2 === 0 ? '#fff' : '#faf9fe',
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Student */}
                    <td style={{ padding: '0.85rem 1.1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                        {log.userId?.name || 'Unknown'}
                      </div>
                      {(log.userId?.studentId || log.userId?.email) && (
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>
                          {log.userId?.studentId
                            ? <span style={{ fontFamily: 'monospace', color: '#7c3aed', fontWeight: 600 }}>{log.userId.studentId}</span>
                            : log.userId.email}
                        </div>
                      )}
                    </td>

                    {/* Event */}
                    <td style={{ padding: '0.85rem 1.1rem' }}>
                      <EventBadge type={log.eventType} />
                      {log.pointsAdded > 0 && (
                        <span style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 5px', borderRadius: 999 }}>
                          +{log.pointsAdded} pts
                        </span>
                      )}
                    </td>

                    {/* Fraud score bar */}
                    <td style={{ padding: '0.85rem 1.1rem', minWidth: 130 }}>
                      <FraudBar score={log.fraudScoreAtTime} />
                    </td>

                    {/* Details */}
                    <td style={{ padding: '0.85rem 1.1rem', maxWidth: 220 }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details || '—'}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '0.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.77rem', color: '#9ca3af' }}>{fmt(log.timestamp)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1.25rem', borderTop: '1px solid #f3f4f6', background: '#fafaf9',
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem',
                borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff',
                fontSize: '0.82rem', fontWeight: 600, color: '#374151',
                cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.45 : 1,
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, k) => {
                const p = k + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1.5px solid ${p === page ? '#7c3aed' : '#e5e7eb'}`,
                      background: p === page ? '#7c3aed' : '#fff',
                      color: p === page ? '#fff' : '#374151',
                      fontSize: '0.82rem', fontWeight: p === page ? 700 : 500, cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 7 && <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>…{totalPages}</span>}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem',
                borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff',
                fontSize: '0.82rem', fontWeight: 600, color: '#374151',
                cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.45 : 1,
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctoringLogs;
