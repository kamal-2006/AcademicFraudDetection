import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, AlertTriangle, FileText } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { RiskBadge } from '../components/Card';
import { STATUS_COLORS } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';
import api from '../api/axios';

const FraudReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReportDetail();
  }, [id]);

  const fetchReportDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/fraud-reports/${id}`);
      // Backend returns { success: true, data: {...} }
      if (response.data.success && response.data.data) {
        const reportData = response.data.data;
        // Transform backend data to match frontend expectations
        const transformedReport = {
          id: reportData._id,
          caseId: `FR-${new Date(reportData.detectionTimestamp).getFullYear()}-${String(reportData._id).slice(-4).toUpperCase()}`,
          studentId: reportData.studentId,
          studentName: reportData.student?.name || 'Unknown',
          studentEmail: reportData.student?.email || '',
          department: reportData.student?.department || '',
          year: reportData.student?.year ? `${reportData.student.year}${getOrdinalSuffix(reportData.student.year)} Year` : 'N/A',
          fraudType: reportData.fraudType,
          description: reportData.systemRemarks || 'No description available',
          detailedFindings: reportData.systemRemarks || 'No detailed findings available',
          riskLevel: reportData.riskLevel?.toLowerCase() || 'low',
          riskScore: reportData.riskScore,
          status: reportData.status?.toLowerCase().replace(' ', '-') || 'pending',
          reportedDate: reportData.detectionTimestamp,
          investigator: reportData.reviewedBy || null,
          reviewNotes: reportData.reviewNotes || '',
          evidence: [],
          plagiarismScore: reportData.plagiarismScore,
          matchedSources: reportData.matchedSources || [],
          attendanceIrregularities: reportData.attendanceIrregularities,
          identityAnomalies: reportData.identityAnomalies,
          studentHistory: {
            previousCases: 0,
            avgGPA: reportData.student?.gpa || 0,
            attendance: reportData.student?.attendance || 0,
          },
        };
        setReport(transformedReport);
      } else {
        setError('Report not found');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report detail:', err);
      setError(err.response?.data?.message || 'Failed to load report details. Please try again.');
      setLoading(false);
    }
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      setError('');
      // Backend uses PUT and expects status in specific format
      const statusMap = {
        'pending': 'Pending Review',
        'investigating': 'Under Investigation',
        'resolved': 'Resolved',
        'confirmed': 'Confirmed',
        'dismissed': 'Dismissed'
      };
      const backendStatus = statusMap[newStatus] || newStatus;
      await api.put(`/fraud-reports/${id}`, { status: backendStatus });
      setReport({ ...report, status: newStatus });
      // Show success message (you can implement a toast notification here)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
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

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
        <Button onClick={() => navigate('/fraud-reports')}>Back to Reports</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/fraud-reports')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Reports
      </Button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{report.caseId}</h1>
          <p className="text-gray-600 mt-2">Fraud Case Details</p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={report.riskLevel} />
          {getStatusBadge(report.status)}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Case Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Fraud Type</label>
                <p className="text-gray-900 mt-1">{report.fraudType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1">{report.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Detailed Findings</label>
                <p className="text-gray-900 mt-1">{report.detailedFindings}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Reported Date</label>
                <p className="text-gray-900 mt-1">{formatDateTime(report.reportedDate)}</p>
              </div>
              {report.investigator && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Investigator</label>
                  <p className="text-gray-900 mt-1">{report.investigator}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Evidence */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Evidence</h2>
            <ul className="space-y-2">
              {report.evidence.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-900">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => updateStatus('investigating')}
                disabled={updating || report.status === 'investigating'}
              >
                Mark as Investigating
              </Button>
              <Button
                variant="success"
                onClick={() => updateStatus('resolved')}
                disabled={updating || report.status === 'resolved'}
              >
                Mark as Resolved
              </Button>
              <Button
                variant="secondary"
                onClick={() => updateStatus('dismissed')}
                disabled={updating || report.status === 'dismissed'}
              >
                Dismiss Case
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student Profile */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{report.studentName}</h3>
                <p className="text-sm text-gray-600">{report.studentId}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="text-gray-900">{report.studentEmail}</p>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <p className="text-gray-900">{report.department}</p>
              </div>
              <div>
                <span className="text-gray-600">Year:</span>
                <p className="text-gray-900">{report.year}</p>
              </div>
            </div>
          </Card>

          {/* Student History */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Student History</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Previous Cases</span>
                <span className="font-semibold text-red-600">
                  {report.studentHistory.previousCases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average GPA</span>
                <span className="font-semibold text-gray-900">
                  {report.studentHistory.avgGPA}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Attendance</span>
                <span className="font-semibold text-gray-900">
                  {report.studentHistory.attendance}%
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="font-semibold text-red-900">Risk Assessment</h3>
            </div>
            <p className="text-sm text-red-800">
              This case is marked as <strong>{report.riskLevel.toUpperCase()}</strong> priority
              and requires immediate attention due to the severity of the fraud indicators.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FraudReportDetail;
