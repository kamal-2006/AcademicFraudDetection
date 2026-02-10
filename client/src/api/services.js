import api from './axios';

// Authentication services
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Dashboard services
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

// Student services
export const studentService = {
  getAllStudents: async () => {
    const response = await api.get('/students');
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
};

// Attendance services
export const attendanceService = {
  // Get all attendance records with filters
  getAllAttendance: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/attendance?${params}`);
    return response.data;
  },

  // Get attendance by student ID
  getStudentAttendance: async (studentId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/attendance/student/${studentId}?${params}`);
    return response.data;
  },

  // Create attendance record
  createAttendance: async (data) => {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  // Update attendance record
  updateAttendance: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  // Delete attendance record
  deleteAttendance: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  // Get attendance statistics
  getAttendanceStats: async () => {
    const response = await api.get('/attendance/stats/overview');
    return response.data;
  },

  // Get low attendance students
  getLowAttendanceStudents: async (threshold = 75) => {
    const response = await api.get(`/attendance/stats/low-attendance?threshold=${threshold}`);
    return response.data;
  },

  // Get subjects list
  getSubjects: async () => {
    const response = await api.get('/attendance/filters/subjects');
    return response.data;
  },
};

// Exam services
export const examService = {
  // Get all exam records with filters
  getAllExams: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/exams?${params}`);
    return response.data;
  },

  // Get exams by student ID
  getStudentExams: async (studentId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/exams/student/${studentId}?${params}`);
    return response.data;
  },

  // Create exam record
  createExam: async (data) => {
    const response = await api.post('/exams', data);
    return response.data;
  },

  // Update exam record
  updateExam: async (id, data) => {
    const response = await api.put(`/exams/${id}`, data);
    return response.data;
  },

  // Delete exam record
  deleteExam: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },

  // Get exam statistics
  getExamStats: async () => {
    const response = await api.get('/exams/stats/overview');
    return response.data;
  },

  // Get failing students
  getFailingStudents: async () => {
    const response = await api.get('/exams/stats/failing');
    return response.data;
  },

  // Get high-risk students
  getHighRiskStudents: async () => {
    const response = await api.get('/exams/stats/high-risk');
    return response.data;
  },

  // Get subjects list
  getSubjects: async () => {
    const response = await api.get('/exams/filters/subjects');
    return response.data;
  },

  // Get exam types list
  getExamTypes: async () => {
    const response = await api.get('/exams/filters/exam-types');
    return response.data;
  },
};

// Plagiarism services
export const plagiarismService = {
  getAllPlagiarismCases: async () => {
    const response = await api.get('/plagiarism');
    return response.data;
  },

  getPlagiarismById: async (id) => {
    const response = await api.get(`/plagiarism/${id}`);
    return response.data;
  },
};

// Fraud Report services
export const fraudReportService = {
  getAllReports: async (params = {}) => {
    const response = await api.get('/fraud-reports', { params });
    return response.data;
  },

  getReportById: async (id) => {
    const response = await api.get(`/fraud-reports/${id}`);
    return response.data;
  },

  updateReport: async (id, data) => {
    const response = await api.put(`/fraud-reports/${id}`, data);
    return response.data;
  },

  createReport: async (reportData) => {
    const response = await api.post('/fraud-reports', reportData);
    return response.data;
  },

  deleteReport: async (id) => {
    const response = await api.delete(`/fraud-reports/${id}`);
    return response.data;
  },

  getStatistics: async (params = {}) => {
    const response = await api.get('/fraud-reports/statistics/summary', { params });
    return response.data;
  },

  exportCSV: async (params = {}) => {
    const response = await api.get('/fraud-reports/export/csv', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportJSON: async (params = {}) => {
    const response = await api.get('/fraud-reports/export/json', { params });
    return response.data;
  },
};
