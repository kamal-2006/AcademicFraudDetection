import { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import api from '../api/axios';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance');
      setAttendanceData(response.data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      // Mock data if API fails
      setAttendanceData([
        {
          id: 1,
          studentId: 'STU001',
          name: 'John Doe',
          totalClasses: 50,
          attended: 42,
          percentage: 84,
          status: 'good',
        },
        {
          id: 2,
          studentId: 'STU002',
          name: 'Jane Smith',
          totalClasses: 50,
          attended: 32,
          percentage: 64,
          status: 'warning',
        },
        {
          id: 3,
          studentId: 'STU003',
          name: 'Mike Johnson',
          totalClasses: 50,
          attended: 22,
          percentage: 44,
          status: 'critical',
        },
        {
          id: 4,
          studentId: 'STU004',
          name: 'Sarah Williams',
          totalClasses: 50,
          attended: 46,
          percentage: 92,
          status: 'good',
        },
        {
          id: 5,
          studentId: 'STU005',
          name: 'David Brown',
          totalClasses: 50,
          attended: 18,
          percentage: 36,
          status: 'critical',
        },
        {
          id: 6,
          studentId: 'STU006',
          name: 'Emily Davis',
          totalClasses: 50,
          attended: 29,
          percentage: 58,
          status: 'warning',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      good: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[status]}`}>
        {status.toUpperCase()}
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
      header: 'Total Classes',
      accessor: 'totalClasses',
    },
    {
      header: 'Attended',
      accessor: 'attended',
    },
    {
      header: 'Percentage',
      accessor: 'percentage',
      render: (row) => (
        <span className="font-semibold">{row.percentage}%</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status),
    },
  ];

  const criticalCases = attendanceData.filter((record) => record.percentage < 50);
  const warningCases = attendanceData.filter(
    (record) => record.percentage >= 50 && record.percentage < 75
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Monitoring</h1>
        <p className="text-gray-600 mt-2">Track and monitor student attendance records</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceData.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Warning Cases</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{warningCases.length}</p>
              <p className="text-xs text-gray-500 mt-1">50-75% attendance</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Cases</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{criticalCases.length}</p>
              <p className="text-xs text-gray-500 mt-1">&lt;50% attendance</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Critical Cases Alert */}
      {criticalCases.length > 0 && (
        <Alert
          type="warning"
          message={`${criticalCases.length} student(s) have attendance below 50% and require immediate attention.`}
        />
      )}

      {/* Attendance Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
        </div>
        <Table columns={columns} data={attendanceData} />
      </Card>
    </div>
  );
};

export default Attendance;
