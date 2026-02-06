import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard, AlertCard } from '../components/Card';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
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

  // Sample data for charts
  const attendancePerformanceData = [
    { name: 'Week 1', attendance: 85, performance: 75 },
    { name: 'Week 2', attendance: 80, performance: 70 },
    { name: 'Week 3', attendance: 75, performance: 65 },
    { name: 'Week 4', attendance: 70, performance: 60 },
    { name: 'Week 5', attendance: 65, performance: 55 },
    { name: 'Week 6', attendance: 60, performance: 50 },
  ];

  const fraudTrendsData = [
    { name: 'Jan', plagiarism: 5, examFraud: 3, attendance: 2 },
    { name: 'Feb', plagiarism: 7, examFraud: 4, attendance: 3 },
    { name: 'Mar', plagiarism: 6, examFraud: 5, attendance: 4 },
    { name: 'Apr', plagiarism: 8, examFraud: 6, attendance: 5 },
    { name: 'May', plagiarism: 10, examFraud: 7, attendance: 6 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Use mock data if API fails
      setStats({
        totalStudents: 1250,
        fraudAlerts: 47,
        highRiskCases: 12,
        activeInvestigations: 8,
      });
    } finally {
      setLoading(false);
    }
  };

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
          title="Fraud Alerts"
          value={stats.fraudAlerts}
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="High Risk Cases"
          value={stats.highRiskCases}
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Active Investigations"
          value={stats.activeInvestigations}
          icon={Activity}
          color="success"
        />
      </div>

      {/* Alert Cards */}
      <div className="alert-cards-grid">
        <AlertCard
          type="critical"
          title="Critical Plagiarism Cases"
          message="Multiple assignments flagged with >90% similarity"
          count={5}
          onClick={() => navigate('/plagiarism')}
        />
        <AlertCard
          type="high"
          title="Suspicious Exam Performance"
          message="Unusual grade spikes detected in recent exams"
          count={7}
          onClick={() => navigate('/exams')}
        />
        <AlertCard
          type="medium"
          title="Low Attendance Patterns"
          message="Students with attendance below 40%"
          count={15}
          onClick={() => navigate('/attendance')}
        />
        <AlertCard
          type="low"
          title="Pending Reviews"
          message="Cases awaiting administrator review"
          count={20}
          onClick={() => navigate('/fraud-reports')}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Attendance vs Performance */}
        <div className="chart-card">
          <h3 className="chart-title">
            Attendance vs Performance Correlation
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendancePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="performance" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Trends */}
        <div className="chart-card">
          <h3 className="chart-title">
            Fraud Detection Trends
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fraudTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="plagiarism" fill="#ef4444" />
                <Bar dataKey="examFraud" fill="#f59e0b" />
                <Bar dataKey="attendance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
