import { useState, useEffect } from 'react';
import { Copy, AlertTriangle, Search, Filter, Download, FileText, Shield, Users, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { StatCard } from '../components/Card';
import api from '../api/axios';

const Plagiarism = () => {
  const [plagiarismData, setPlagiarismData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
  const highRiskCases = plagiarismData.filter((record) => record.similarity >= 60 && record.similarity < 80);
  const avgSimilarity = plagiarismData.length > 0
    ? (plagiarismData.reduce((sum, record) => sum + record.similarity, 0) / plagiarismData.length)
    : 0;
  const highCases = plagiarismData.filter(
    (record) => record.similarity >= 60 && record.similarity < 80
  );

  // Apply filters
  const filteredPlagiarismData = plagiarismData.filter((record) => {
    const matchesSearch =
      record.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assignmentName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'critical' && record.similarity >= 80) ||
      (filterStatus === 'high' && record.similarity >= 60 && record.similarity < 80) ||
      (filterStatus === 'medium' && record.similarity >= 30 && record.similarity < 60) ||
      (filterStatus === 'low' && record.similarity < 30);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignment Plagiarism Detection</h1>
          <p className="page-description">Detect and review assignment plagiarism cases</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export Report
          </Button>
          <Button variant="outline" icon={Shield}>
            Settings
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Submissions"
          value={plagiarismData.length}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Critical Cases"
          value={criticalCases.length}
          subtitle="&ge;80% similarity"
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="High Risk"
          value={highRiskCases.length}
          subtitle="60-79% similarity"
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Avg Similarity"
          value={`${avgSimilarity.toFixed(1)}%`}
          icon={TrendingUp}
          color="info"
        />
      </div>

      {/* Alert for critical cases */}
      {criticalCases.length > 0 && (
        <Alert
          type="error"
          message={`${criticalCases.length} assignment(s) have extremely high similarity (&ge;80%) and require immediate investigation.`}
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

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student ID, name, or assignment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical (&ge;80%)</option>
                <option value="high">High Risk (60-79%)</option>
                <option value="medium">Medium (30-59%)</option>
                <option value="low">Low (&lt;30%)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Plagiarism Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Plagiarism Reports ({filteredPlagiarismData.length})
          </h2>
        </div>
        <Table columns={columns} data={filteredPlagiarismData} />
      </Card>
    </div>
  );
};

export default Plagiarism;
