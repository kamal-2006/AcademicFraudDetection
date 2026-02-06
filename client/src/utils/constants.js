// Risk levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Fraud types
export const FRAUD_TYPES = {
  ATTENDANCE: 'attendance',
  EXAM_ANOMALY: 'exam_anomaly',
  PLAGIARISM: 'plagiarism',
  PERFORMANCE_SPIKE: 'performance_spike',
};

// Status types
export const STATUS_TYPES = {
  PENDING: 'pending',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

// Risk level colors for UI
export const RISK_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

// Status colors for UI
export const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};
