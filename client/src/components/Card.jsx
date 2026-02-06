import { RISK_COLORS } from '../utils/constants';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
};

export const StatCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-label">{title}</div>
        <div className="stat-card-value">{value}</div>
        {trend && (
          <div className={`stat-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.value}
          </div>
        )}
      </div>
      <div className={`stat-card-icon ${color}`}>
        <Icon />
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
