import { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, BarChart3, Award,
  Calendar, TrendingUp, AlertTriangle, User,
  Clock, CheckCircle, XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const StatCard = ({ icon: Icon, label, value, color = 'indigo', sub }) => {
  const colors = {
    indigo: { bg: '#eef2ff', icon: '#4f46e5', text: '#3730a3' },
    green:  { bg: '#f0fdf4', icon: '#16a34a', text: '#15803d' },
    orange: { bg: '#fff7ed', icon: '#ea580c', text: '#c2410c' },
    red:    { bg: '#fef2f2', icon: '#dc2626', text: '#b91c1c' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: c.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color={c.icon} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
          {value ?? '—'}
        </p>
        {sub && <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: c.text }}>{sub}</p>}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState(null);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch data linked to this student (by studentId if available)
        if (user?.studentId) {
          const [attRes, examRes] = await Promise.allSettled([
            api.get(`/attendance?studentId=${user.studentId}`),
            api.get(`/exams?studentId=${user.studentId}`),
          ]);
          if (attRes.status === 'fulfilled') setAttendanceData(attRes.value.data);
          if (examRes.status === 'fulfilled') setExamData(examRes.value.data);
        }
      } catch {
        // Silently handle — dashboard degrades gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const attendanceRate = attendanceData?.summary?.attendanceRate ?? null;
  const totalClasses   = attendanceData?.summary?.totalClasses ?? null;
  const attended       = attendanceData?.summary?.present ?? null;
  const avgScore       = examData?.summary?.averageScore ?? null;
  const totalExams     = examData?.summary?.totalExams ?? null;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' :
    greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Top Bar */}
      <header style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
        padding: '0 2rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <GraduationCap size={18} />
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
            AcademiGuard
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem',
          }}>
            {user?.name?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Welcome */}
        <div style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 14,
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.03em' }}>
              {greeting}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p style={{ margin: '0.375rem 0 0', color: '#4338ca', fontSize: '0.9rem' }}>
              Here&apos;s an overview of your academic status.
            </p>
            {user?.studentId && (
              <p style={{ margin: '0.25rem 0 0', color: '#6366f1', fontSize: '0.8rem' }}>
                Student ID: <strong>{user.studentId}</strong>
              </p>
            )}
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: 14,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <GraduationCap size={28} />
          </div>
        </div>

        {/* Profile incomplete warning */}
        {!user?.studentId && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: '0.875rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
            color: '#92400e',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} color="#d97706" />
            <span>
              Your Student ID is not linked. Contact your institution&apos;s admin to
              associate your account with your academic records.
            </span>
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '1.25rem 1.5rem', height: 90,
                animation: 'pulse 1.5s infinite',
              }} />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <StatCard
              icon={Calendar}
              label="Attendance Rate"
              value={attendanceRate !== null ? `${attendanceRate}%` : 'N/A'}
              color={
                attendanceRate === null ? 'indigo' :
                attendanceRate >= 75 ? 'green' :
                attendanceRate >= 60 ? 'orange' : 'red'
              }
              sub={
                attendanceRate !== null
                  ? attendanceRate >= 75 ? 'Good standing' : 'Low attendance warning'
                  : 'Link your Student ID'
              }
            />
            <StatCard
              icon={CheckCircle}
              label="Classes Attended"
              value={attended !== null ? attended : 'N/A'}
              color="green"
              sub={totalClasses !== null ? `of ${totalClasses} total` : undefined}
            />
            <StatCard
              icon={BarChart3}
              label="Average Score"
              value={avgScore !== null ? `${avgScore}%` : 'N/A'}
              color={
                avgScore === null ? 'indigo' :
                avgScore >= 70 ? 'green' :
                avgScore >= 50 ? 'orange' : 'red'
              }
              sub={avgScore !== null ? (avgScore >= 70 ? 'Performing well' : 'Needs improvement') : 'Link your Student ID'}
            />
            <StatCard
              icon={BookOpen}
              label="Exams Taken"
              value={totalExams !== null ? totalExams : 'N/A'}
              color="indigo"
            />
          </div>
        )}

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Profile Card */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '1.5rem',
          }}>
            <h3 style={{
              margin: '0 0 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <User size={16} color="#4f46e5" />
              Your Profile
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Name',       value: user?.name },
                { label: 'Email',      value: user?.email },
                { label: 'Role',       value: 'Student' },
                { label: 'Student ID', value: user?.studentId || 'Not set' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: '0.8375rem', fontWeight: 600, color: '#111827', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Standing */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '1.5rem',
          }}>
            <h3 style={{
              margin: '0 0 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Award size={16} color="#4f46e5" />
              Academic Standing
            </h3>
            {!user?.studentId ? (
              <div style={{
                textAlign: 'center', padding: '1.5rem 1rem',
                color: '#9ca3af', fontSize: '0.85rem',
              }}>
                <XCircle size={32} color="#d1d5db" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ margin: 0 }}>No records linked</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>
                  Contact admin to link your Student ID
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', background: '#f8fafc', borderRadius: 8,
                }}>
                  <span style={{ fontSize: '0.8125rem', color: '#374151' }}>Attendance</span>
                  <span style={{
                    fontSize: '0.8125rem', fontWeight: 700,
                    color: attendanceRate >= 75 ? '#16a34a' : '#dc2626',
                  }}>
                    {attendanceRate ?? '—'}%
                  </span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', background: '#f8fafc', borderRadius: 8,
                }}>
                  <span style={{ fontSize: '0.8125rem', color: '#374151' }}>Avg Score</span>
                  <span style={{
                    fontSize: '0.8125rem', fontWeight: 700,
                    color: avgScore >= 70 ? '#16a34a' : '#dc2626',
                  }}>
                    {avgScore ?? '—'}%
                  </span>
                </div>
                <div style={{
                  padding: '0.75rem', borderRadius: 8,
                  background: attendanceRate >= 75 && avgScore >= 70 ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${attendanceRate >= 75 && avgScore >= 70 ? '#bbf7d0' : '#fecaca'}`,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  {attendanceRate >= 75 && avgScore >= 70
                    ? <CheckCircle size={15} color="#16a34a" />
                    : <AlertTriangle size={15} color="#dc2626" />
                  }
                  <span style={{
                    fontSize: '0.8125rem', fontWeight: 600,
                    color: attendanceRate >= 75 && avgScore >= 70 ? '#15803d' : '#b91c1c',
                  }}>
                    {attendanceRate >= 75 && avgScore >= 70 ? 'Good standing' : 'Requires attention'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: '2rem', textAlign: 'center',
          fontSize: '0.8rem', color: '#9ca3af',
        }}>
          <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Data is refreshed in real-time. For discrepancies, contact your faculty or admin.
        </p>
      </main>
    </div>
  );
};

export default StudentDashboard;
