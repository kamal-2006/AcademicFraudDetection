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
  getAllAttendance: async () => {
    const response = await api.get('/attendance');
    return response.data;
  },

  getStudentAttendance: async (studentId) => {
    const response = await api.get(`/attendance/${studentId}`);
    return response.data;
  },
};

// Exam services
export const examService = {
  getAllExams: async () => {
    const response = await api.get('/exams/performance');
    return response.data;
  },

  getExamById: async (id) => {
    const response = await api.get(`/exams/${id}`);
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
  getAllReports: async () => {
    const response = await api.get('/fraud-reports');
    return response.data;
  },

  getReportById: async (id) => {
    const response = await api.get(`/fraud-reports/${id}`);
    return response.data;
  },

  updateReportStatus: async (id, status) => {
    const response = await api.patch(`/fraud-reports/${id}/status`, { status });
    return response.data;
  },

  createReport: async (reportData) => {
    const response = await api.post('/fraud-reports', reportData);
    return response.data;
  },
};
