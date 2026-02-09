import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Upload, X } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { RiskBadge } from '../components/Card';
import api from '../api/axios';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/students');
      // API returns { success, data, pagination }
      setStudents(response.data.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Showing mock data.');
      // Mock data if API fails
      setStudents([
        {
          id: 1,
          studentId: 'STU001',
          name: 'John Doe',
          email: 'john.doe@university.edu',
          department: 'Computer Science',
          year: '3rd Year',
          gpa: 3.5,
          attendance: 85,
          riskLevel: 'low',
        },
        {
          id: 2,
          studentId: 'STU002',
          name: 'Jane Smith',
          email: 'jane.smith@university.edu',
          department: 'Engineering',
          year: '2nd Year',
          gpa: 2.8,
          attendance: 65,
          riskLevel: 'medium',
        },
        {
          id: 3,
          studentId: 'STU003',
          name: 'Mike Johnson',
          email: 'mike.j@university.edu',
          department: 'Computer Science',
          year: '4th Year',
          gpa: 2.0,
          attendance: 45,
          riskLevel: 'high',
        },
        {
          id: 4,
          studentId: 'STU004',
          name: 'Sarah Williams',
          email: 'sarah.w@university.edu',
          department: 'Mathematics',
          year: '1st Year',
          gpa: 3.8,
          attendance: 92,
          riskLevel: 'low',
        },
        {
          id: 5,
          studentId: 'STU005',
          name: 'David Brown',
          email: 'david.b@university.edu',
          department: 'Physics',
          year: '3rd Year',
          gpa: 1.8,
          attendance: 35,
          riskLevel: 'critical',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        setSelectedFile(null);
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadCSV = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/students/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`Successfully uploaded ${response.data.summary.successful} students`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the student list
      await fetchStudents();
    } catch (err) {
      console.error('Error uploading CSV:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.join(', ');
        setError(`Upload failed: ${errorMessages}`);
      } else {
        setError('Failed to upload CSV file. Please check the format and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterRisk === 'all' || student.riskLevel === filterRisk;

    return matchesSearch && matchesFilter;
  });

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
      header: 'Department',
      accessor: 'department',
    },
    {
      header: 'Year',
      accessor: 'year',
    },
    {
      header: 'GPA',
      accessor: 'gpa',
      render: (row) => row.gpa.toFixed(2),
    },
    {
      header: 'Attendance',
      accessor: 'attendance',
      render: (row) => `${row.attendance}%`,
    },
    {
      header: 'Risk Level',
      accessor: 'riskLevel',
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
  ];

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="students-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Student Management</h1>
        <p className="page-description">View and manage student information</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* CSV Upload Section */}
      <div className="upload-section">
        <div className="upload-wrapper">
          <div className="upload-header">
            <Upload className="upload-icon" />
            <div>
              <h3 className="upload-title">Upload Student Data</h3>
              <p className="upload-description">Upload a CSV file with student information</p>
            </div>
          </div>
          <div className="upload-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="file-input"
              id="csv-upload"
              disabled={uploading}
            />
            <label htmlFor="csv-upload" className="file-label">
              {selectedFile ? 'Change File' : 'Choose CSV File'}
            </label>
            {selectedFile && (
              <div className="selected-file">
                <span className="file-name">{selectedFile.name}</span>
                <button
                  onClick={handleCancelFile}
                  className="cancel-file-btn"
                  disabled={uploading}
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <Button
              onClick={handleUploadCSV}
              disabled={!selectedFile || uploading}
              variant="primary"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          <div className="upload-info">
            <p className="info-text">
              <strong>CSV Format:</strong> Student ID, Name, Email, Department, Year, GPA, Attendance
            </p>
            <p className="info-text">
              <strong>Note:</strong> Maximum file size is 5MB. Duplicate records will be skipped.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-filter-wrapper">
          {/* Search */}
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filter by Risk */}
          <div className="filter-wrapper">
            <Filter className="filter-icon" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="students-table-container">
        <div className="students-table-header">
          <h2 className="students-table-title">
            Students ({filteredStudents.length})
          </h2>
        </div>
        <Table columns={columns} data={filteredStudents} />
      </div>
    </div>
  );
};

export default Students;
