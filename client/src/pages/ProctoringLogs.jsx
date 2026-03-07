import { useState, useEffect, useCallback } from 'react';
import {
  Shield, AlertTriangle, Users, Camera, Volume2, Maximize2,
  Eye, Wifi, RefreshCw, ChevronLeft, ChevronRight, XCircle,
  Activity, Filter,
} from 'lucide-react';
import api from '../api/axios';

// ── Event type metadata ──────────────────────────────────────────
const EVENT_META = {
  multiple_faces:  { label: 'Multiple Faces',  color: '#d97706', bg: '#fef3c7', icon: Users,     pts: 30 },
  no_face:         { label: 'No Face',          color: '#ea580c', bg: '#fff7ed', icon: Eye,       pts: 20 },
  fullscreen_exit: { label: 'Fullscreen Exit',  color: '#7c3aed', bg: '#f5f3ff', icon: Maximize2, pts: 25 },
  tab_switch:      { label: 'Tab Switch',       color: '#0284c7', bg: '#f0f9ff', icon: Wifi,      pts: 20 },
  noise_detected:  { label: 'Noise Detected',   color: '#0891b2', bg: '#ecfeff', icon: Volume2,   pts: 15 },
  camera_disabled: { label: 'Camera Disabled',  color: '#dc2626', bg: '#fee2e2', icon: Camera,    pts: 40 },
  session_start:   { label: 'Session Start',    color: '#16a34a', bg: '#f0fdf4', icon: Activity,  pts: 0  },
  session_end:     { label: 'Session End',      color: '#16a34a', bg: '#f0fdf4', icon: Activity,  pts: 0  },
  terminated:      { label: 'Terminated',       color: '#dc2626', bg: '#fee2e2', icon: XCircle,   pts: 0  },
};

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const FILTER_EVENTS = [
  { value: '', label: 'All Events' },
  { value: 'multiple_faces',  label: 'Multiple Faces' },
  { value: 'no_face',         label: 'No Face' },
  { value: 'fullscreen_exit', label: 'Fullscreen Exit' },
  { value: 'tab_switch',      label: 'Tab Switch' },
  { value: 'noise_detected',  label: 'Noise Detected' },
  { value: 'camera_disabled', label: 'Camera Disabled' },
  { value: 'terminated',      label: 'Terminated' },
];

// ── Main Component ───────────────────────────────────────────────
const ProctoringLogs = () => {
  const [logs, setLogs]         = useState([]);
  const [summary, setSummary]   = useState(null); // {total, terminated, flagged}
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);
  const [filterEvent, setFilterEvent] = useState('');
  const LIMIT = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterEvent) params.set('eventType', filterEvent);

      const [logsRes, sessionsRes] = await Promise.all([
        api.get(`/test/proctoring/logs?${params}`),
        api.get('/test/proctoring/sessions'),
      ]);

      setLogs(logsRes.data.data || []);
      setTotal(logsRes.data.pagination?.total ?? 0);
      setTotalPages(logsRes.data.pagination?.pages ?? 1);

      const sessions = sessionsRes.data.data || [];
      setSummary({
        flagged:    sessions.length,
        terminated: sessions.filter((s) => s.terminated).length,
        totalEvents: logsRes.data.pagination?.total ?? 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proctoring logs.');
    } finally {
      setLoading(false);
    }
  }, [page, filterEvent]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filterEvent]);

  /* ────────────────────────────────────── */
  const EventBadge = ({ type }) => {
    const meta = EVENT_META[type] || { label: type, color: '#9ca3af', bg: '#f9fafb', icon: AlertTriangle, pts: 0 };
    const Icon = meta.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
        color: meta.color, background: meta.bg,
      }}>
        <Icon size={11} /> {meta.label}
      </span>
    );
  };

  /* ────────────────────────────────────── */
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <Shield size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1a0836', letterSpacing: '-0.02em' }}>
              Proctoring Logs
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
              AI-proctored exam fraud events &amp; violations
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Events',     value: summary.totalEvents, color: '#7c3aed', icon: Activity },
            { label: 'Flagged Sessions', value: summary.flagged,     color: '#d97706', icon: AlertTriangle },
            { label: 'Terminated Exams', value: summary.terminated,  color: '#dc2626', icon: XCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{
              background: '#fff', borderRadius: 12, padding: '1rem 1.25rem',
              border: '1.5px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                <Icon size={16} color={color} />
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + refresh */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: '0.82rem' }}>
          <Filter size={13} /> Filter:
        </div>
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          style={{
            padding: '0.4rem 0.75rem', borderRadius: 8, border: '1.5px solid #e5e7eb',
            fontSize: '0.82rem', color: '#374151', background: '#fff', cursor: 'pointer',
          }}
        >
          {FILTER_EVENTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0.4rem 0.75rem', borderRadius: 8,
            border: '1.5px solid #e5e7eb', background: '#fff',
            fontSize: '0.82rem', color: '#374151', cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          Refresh
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#9ca3af' }}>
          {total} event{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Table card */}
      <div style={{
        background: '#fff', borderRadius: 14,
        border: '1.5px solid #f3f4f6', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: 12, color: '#7c3aed' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '3px solid #ede9fe', borderTopColor: '#7c3aed',
              animation: 'spin 0.8s linear infinite',
            }} />
            Loading proctoring logs…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <Shield size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No events found</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem' }}>No proctoring events match the current filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f8fd', borderBottom: '1.5px solid #ede9fe' }}>
                  {['Student', 'Event', 'Fraud Score', 'Points Added', 'Details', 'Time'].map((h) => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem', textAlign: 'left',
                      fontSize: '0.72rem', fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const isRed = log.fraudScoreAtTime >= 70;
                  return (
                    <tr
                      key={log._id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: log.eventType === 'terminated'
                          ? '#fff5f5'
                          : i % 2 === 0 ? '#fff' : '#faf9fe',
                      }}
                    >
                      {/* Student */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0836' }}>
                          {log.userId?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                          {log.userId?.studentId || log.userId?.email || ''}
                        </div>
                      </td>

                      {/* Event */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <EventBadge type={log.eventType} />
                      </td>

                      {/* Running fraud score */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          fontSize: '0.9rem', fontWeight: 800,
                          color: isRed ? '#dc2626' : '#374151',
                        }}>
                          {log.fraudScoreAtTime ?? 0}
                        </span>
                        {log.fraudScoreAtTime >= 100 && (
                          <span style={{
                            marginLeft: 6, fontSize: '0.68rem', fontWeight: 700,
                            color: '#dc2626', background: '#fee2e2',
                            padding: '1px 6px', borderRadius: 999,
                          }}>LIMIT</span>
                        )}
                      </td>

                      {/* Points */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {log.pointsAdded > 0 ? (
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>
                            +{log.pointsAdded}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>—</span>
                        )}
                      </td>

                      {/* Details */}
                      <td style={{ padding: '0.75rem 1rem', maxWidth: 200 }}>
                        <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.details || '—'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                          {fmt(log.timestamp)}
                        </span>
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
                fontSize: '0.82rem', color: '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
              Page {page} of {totalPages} · {total} total
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem',
                borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff',
                fontSize: '0.82rem', color: '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ProctoringLogs;
