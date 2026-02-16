import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, Filter, Search, FileText, Clock, CheckCircle, XCircle, Plus, Download } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { RiskBadge, StatCard } from '../components/Card';
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
      setError('');
      const response = await api.get('/fraud-reports');
      // Backend returns { success: true, data: [...], pagination: {...} }
      if (response.data.success && response.data.data) {
        // Transform backend data to match frontend expectations
        const transformedReports = response.data.data.map(report => ({
          id: report._id,
          caseId: `FR-${new Date(report.detectionTimestamp).getFullYear()}-${String(report._id).slice(-4).toUpperCase()}`,
          studentId: report.studentId,
          studentName: report.student?.name || 'Unknown',
          studentEmail: report.student?.email || '',
          department: report.student?.department || '',
          fraudType: report.fraudType,
          description: report.systemRemarks || 'No description available',
          riskLevel: report.riskLevel?.toLowerCase() || 'low',
          riskScore: report.riskScore,
          status: report.status?.toLowerCase().replace(' ', '-') || 'pending',
          reportedDate: report.detectionTimestamp,
          investigator: report.reviewedBy || null,
          plagiarismScore: report.plagiarismScore,
          matchedSources: report.matchedSources || [],
          attendanceIrregularities: report.attendanceIrregularities,
          identityAnomalies: report.identityAnomalies,
        }));
        setReports(transformedReports);
      } else {
        setReports([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching fraud reports:', err);
      setError(err.response?.data?.message || 'Failed to load fraud reports. Please try again.');
      // Use empty array on error instead of mock data
      setReports([]);
      setLoading(false);
    }
  };

  const fetchFraudReportsFallback = async () => {
    // Fallback with mock data for testing
    try {
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
      setLoading(false);
    } catch (err) {
      console.error('Fallback error:', err);
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Fraud Reports</h1>
          <p className="page-description">Monitor and investigate fraud detection cases</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export Reports
          </Button>
          <Button variant="primary" icon={Plus}>
            New Report
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cases"
          value={reports.length}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Critical Cases"
          value={criticalCases.length}
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="Pending Review"
          value={pendingCases.length}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Under Investigation"
          value={investigatingCases.length}
          icon={Search}
          color="info"
        />
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
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fraud Reports Found</h3>
            <p className="text-gray-600">
              {reports.length === 0 
                ? 'There are no fraud reports in the system yet.' 
                : 'No reports match the selected filters.'}
            </p>
          </div>
        ) : (
          <Table columns={columns} data={filteredReports} />
        )}
      </Card>
    </div>
  );
};

export default FraudReports;
