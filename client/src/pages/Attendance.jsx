import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Users } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { attendanceService } from '../api/services';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [filterSubject, filterStatus, filterSemester]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      // Build filters
      const filters = {};
      if (filterSubject) filters.subject = filterSubject;
      if (filterStatus) filters.status = filterStatus;
      if (filterSemester) filters.semester = filterSemester;

      // Fetch attendance records
      const attendanceResponse = await attendanceService.getAllAttendance(filters);
      setAttendanceData(attendanceResponse.data || []);

      // Fetch statistics
      const statsResponse = await attendanceService.getAttendanceStats();
      setStats(statsResponse.data || null);

      // Fetch low attendance students
      const lowStudentsResponse = await attendanceService.getLowAttendanceStudents(75);
      setLowAttendanceStudents(lowStudentsResponse.data || []);

      // Fetch subjects for filter
      const subjectsResponse = await attendanceService.getSubjects();
      setSubjects(subjectsResponse.data || []);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
      // Set empty arrays to prevent undefined errors
      setAttendanceData([]);
      setLowAttendanceStudents([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = attendanceData.filter((record) => {
    const matchesSearch =
      record.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      regular: { bg: 'bg-green-100', text: 'text-green-800', label: 'REGULAR' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'WARNING' },
      critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'CRITICAL' },
    };

    const config = statusConfig[status] || statusConfig.regular;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      header: 'Student ID',
      accessor: 'studentId',
    },
    {
      header: 'Name',
      accessor: 'student',
      render: (row) => row.student?.name || 'N/A',
    },
    {
      header: 'Subject',
      accessor: 'subject',
    },
    {
      header: 'Month/Year',
      accessor: 'month',
      render: (row) => `${row.month} ${row.year}`,
    },
    {
      header: 'Total Classes',
      accessor: 'totalClasses',
    },
    {
      header: 'Attended',
      accessor: 'attendedClasses',
    },
    {
      header: 'Percentage',
      accessor: 'attendancePercentage',
      render: (row) => (
        <span className="font-semibold">{row.attendancePercentage?.toFixed(2)}%</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status),
    },
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="attendance-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Attendance Monitoring</h1>
        <p className="page-description">Track and monitor student attendance records</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.avgAttendance?.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regular Status</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.regularCount || 0}</p>
                <p className="text-xs text-gray-500 mt-1">≥75% attendance</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warning Status</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.warningCount || 0}</p>
                <p className="text-xs text-gray-500 mt-1">60-74% attendance</p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Status</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.criticalCount || 0}</p>
                <p className="text-xs text-gray-500 mt-1">&lt;60% attendance</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Critical Cases Alert */}
      {lowAttendanceStudents.length > 0 && (
        <Alert
          type="warning"
          message={`${lowAttendanceStudents.length} student(s) have low attendance and require immediate attention.`}
        />
      )}

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-filter-wrapper">
          {/* Search */}
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by student ID, name, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Subject Filter */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="regular">Regular</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="filter-select"
            >
              <option value="">All Semesters</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance Records ({filteredData.length})
          </h2>
        </div>
        {filteredData.length > 0 ? (
          <Table columns={columns} data={filteredData} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No attendance records found. Try adjusting your filters.
          </div>
        )}
      </Card>

      {/* Low Attendance Students */}
      {lowAttendanceStudents.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Students with Low Attendance ({lowAttendanceStudents.length})
            </h2>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Avg Attendance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Critical Subjects
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowAttendanceStudents.map((student) => (
                    <tr key={student.studentId}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {student.department}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="font-semibold text-red-600">
                          {student.avgAttendance?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {student.criticalSubjects || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
