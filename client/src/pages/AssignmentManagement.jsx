import { useEffect, useMemo, useState } from 'react';
import { Users, UserCheck, Layers, PlusCircle, RefreshCcw, CalendarDays, ClipboardCheck } from 'lucide-react';
import { assignmentService } from '../api/services';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const AssignmentManagement = () => {
  const [students, setStudents] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentMode, setAssignmentMode] = useState('students');
  const [studentIds, setStudentIds] = useState([]);
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');

  const departments = useMemo(() => {
    if (departmentOptions.length) return departmentOptions;
    return [...new Set(students.map((s) => s.department).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [students, departmentOptions]);

  const years = useMemo(() => {
    if (yearOptions.length) return yearOptions;
    return [...new Set(students.map((s) => Number(s.year)).filter((y) => Number.isInteger(y)))].sort((a, b) => a - b);
  }, [students, yearOptions]);

  const groupMatchedStudents = useMemo(() => {
    if (assignmentMode !== 'group') return [];

    return students.filter((s) => {
      const studentDept = String(s.department || '').trim();
      const studentYear = Number(s.year);

      const departmentMatches = !department || studentDept === department;
      const yearMatches = !year || studentYear === Number(year);

      return departmentMatches && yearMatches;
    });
  }, [students, assignmentMode, department, year]);

  const selectedCount = studentIds.length;

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, assignmentsRes] = await Promise.all([
        assignmentService.getAssignableStudents(),
        assignmentService.getFacultyAssignedAssignments(),
      ]);

      const assignableData = studentsRes.data;
      if (Array.isArray(assignableData)) {
        // Backward compatibility in case old API shape is returned.
        setStudents(assignableData);
        setDepartmentOptions([]);
        setYearOptions([]);
      } else {
        setStudents(assignableData?.students || []);
        setDepartmentOptions(assignableData?.departments || []);
        setYearOptions(assignableData?.years || []);
      }

      setAssignments(assignmentsRes.data || []);
      setMessage(null);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load assignments data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStudent = (id) => {
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setDescription('');
    setDueDate('');
    setAssignmentMode('students');
    setStudentIds([]);
    setDepartment('');
    setYear('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim() || !subject.trim() || !dueDate) {
      setMessage({ type: 'error', text: 'Title, subject, and due date are required.' });
      return;
    }

    if (assignmentMode === 'students' && studentIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one student.' });
      return;
    }

    if (assignmentMode === 'group' && !department && !year) {
      setMessage({ type: 'error', text: 'Please select department or year for group assignment.' });
      return;
    }

    if (assignmentMode === 'group' && groupMatchedStudents.length === 0) {
      setMessage({ type: 'error', text: 'No students match the selected department/year.' });
      return;
    }

    setSaving(true);
    try {
      await assignmentService.createAssignedAssignment({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        dueDate,
        assignmentMode,
        studentEmails: studentIds,
        department: department || undefined,
        year: year || undefined,
      });

      setMessage({ type: 'success', text: 'Assignment created and assigned successfully.' });
      resetForm();
      await loadData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create assignment.',
      });
    } finally {
      setSaving(false);
    }
  };

  const msgStyle = (type) => ({
    padding: '0.75rem 1rem',
    borderRadius: 10,
    border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}`,
    background: type === 'success' ? '#f0fdf4' : '#fef2f2',
    color: type === 'success' ? '#166534' : '#991b1b',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>
          Assignment Management
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Create assignments for specific students or groups and track submission progress.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <PlusCircle size={18} color="#7c3aed" />
          <h2 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>Create Assignment</h2>
        </div>

        {message && <div style={msgStyle(message.type)}>{message.text}</div>}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} style={{ padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fafafa' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={100} style={{ padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fafafa' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fafafa' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} style={{ padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fafafa', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="radio" checked={assignmentMode === 'students'} onChange={() => setAssignmentMode('students')} />
              <UserCheck size={15} color="#374151" />
              <span style={{ fontSize: '0.85rem', color: '#374151' }}>Specific Students</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="radio" checked={assignmentMode === 'group'} onChange={() => setAssignmentMode('group')} />
              <Layers size={15} color="#374151" />
              <span style={{ fontSize: '0.85rem', color: '#374151' }}>Group Assignment</span>
            </label>
          </div>

          {assignmentMode === 'students' ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Select Students</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{selectedCount} selected</span>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                {students.map((s) => {
                  const checked = studentIds.includes(s.email);
                  return (
                    <label key={s._id || s.email} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, border: '1px solid #f3f4f6', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', background: checked ? '#f5f3ff' : '#fff' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.email)} />
                      <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                        <strong>{s.name}</strong><br />
                        <span style={{ color: '#6b7280' }}>{s.email}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Department (optional)</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fafafa' }}>
                  <option value="">All Departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Year (optional)</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: '0.6rem 0.875rem', borderRadius: 8, border: '1px solid #d1d5db', background: '#fafafa' }}>
                  <option value="">All Years</option>
                  {years.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#4b5563' }}>
                Matching students for current selection: <strong>{groupMatchedStudents.length}</strong>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} style={{ alignSelf: 'flex-start', background: saving ? '#c4b5fd' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 9, padding: '0.65rem 1.5rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Assign Now'}
          </button>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={16} color="#7c3aed" />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Assigned Tasks</p>
          <button onClick={loadData} disabled={loading} style={{ marginLeft: 'auto', border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', borderRadius: 8, padding: '0.35rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <RefreshCcw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            No assignments created yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Title', 'Subject', 'Due Date', 'Assigned', 'Submitted', 'Pending', 'Mode'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111827' }}>{a.title}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{a.subject}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <CalendarDays size={12} /> {formatDate(a.dueDate)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#eef2ff', color: '#3730a3', borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>
                        {a.totalAssigned}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>
                        {a.submittedCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>
                        {a.pendingCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {a.assignmentMode === 'group' ? <Users size={12} /> : <UserCheck size={12} />} {a.assignmentMode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentManagement;
