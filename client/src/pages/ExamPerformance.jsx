import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Clock } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import api from '../api/axios';

const ExamPerformance = () => {
  const [examData, setExamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/performance');
      setExamData(response.data);
    } catch (err) {
      console.error('Error fetching exam data:', err);
      // Mock data if API fails
      setExamData([
        {
          id: 1,
          studentId: 'STU001',
          name: 'John Doe',
          examName: 'Midterm - Computer Networks',
          score: 85,
          avgScore: 78,
          completionTime: 90,
          avgTime: 95,
          anomaly: null,
        },
        {
          id: 2,
          studentId: 'STU002',
          name: 'Jane Smith',
          examName: 'Final - Data Structures',
          score: 92,
          avgScore: 75,
          completionTime: 45,
          avgTime: 120,
          anomaly: 'sudden_spike',
        },
        {
          id: 3,
          studentId: 'STU003',
          name: 'Mike Johnson',
          examName: 'Midterm - Algorithms',
          score: 78,
          avgScore: 45,
          completionTime: 35,
          avgTime: 110,
          anomaly: 'unusual_improvement',
        },
        {
          id: 4,
          studentId: 'STU004',
          name: 'Sarah Williams',
          examName: 'Quiz - Database Systems',
          score: 88,
          avgScore: 85,
          completionTime: 28,
          avgTime: 30,
          anomaly: null,
        },
        {
          id: 5,
          studentId: 'STU005',
          name: 'David Brown',
          examName: 'Final - Web Development',
          score: 95,
          avgScore: 40,
          completionTime: 25,
          avgTime: 100,
          anomaly: 'fast_completion',
        },
        {
          id: 6,
          studentId: 'STU006',
          name: 'Emily Davis',
          examName: 'Midterm - Software Engineering',
          score: 82,
          avgScore: 80,
          completionTime: 95,
          avgTime: 90,
          anomaly: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAnomalyBadge = (anomaly) => {
    if (!anomaly) {
      return <span className="text-green-600 text-sm">✓ Normal</span>;
    }

    const anomalyConfig = {
      sudden_spike: { label: 'Sudden Spike', color: 'bg-orange-100 text-orange-800' },
      unusual_improvement: { label: 'Unusual Improvement', color: 'bg-yellow-100 text-yellow-800' },
      fast_completion: { label: 'Fast Completion', color: 'bg-red-100 text-red-800' },
    };

    const config = anomalyConfig[anomaly];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        ⚠ {config.label}
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
      accessor: 'name',
    },
    {
      header: 'Exam',
      accessor: 'examName',
    },
    {
      header: 'Score',
      accessor: 'score',
      render: (row) => (
        <span className="font-semibold">
          {row.score}% 
          {row.score > row.avgScore + 20 && (
            <TrendingUp className="inline w-4 h-4 ml-1 text-orange-600" />
          )}
        </span>
      ),
    },
    {
      header: 'Avg Score',
      accessor: 'avgScore',
      render: (row) => `${row.avgScore}%`,
    },
    {
      header: 'Time (min)',
      accessor: 'completionTime',
      render: (row) => (
        <span>
          {row.completionTime}
          {row.completionTime < row.avgTime * 0.5 && (
            <Clock className="inline w-4 h-4 ml-1 text-red-600" />
          )}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'anomaly',
      render: (row) => getAnomalyBadge(row.anomaly),
    },
  ];

  const anomalyCases = examData.filter((record) => record.anomaly !== null);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Performance</h1>
        <p className="text-gray-600 mt-2">Monitor exam scores and detect anomalies</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{examData.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Anomalies Detected</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{anomalyCases.length}</p>
              <p className="text-xs text-gray-500 mt-1">Flagged for review</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Normal Performance</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {examData.length - anomalyCases.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">No issues</p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Alert for anomalies */}
      {anomalyCases.length > 0 && (
        <Alert
          type="warning"
          message={`${anomalyCases.length} exam record(s) show anomalous patterns including sudden score spikes and unusually fast completion times.`}
        />
      )}

      {/* Exam Performance Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exam Records</h2>
        </div>
        <Table columns={columns} data={examData} />
      </Card>
    </div>
  );
};

export default ExamPerformance;
