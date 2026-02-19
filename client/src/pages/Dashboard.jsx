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

  // Prepare grade distribution data
  const gradeDistributionData = examStats?.gradeDistribution
    ? [
        { grade: 'A+', count: examStats.gradeDistribution['A+'] || 0, color: '#10b981' },
        { grade: 'A', count: examStats.gradeDistribution['A'] || 0, color: '#34d399' },
        { grade: 'A-', count: examStats.gradeDistribution['A-'] || 0, color: '#6ee7b7' },
        { grade: 'B+', count: examStats.gradeDistribution['B+'] || 0, color: '#60a5fa' },
        { grade: 'B', count: examStats.gradeDistribution['B'] || 0, color: '#3b82f6' },
        { grade: 'B-', count: examStats.gradeDistribution['B-'] || 0, color: '#2563eb' },
        { grade: 'C+', count: examStats.gradeDistribution['C+'] || 0, color: '#fbbf24' },
        { grade: 'C', count: examStats.gradeDistribution['C'] || 0, color: '#f59e0b' },
        { grade: 'C-', count: examStats.gradeDistribution['C-'] || 0, color: '#d97706' },
        { grade: 'D', count: examStats.gradeDistribution['D'] || 0, color: '#fb923c' },
        { grade: 'F', count: examStats.gradeDistribution['F'] || 0, color: '#ef4444' },
      ].filter(item => item.count > 0)
    : [];

  // Prepare performance comparison data
  const performanceComparisonData = [
    {
      category: 'Attendance',
      average: attendanceStats?.avgAttendance || 0,
      target: 75,
      status: (attendanceStats?.avgAttendance || 0) >= 75 ? 'Good' : 'Below Target',
    },
    {
      category: 'Exam Score',
      average: examStats?.avgPercentage || 0,
      target: 60,
      status: (examStats?.avgPercentage || 0) >= 60 ? 'Good' : 'Below Target',
    },
  ];

  // Prepare risk level distribution
  const riskLevelData = [
    {
      name: 'Low Risk',
      value: stats.totalStudents - (lowAttendanceStudents.length + highRiskStudents.length),
      color: '#10b981',
    },
    { name: 'Attendance Risk', value: lowAttendanceStudents.length, color: '#f59e0b' },
    { name: 'Performance Risk', value: highRiskStudents.length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Combine high-risk students from both attendance and exams
  const combinedHighRiskStudents = [
    ...lowAttendanceStudents.slice(0, 5).map(s => ({ ...s, reason: 'Low Attendance' })),
    ...highRiskStudents.slice(0, 5).map(s => ({ ...s, reason: 'Poor Exam Performance' })),
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
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

      {/* Charts and Analytics Section */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Visualizations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive data visualization and trend analysis
          </p>
        </div>

        {/* Primary Charts - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance Status Distribution */}
          {attendanceStats && attendanceChartData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Status Distribution</h3>
                  <p className="text-sm text-gray-500">Current attendance status breakdown</p>
                </div>
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Exam Pass/Fail Distribution */}
          {examStats && examPassFailData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Exam Pass/Fail Distribution</h3>
                  <p className="text-sm text-gray-500">Overall exam performance results</p>
                </div>
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={examPassFailData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    formatter={(value) => [`${value} students`, 'Count']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                    {examPassFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Grade Distribution Chart - Full Width */}
        {gradeDistributionData.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Grade Distribution Analysis</h3>
                <p className="text-sm text-gray-500">Distribution of grades across all examinations</p>
              </div>
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={gradeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="grade" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value) => [`${value} students`, 'Count']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" radius={[8, 8, 0, 0]}>
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">A Grades</p>
                <p className="text-2xl font-bold text-green-600">
                  {(gradeDistributionData.filter(g => g.grade.startsWith('A')).reduce((sum, g) => sum + g.count, 0))}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">B Grades</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(gradeDistributionData.filter(g => g.grade.startsWith('B')).reduce((sum, g) => sum + g.count, 0))}
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">C Grades</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(gradeDistributionData.filter(g => g.grade.startsWith('C')).reduce((sum, g) => sum + g.count, 0))}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">D & F Grades</p>
                <p className="text-2xl font-bold text-red-600">
                  {(gradeDistributionData.filter(g => g.grade === 'D' || g.grade === 'F').reduce((sum, g) => sum + g.count, 0))}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Performance Comparison & Risk Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance vs Target Chart */}
          {performanceComparisonData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Performance vs Target</h3>
                  <p className="text-sm text-gray-500">Current average vs expected thresholds</p>
                </div>
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" domain={[0, 100]} />
                  <YAxis type="category" dataKey="category" stroke="#6b7280" width={100} />
                  <Tooltip
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="average" fill="#3b82f6" name="Current Average" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="target" fill="#10b981" name="Target" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {performanceComparisonData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <span
                      className={`text-sm font-semibold px-2 py-1 rounded ${
                        item.status === 'Good'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Risk Level Distribution */}
          {riskLevelData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Student Risk Distribution</h3>
                  <p className="text-sm text-gray-500">Risk categorization across all students</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskLevelData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {riskLevelData.map((item, index) => (
                  <div key={index} className="text-center p-2 rounded" style={{ backgroundColor: `${item.color}20` }}>
                    <p className="text-xs text-gray-600 mb-1">{item.name}</p>
                    <p className="text-xl font-bold" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
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
