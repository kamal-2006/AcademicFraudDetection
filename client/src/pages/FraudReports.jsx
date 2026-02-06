import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, Filter } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { RiskBadge } from '../components/Card';
import { STATUS_COLORS } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';
import api from '../api/axios';

const FraudReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  useEffect(() => {
    fetchFraudReports();
  }, []);

  const fetchFraudReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fraud-reports');
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching fraud reports:', err);
      // Mock data if API fails
      setReports([
        {
          id: 1,
          caseId: 'FR-2026-001',
          studentId: 'STU003',
          studentName: 'Mike Johnson',
          fraudType: 'Plagiarism',
          description: 'Assignment similarity 92% with another student',
          riskLevel: 'critical',
          status: 'pending',
          reportedDate: '2026-01-20T10:30:00',
          investigator: null,
        },
        {
          id: 2,
          caseId: 'FR-2026-002',
          studentId: 'STU005',
          studentName: 'David Brown',
          fraudType: 'Exam Anomaly',
          description: 'Unusual score improvement and fast completion time',
          riskLevel: 'high',
          status: 'investigating',
          reportedDate: '2026-01-22T14:15:00',
          investigator: 'Dr. Smith',
        },
        {
          id: 3,
          caseId: 'FR-2026-003',
          studentId: 'STU002',
          studentName: 'Jane Smith',
          fraudType: 'Attendance',
          description: 'Attendance below 40% threshold',
          riskLevel: 'medium',
          status: 'investigating',
          reportedDate: '2026-01-25T09:00:00',
          investigator: 'Dr. Johnson',
        },
        {
          id: 4,
          caseId: 'FR-2026-004',
          studentId: 'STU007',
          studentName: 'Robert Wilson',
          fraudType: 'Plagiarism',
          description: 'Code assignment 95% match with online repository',
          riskLevel: 'critical',
          status: 'pending',
          reportedDate: '2026-02-01T11:20:00',
          investigator: null,
        },
        {
          id: 5,
          caseId: 'FR-2026-005',
          studentId: 'STU012',
          studentName: 'Alex Martinez',
          fraudType: 'Performance Spike',
          description: 'Sudden GPA increase from 2.0 to 3.8',
          riskLevel: 'high',
          status: 'resolved',
          reportedDate: '2026-01-18T16:45:00',
          investigator: 'Dr. Williams',
        },
        {
          id: 6,
          caseId: 'FR-2026-006',
          studentId: 'STU015',
          studentName: 'Lisa Anderson',
          fraudType: 'Exam Anomaly',
          description: 'Completed exam in 20 minutes (avg 120 min)',
          riskLevel: 'high',
          status: 'dismissed',
          reportedDate: '2026-01-28T13:30:00',
          investigator: 'Dr. Brown',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredReports = reports.filter((report) => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || report.riskLevel === filterRisk;
    return matchesStatus && matchesRisk;
  });

  const columns = [
    {
      header: 'Case ID',
      accessor: 'caseId',
      render: (row) => <span className="font-mono text-sm">{row.caseId}</span>,
    },
    {
      header: 'Student',
      accessor: 'studentName',
      render: (row) => (
        <div>
          <p className="font-medium">{row.studentName}</p>
          <p className="text-xs text-gray-500">{row.studentId}</p>
        </div>
      ),
    },
    {
      header: 'Fraud Type',
      accessor: 'fraudType',
    },
    {
      header: 'Risk Level',
      accessor: 'riskLevel',
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Reported',
      accessor: 'reportedDate',
      render: (row) => formatDateTime(row.reportedDate),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/fraud-reports/${row.id}`)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  const pendingCases = reports.filter((r) => r.status === 'pending');
  const investigatingCases = reports.filter((r) => r.status === 'investigating');
  const criticalCases = reports.filter((r) => r.riskLevel === 'critical');

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fraud Reports</h1>
        <p className="text-gray-600 mt-2">Monitor and investigate fraud detection cases</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cases</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reports.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{criticalCases.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCases.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Investigating</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{investigatingCases.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </Card>

      {/* Fraud Reports Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Fraud Cases ({filteredReports.length})
          </h2>
        </div>
        <Table columns={columns} data={filteredReports} />
      </Card>
    </div>
  );
};

export default FraudReports;
