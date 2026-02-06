import { useState, useEffect } from 'react';
import { Copy, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import api from '../api/axios';

const Plagiarism = () => {
  const [plagiarismData, setPlagiarismData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlagiarismData();
  }, []);

  const fetchPlagiarismData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/plagiarism');
      setPlagiarismData(response.data);
    } catch (err) {
      console.error('Error fetching plagiarism data:', err);
      // Mock data if API fails
      setPlagiarismData([
        {
          id: 1,
          studentId: 'STU001',
          name: 'John Doe',
          assignmentName: 'Assignment 1 - Data Structures',
          submittedDate: '2026-01-15',
          similarity: 25,
          matchedWith: 'Internet sources',
          status: 'low',
        },
        {
          id: 2,
          studentId: 'STU002',
          name: 'Jane Smith',
          assignmentName: 'Project - Web Application',
          submittedDate: '2026-01-18',
          similarity: 68,
          matchedWith: 'STU008 (Previous submission)',
          status: 'medium',
        },
        {
          id: 3,
          studentId: 'STU003',
          name: 'Mike Johnson',
          assignmentName: 'Lab Report - Database Design',
          submittedDate: '2026-01-20',
          similarity: 92,
          matchedWith: 'STU015, Internet sources',
          status: 'critical',
        },
        {
          id: 4,
          studentId: 'STU004',
          name: 'Sarah Williams',
          assignmentName: 'Essay - Software Engineering',
          submittedDate: '2026-01-22',
          similarity: 18,
          matchedWith: 'None significant',
          status: 'low',
        },
        {
          id: 5,
          studentId: 'STU005',
          name: 'David Brown',
          assignmentName: 'Code Assignment - Algorithms',
          submittedDate: '2026-01-25',
          similarity: 87,
          matchedWith: 'GitHub repository',
          status: 'high',
        },
        {
          id: 6,
          studentId: 'STU006',
          name: 'Emily Davis',
          assignmentName: 'Research Paper - AI Ethics',
          submittedDate: '2026-01-28',
          similarity: 52,
          matchedWith: 'Published papers',
          status: 'medium',
        },
        {
          id: 7,
          studentId: 'STU007',
          name: 'Robert Wilson',
          assignmentName: 'Assignment 3 - IoT Systems',
          submittedDate: '2026-02-01',
          similarity: 95,
          matchedWith: 'STU012, STU018',
          status: 'critical',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityBadge = (similarity, status) => {
    const statusConfig = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[status]}`}>
          {similarity}%
        </span>
        {similarity >= 80 && <AlertTriangle className="w-4 h-4 text-red-600" />}
      </div>
    );
  };

  const columns = [
    {
      header: 'Student ID',
      accessor: 'studentId',
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Assignment',
      accessor: 'assignmentName',
    },
    {
      header: 'Submitted',
      accessor: 'submittedDate',
      render: (row) => new Date(row.submittedDate).toLocaleDateString(),
    },
    {
      header: 'Similarity',
      accessor: 'similarity',
      render: (row) => getSimilarityBadge(row.similarity, row.status),
    },
    {
      header: 'Matched With',
      accessor: 'matchedWith',
    },
  ];

  const criticalCases = plagiarismData.filter((record) => record.similarity >= 80);
  const highCases = plagiarismData.filter(
    (record) => record.similarity >= 60 && record.similarity < 80
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assignment Plagiarism</h1>
        <p className="text-gray-600 mt-2">Detect and review assignment plagiarism cases</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{plagiarismData.length}</p>
            </div>
            <Copy className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{criticalCases.length}</p>
              <p className="text-xs text-gray-500 mt-1">≥80% similarity</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{highCases.length}</p>
              <p className="text-xs text-gray-500 mt-1">60-79% similarity</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Acceptable</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {plagiarismData.length - criticalCases.length - highCases.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">&lt;60% similarity</p>
            </div>
            <Copy className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Alert for critical cases */}
      {criticalCases.length > 0 && (
        <Alert
          type="error"
          message={`${criticalCases.length} assignment(s) have extremely high similarity (≥80%) and require immediate investigation.`}
        />
      )}

      {/* Plagiarism Detection Guidelines */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Similarity Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>0-30%:</strong> Acceptable - Normal similarity level</li>
          <li>• <strong>30-60%:</strong> Monitor - May need review</li>
          <li>• <strong>60-80%:</strong> High Risk - Requires investigation</li>
          <li>• <strong>80-100%:</strong> Critical - Immediate action required</li>
        </ul>
      </Card>

      {/* Plagiarism Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Plagiarism Reports</h2>
        </div>
        <Table columns={columns} data={plagiarismData} />
      </Card>
    </div>
  );
};

export default Plagiarism;
