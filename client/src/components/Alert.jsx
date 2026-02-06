import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";

const Alert = ({ type = "info", message, onClose, className = "" }) => {
  const types = {
    success: {
      icon: CheckCircle,
    },
    error: {
      icon: XCircle,
    },
    warning: {
      icon: AlertCircle,
    },
    info: {
      icon: Info,
    },
  };

  const Icon = types[type]?.icon || Info;

  return (
    <div className={`alert-component ${type} ${className}`}>
      <Icon className="alert-icon" />

      <p className="alert-message">{message}</p>

      {onClose && (
        <button
          onClick={onClose}
          className="alert-close"
          aria-label="Close alert"
        >
          <X className="alert-close-icon" />
        </button>
      )}
    </div>
  );
};

export default Alert;
