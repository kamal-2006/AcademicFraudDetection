import { RISK_COLORS } from '../utils/constants';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
};

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-purple-100 text-purple-600',
  };

  const borderColors = {
    primary: 'border-blue-400',
    success: 'border-green-400',
    warning: 'border-yellow-400',
    danger: 'border-red-400',
    info: 'border-purple-400',
  };

  const textColors = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-purple-600',
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${borderColors[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${textColors[color]} mb-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export const AlertCard = ({ type, title, message, count, onClick }) => {
  return (
    <div className={`alert-card ${type}`} onClick={onClick}>
      <div className="alert-card-header">
        <h4 className="alert-card-title">{title}</h4>
        {count > 0 && <span className="alert-card-count">{count}</span>}
      </div>
      <p className="alert-card-message">{message}</p>
    </div>
  );
};

export const RiskBadge = ({ level }) => {
  return (
    <span className={`risk-badge ${level}`}>
      {level.toUpperCase()}
    </span>
  );
};

export default Card;
