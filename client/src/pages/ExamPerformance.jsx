import { useState, useEffect } from 'react';
import { Search, Filter, FileText, TrendingUp, TrendingDown, Award, Download, Plus, BarChart3 } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { StatCard } from '../components/Card';
import { examService } from '../api/services';

const ExamPerformance = () => {
  const [examData, setExamData] = useState([]);
  const [stats, setStats] = useState(null);
  const [failingStudents, setFailingStudents] = useState([]);
  const [highRiskStudents, setHighRiskStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterExamType, setFilterExamType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [filterSubject, filterExamType, filterStatus, filterSemester]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      // Build filters
      const filters = {};
      if (filterSubject) filters.subject = filterSubject;
      if (filterExamType) filters.examType = filterExamType;
      if (filterStatus) filters.status = filterStatus;
      if (filterSemester) filters.semester = filterSemester;

      // Fetch exam records
      const examResponse = await examService.getAllExams(filters);
      setExamData(examResponse.data || []);

      // Fetch statistics
      const statsResponse = await examService.getExamStats();
      setStats(statsResponse.data || null);

      // Fetch failing students
      const failingResponse = await examService.getFailingStudents();
      setFailingStudents(failingResponse.data || []);

      // Fetch high-risk students
      const highRiskResponse = await examService.getHighRiskStudents();
      setHighRiskStudents(highRiskResponse.data || []);

      // Fetch subjects for filter
      const subjectsResponse = await examService.getSubjects();
      setSubjects(subjectsResponse.data || []);

      // Fetch exam types for filter
      const typesResponse = await examService.getExamTypes();
      setExamTypes(typesResponse.data || []);
    } catch (err) {
      console.error('Error fetching exam data:', err);
      setError('Failed to load exam data. Please try again.');
      setExamData([]);
      setFailingStudents([]);
      setHighRiskStudents([]);
      setSubjects([]);
      setExamTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = examData.filter((record) => {
    const matchesSearch =
      record.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.examName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    if (status === 'Pass') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          PASS
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        FAIL
      </span>
    );
  };

  const getGradeBadge = (grade) => {
    const gradeColors = {
      'A+': 'bg-green-100 text-green-800',
      A: 'bg-green-100 text-green-800',
      'A-': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      B: 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      C: 'bg-yellow-100 text-yellow-800',
      'C-': 'bg-yellow-100 text-yellow-800',
      D: 'bg-orange-100 text-orange-800',
      F: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${gradeColors[grade] || ''}`}>
        {grade}
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
      accessor: 'student',
      render: (row) => row.student?.name || 'N/A',
    },
    {
      header: 'Exam Name',
      accessor: 'examName',
    },
    {
      header: 'Subject',
      accessor: 'subject',
    },
    {
      header: 'Exam Type',
      accessor: 'examType',
    },
    {
      header: 'Marks',
      accessor: 'obtainedMarks',
      render: (row) => `${row.obtainedMarks}/${row.totalMarks}`,
    },
    {
      header: 'Percentage',
      accessor: 'percentage',
      render: (row) => (
        <span className="font-semibold">{row.percentage?.toFixed(2)}%</span>
      ),
    },
    {
      header: 'Grade',
      accessor: 'grade',
      render: (row) => getGradeBadge(row.grade),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status),
    },
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="exam-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Exam Performance Analysis</h1>
          <p className="page-description">Monitor exam scores and student performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export Results
          </Button>
          <Button variant="primary" icon={Plus}>
            Add Exam
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Exams"
            value={stats.totalExams || 0}
            icon={FileText}
            color="primary"
          />
          <StatCard
            title="Average Score"
            value={`${stats.avgPercentage?.toFixed(1)}%`}
            icon={BarChart3}
            color="info"
          />
          <StatCard
            title="Passed Exams"
            value={stats.passCount || 0}
            subtitle={`${stats.passRate?.toFixed(1)}% pass rate`}
            icon={Award}
            color="success"
          />
          <StatCard
            title="Failed Exams"
            value={stats.failCount || 0}
            subtitle="Require attention"
            icon={TrendingDown}
            color="danger"
          />
        </div>
      )}

      {/* Alert for failing students */}
      {failingStudents.length > 0 && (
        <Alert
          type="warning"
          message={`${failingStudents.length} student(s) have failed exams and require immediate attention.`}
        />
      )}

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-filter-wrapper">
          {/* Search */}
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by student ID, name, exam, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Subject Filter */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Filter */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterExamType}
              onChange={(e) => setFilterExamType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Exam Types</option>
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="filter-select"
            >
              <option value="">All Semesters</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exam Performance Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Exam Records ({filteredData.length})
          </h2>
        </div>
        {filteredData.length > 0 ? (
          <Table columns={columns} data={filteredData} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No exam records found. Try adjusting your filters.
          </div>
        )}
      </Card>

      {/* High Risk Students */}
      {highRiskStudents.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              High-Risk Students ({highRiskStudents.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Students with low average scores or multiple failures
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
                      Avg Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Failed Exams
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Low Score Exams
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {highRiskStudents.map((student) => (
                    <tr key={student.studentId}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {student.department}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="font-semibold text-red-600">
                          {student.avgPercentage?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {student.failedExams || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {student.lowScoreExams || 0}
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

export default ExamPerformance;
