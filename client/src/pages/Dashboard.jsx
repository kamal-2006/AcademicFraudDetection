import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, TrendingUp, Activity, Calendar, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard, AlertCard } from '../components/Card';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { attendanceService, examService } from '../api/services';
import api from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    fraudAlerts: 0,
    highRiskCases: 0,
    activeInvestigations: 0,
  });
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [examStats, setExamStats] = useState(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [highRiskStudents, setHighRiskStudents] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch general stats
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        // Use default values if dashboard API not implemented yet
        setStats({
          totalStudents: 0,
          fraudAlerts: 0,
          highRiskCases: 0,
          activeInvestigations: 0,
        });
      }

      // Fetch attendance statistics
      try {
        const attendanceResponse = await attendanceService.getAttendanceStats();
        setAttendanceStats(attendanceResponse.data);
      } catch (err) {
        console.error('Error fetching attendance stats:', err);
        setAttendanceStats(null);
      }

      // Fetch exam statistics
      try {
        const examResponse = await examService.getExamStats();
        setExamStats(examResponse.data);
      } catch (err) {
        console.error('Error fetching exam stats:', err);
        setExamStats(null);
      }

      // Fetch low attendance students
      try {
        const lowAttResponse = await attendanceService.getLowAttendanceStudents(75);
        setLowAttendanceStudents(lowAttResponse.data || []);
      } catch (err) {
        console.error('Error fetching low attendance students:', err);
        setLowAttendanceStudents([]);
      }

      // Fetch high-risk students from exam performance
      try {
        const highRiskResponse = await examService.getHighRiskStudents();
        setHighRiskStudents(highRiskResponse.data || []);
      } catch (err) {
        console.error('Error fetching high-risk students:', err);
        setHighRiskStudents([]);
      }

      // Fetch total students count
      try {
        const studentsResponse = await api.get('/students?limit=1');
        setStats(prev => ({
          ...prev,
          totalStudents: studentsResponse.data.pagination?.totalRecords || 0,
        }));
      } catch (err) {
        console.error('Error fetching students count:', err);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for attendance status
  const attendanceChartData = attendanceStats
    ? [
        { name: 'Regular', value: attendanceStats.regularCount, color: '#10b981' },
        { name: 'Warning', value: attendanceStats.warningCount, color: '#f59e0b' },
        { name: 'Critical', value: attendanceStats.criticalCount, color: '#ef4444' },
      ]
    : [];

  // Prepare chart data for exam pass/fail
  const examPassFailData = examStats
    ? [
        { name: 'Pass', value: examStats.passCount, color: '#10b981' },
        { name: 'Fail', value: examStats.failCount, color: '#ef4444' },
      ]
    : [];

  // Combine high-risk students from both attendance and exams
  const combinedHighRiskStudents = [
    ...lowAttendanceStudents.slice(0, 5).map(s => ({ ...s, reason: 'Low Attendance' })),
    ...highRiskStudents.slice(0, 5).map(s => ({ ...s, reason: 'Poor Exam Performance' })),
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of academic fraud detection system</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Low Attendance"
          value={lowAttendanceStudents.length}
          icon={Calendar}
          color="warning"
        />
        <StatCard
          title="High Risk (Exams)"
          value={highRiskStudents.length}
          icon={FileText}
          color="danger"
        />
        <StatCard
          title="Total Alerts"
          value={lowAttendanceStudents.length + highRiskStudents.length}
          icon={AlertTriangle}
          color="warning"
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Metrics */}
        {attendanceStats && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Attendance</span>
                <span className="text-lg font-bold text-blue-600">
                  {attendanceStats.avgAttendance?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Regular Status</span>
                <span className="text-lg font-bold text-green-600">
                  {attendanceStats.regularCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Warning Status</span>
                <span className="text-lg font-bold text-yellow-600">
                  {attendanceStats.warningCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Status</span>
                <span className="text-lg font-bold text-red-600">
                  {attendanceStats.criticalCount || 0}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Exam Performance Metrics */}
        {examStats && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Exam Performance</h3>
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className="text-lg font-bold text-purple-600">
                  {examStats.avgPercentage?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Exams</span>
                <span className="text-lg font-bold text-blue-600">{examStats.totalExams || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pass Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {examStats.passRate?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed Exams</span>
                <span className="text-lg font-bold text-red-600">{examStats.failCount || 0}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Combined Risk Metrics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Summary</h3>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Low Attendance Students</span>
              <span className="text-lg font-bold text-orange-600">
                {lowAttendanceStudents.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failing Students</span>
              <span className="text-lg font-bold text-red-600">{highRiskStudents.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total High-Risk</span>
              <span className="text-lg font-bold text-red-600">
                {lowAttendanceStudents.length + highRiskStudents.length}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={() => navigate('/students')}
                className="w-full py-2 px-4 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
              >
                View All Risk Cases
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="alert-cards-grid">
        <AlertCard
          type="critical"
          title="Critical Attendance"
          message={`${attendanceStats?.criticalCount || 0} students with attendance below 60%`}
          count={attendanceStats?.criticalCount || 0}
          onClick={() => navigate('/attendance')}
        />
        <AlertCard
          type="high"
          title="Failing Students"
          message={`${highRiskStudents.length} students with poor exam performance`}
          count={highRiskStudents.length}
          onClick={() => navigate('/exams')}
        />
        <AlertCard
          type="medium"
          title="Low Attendance Warning"
          message={`${lowAttendanceStudents.length} students below 75% attendance`}
          count={lowAttendanceStudents.length}
          onClick={() => navigate('/attendance')}
        />
        <AlertCard
          type="low"
          title="Total Students Tracked"
          message="Students with attendance and exam records"
          count={stats.totalStudents}
          onClick={() => navigate('/students')}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Attendance Status Distribution */}
        {attendanceStats && attendanceChartData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">Attendance Status Distribution</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Exam Pass/Fail Distribution */}
        {examStats && examPassFailData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">Exam Pass/Fail Distribution</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={examPassFailData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {examPassFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* High-Risk Students Table */}
      {combinedHighRiskStudents.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              High-Risk Students Requiring Attention
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Students with low attendance or poor exam performance
            </p>
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
                      Risk Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Metric
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {combinedHighRiskStudents.map((student, index) => (
                    <tr key={`${student.studentId}-${index}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {student.department}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            student.reason === 'Low Attendance'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">
                        {student.avgAttendance
                          ? `${student.avgAttendance.toFixed(1)}% Attendance`
                          : student.avgPercentage
                          ? `${student.avgPercentage.toFixed(1)}% Avg Score`
                          : 'N/A'}
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

export default Dashboard;
