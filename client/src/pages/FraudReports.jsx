import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle, Shield, FileText, Clock,
  XCircle, Search, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import api from '../api/axios';

/* -- helpers -------------------------------------------------------- */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '--';

const SEV = {
  critical: { bg: '#fee2e2', color: '#991b1b', label: 'Critical' },
  high:     { bg: '#fff7ed', color: '#9a3412', label: 'High'     },
  medium:   { bg: '#fef9c3', color: '#92400e', label: 'Medium'   },
  low:      { bg: '#f0fdf4', color: '#166534', label: 'Low'      },
};

const TYPE_CONF = {
  'Quiz Violation':       { bg: '#fdf4ff', color: '#7c3aed', Icon: Shield        },
  'Fake Certificate':       { bg: '#fee2e2', color: '#991b1b', Icon: XCircle       },
  'Suspicious Certificate': { bg: '#fff7ed', color: '#9a3412', Icon: AlertTriangle  },
  'Plagiarism':           { bg: '#fef9c3', color: '#92400e', Icon: FileText      },
  'default':              { bg: '#f8f7ff', color: '#374151', Icon: AlertTriangle  },
};
const typeConf = (t) => TYPE_CONF[t] || TYPE_CONF.default;

const SeverityBadge = ({ level = 'low' }) => {
  const s = SEV[level] || SEV.low;
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem',
      borderRadius: 999, background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
};

const LIMIT = 15;
const TYPES = ['all', 'Quiz Violation', 'Fake Certificate', 'Suspicious Certificate'];

const FraudReports = () => {
  const [cases,      setCases]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page,       setPage]       = useState(1);
  const [stats,      setStats]      = useState({ quiz: 0, certificate: 0, total: 0 });
  const searchTimer = useRef(null);

  const fetchData = useCallback(async (q, type, pg) => {
    setLoading(true);
    setError('');
    try {
      const base = new URLSearchParams({ page: pg, limit: LIMIT });
      if (q) base.set('search', q);

      const [quizRes, certRes] = await Promise.all([
        api.get(`/test/fraud-cases?${base}`),
        api.get(`/certificates?page=${pg}&limit=${LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`),
      ]);

      const quizCases = (quizRes.data.data || []).map((item) => {
        const s = item.session;
        const u = s.userId;
        return {
          _id:           s._id,
          fraudType:     'Quiz Violation',
          studentName:   u?.name       || s.userName  || 'Unknown',
          studentId:     u?.studentId  || '--',
          studentEmail:  u?.email      || s.userEmail || '',
          description:   `Fraud score: ${s.fraudScore ?? 0} pts, ${s.fraudCount ?? 0} events` +
                         (s.terminated ? ' (terminated)' : ''),
          severity:      (s.fraudScore ?? 0) >= 80 ? 'critical'
                        : (s.fraudScore ?? 0) >= 50 ? 'high'
                        : (s.fraudScore ?? 0) >= 25 ? 'medium' : 'low',
          date:          s.submittedAt || s.updatedAt,
          topViolations: (item.topViolations || []).map((v) => v.eventType.replace(/_/g, ' ')),
        };
      });

      const allCertificates = (certRes.data?.data || []);
      const certificateCases = allCertificates
        .filter((m) => m.verificationStatus === 'likely_fake' || m.verificationStatus === 'suspicious')
        .map((m) => ({
          _id:           m._id,
          fraudType:     m.verificationStatus === 'likely_fake' ? 'Fake Certificate' : 'Suspicious Certificate',
          studentName:   m.studentName  || 'Unknown',
          studentId:     m.studentId    || '--',
          studentEmail:  m.studentEmail || '',
          description:   `${m.verificationSummary || 'Certificate verification needs review.'} Fraud score: ${m.fraudScore ?? 0}/100`,
          severity:      m.verificationStatus === 'likely_fake' ? 'critical' : 'medium',
          date:          m.uploadedAt,
          topViolations: [],
        }));

      let combined = [...quizCases, ...certificateCases]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      if (type !== 'all') combined = combined.filter((c) => c.fraudType === type);

      setCases(combined);
      setStats({ quiz: quizCases.length, certificate: certificateCases.length, total: combined.length });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fraud reports.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchData(search, typeFilter, page), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, typeFilter, page, fetchData]);

  const totalPages = Math.ceil(cases.length / LIMIT) || 1;
  const paginated  = cases.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 800, color: '#1a0836', letterSpacing: '-0.02em' }}>
          Fraud Reports
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          Unified view of all detected academic fraud cases.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Cases',     value: stats.total,     bg: '#fdf4ff', color: '#7c3aed', Icon: Shield        },
          { label: 'Quiz Violations', value: stats.quiz,      bg: '#fff7ed', color: '#ea580c', Icon: AlertTriangle },
          { label: 'Certificate Fraud', value: stats.certificate, bg: '#fee2e2', color: '#dc2626', Icon: XCircle       },
        ].map(({ label, value, bg, color, Icon }) => (
          <div key={label} style={{
            background: '#fff', borderRadius: 14, padding: '1rem 1.25rem',
            border: '1px solid #ede9fe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={color} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1a0836', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '0.875rem 1rem',
        border: '1px solid #ede9fe', marginBottom: '1rem',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{
          flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#f8f7ff', borderRadius: 8, padding: '0.45rem 0.75rem',
          border: '1px solid #ede9fe',
        }}>
          <Search size={14} color="#9ca3af" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by student name or ID..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.83rem', color: '#374151', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={13} color="#9ca3af" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ border: '1px solid #ede9fe', borderRadius: 8, padding: '0.45rem 0.625rem', fontSize: '0.83rem', color: '#374151', background: '#f8f7ff', outline: 'none' }}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede9fe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.4fr 2fr 3fr 0.9fr 1.6fr',
          padding: '0.75rem 1.25rem', background: '#faf9ff', borderBottom: '1px solid #ede9fe',
          fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>Student</span><span>Fraud Type</span><span>Violations</span><span>Description</span><span>Severity</span><span>Date</span>
        </div>

        {error && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#dc2626', fontSize: '0.85rem' }}>
            <AlertTriangle size={16} style={{ marginRight: 6 }} />{error}
          </div>
        )}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 2fr 3fr 0.9fr 1.6fr', padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', gap: '0.5rem' }}>
              {Array.from({ length: 6 }).map((__, j) => (
                <div key={j} style={{ height: 14, borderRadius: 6, background: '#f3f4f6', animation: 'fr-pulse 1.4s ease-in-out infinite', animationDelay: `${j * 0.1}s` }} />
              ))}
            </div>
          ))
        ) : paginated.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Shield size={36} color="#e5e7eb" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>No fraud cases found.</p>
          </div>
        ) : (
          paginated.map((c, i) => {
            const tc = typeConf(c.fraudType);
            const { Icon } = tc;
            return (
              <div key={`${c._id}-${i}`} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.4fr 2fr 3fr 0.9fr 1.6fr',
                padding: '0.875rem 1.25rem', borderBottom: '1px solid #f9f8ff',
                alignItems: 'center', gap: '0.25rem', transition: 'background 0.1s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#faf9ff'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 700, color: '#1a0836' }}>{c.studentName}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>{c.studentId}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={11} color={tc.color} />
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: tc.color }}>{c.fraudType}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                  {c.topViolations.length > 0 ? c.topViolations.slice(0, 3).map((v, vi) => (
                    <span key={vi} style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem', borderRadius: 999, background: '#ede9fe', color: '#7c3aed', fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
                  )) : <span style={{ fontSize: '0.72rem', color: '#d1d5db' }}>--</span>}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {c.description}
                </p>
                <SeverityBadge level={c.severity} />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{fmtDate(c.date)}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Showing {(page - 1) * LIMIT + 1}--{Math.min(page * LIMIT, cases.length)} of {cases.length}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #ede9fe', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${pg === page ? '#7c3aed' : '#ede9fe'}`, background: pg === page ? '#7c3aed' : '#fff', color: pg === page ? '#fff' : '#374151', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  {pg}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #ede9fe', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes fr-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
};

export default FraudReports;
