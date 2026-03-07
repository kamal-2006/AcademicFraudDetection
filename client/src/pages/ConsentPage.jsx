import { useState } from 'react';
import { Shield, CheckCircle, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const ConsentPage = () => {
  const { user, giveConsent, logout } = useAuth();
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    if (!checked) return;
    giveConsent();
  };

  const handleDecline = async () => {
    await logout();
  };

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'User';

  return (
    <div className="consent-page">
      <div className="consent-card">
        {/* Header */}
        <div className="consent-header">
          <div className="consent-icon">
            <Shield size={30} />
          </div>
          <h1>Academic Integrity Policy</h1>
          <p>Please read and acknowledge the following before accessing the system</p>
        </div>

        {/* Body */}
        <div className="consent-body">
          <div className="consent-user-badge">
            Signed in as&nbsp;<strong>{user?.name}</strong>&nbsp;·&nbsp;{roleLabel}
          </div>

          <div className="consent-policy">
            <h3>System Usage Agreement</h3>
            <p>
              By accessing the Academic Fraud Detection System, you agree to the
              following terms and conditions:
            </p>
            <ul className="consent-list">
              <li>
                All student data accessed through this system is{' '}
                <strong>confidential</strong> and must be handled responsibly.
              </li>
              <li>
                You will use this system solely for{' '}
                <strong>legitimate academic oversight</strong> purposes.
              </li>
              <li>
                All actions performed within this system are{' '}
                <strong>logged and auditable</strong> by administrators.
              </li>
              <li>
                Unauthorized disclosure of student data is a{' '}
                <strong>violation of institutional policy</strong> and applicable
                laws.
              </li>
              <li>
                You are responsible for maintaining the{' '}
                <strong>security of your account credentials</strong>.
              </li>
              <li>
                Any suspected fraud or misconduct must be reported through{' '}
                <strong>official institutional channels</strong>.
              </li>
              <li>
                Misuse of this system may result in{' '}
                <strong>disciplinary action</strong> including account suspension.
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <label
            className={`consent-checkbox-wrap${checked ? ' is-checked' : ''}`}
            onClick={() => setChecked((v) => !v)}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              aria-label="I agree to the terms"
            />
            <span className="checkbox-custom">
              <Check size={12} className="checkbox-checkmark" strokeWidth={3} />
            </span>
            <span className="checkbox-label">
              I have read and agree to the Academic Integrity Policy and System
              Usage Agreement
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="consent-actions">
          <button
            className="consent-btn-decline"
            onClick={handleDecline}
            type="button"
          >
            <LogOut size={15} />
            Decline &amp; Sign Out
          </button>
          <button
            className="consent-btn-accept"
            onClick={handleAccept}
            disabled={!checked}
            type="button"
          >
            <CheckCircle size={15} />
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentPage;
