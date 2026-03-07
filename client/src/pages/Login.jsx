import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const TERMS_ITEMS = [
  { key: 1, b: 'Confidentiality:', text: 'All student and institutional data accessed through this system is confidential and must be handled responsibly.' },
  { key: 2, b: 'Authorised use only:', text: 'You may use this system solely for legitimate academic and administrative purposes.' },
  { key: 3, b: 'Audit trail:', text: 'All actions are logged and may be reviewed by system administrators.' },
  { key: 4, b: 'Data protection:', text: 'Unauthorised disclosure of data is a violation of institutional policy and applicable law.' },
  { key: 5, b: 'Account security:', text: 'You are responsible for keeping your credentials secure and for all activity under your account.' },
  { key: 6, b: 'Reporting:', text: 'Suspected misconduct must be reported through official institutional channels.' },
  { key: 7, b: 'Misuse:', text: 'Misuse of this system may result in account suspension and disciplinary action.' },
];

const Login = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showTerms, setShowTerms]     = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!termsChecked) {
      setError('You must accept the Terms and Conditions to continue');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
    }
  };

  const toggleTermsCheck = () => {
    setTermsChecked((v) => !v);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Left: name only ── */}
        <div className="auth-left">
          <span className="auth-left-name">Academi&shy;Guard</span>
        </div>

        {/* ── Right: form ── */}
        <div className="auth-right">
          <div className="auth-form-header">
            <h1>Sign in</h1>
            <p>Enter your credentials to access your account</p>
          </div>

          {justRegistered && (
            <div className="auth-alert auth-alert-success" role="status">
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              <span>Account created! Please sign in to continue.</span>
            </div>
          )}

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email */}
            <div className="field-group">
              <label htmlFor="login-email" className="field-label">Email address</label>
              <div className="field-input-wrap">
                <Mail className="field-icon" size={16} />
                <input
                  type="email"
                  id="login-email"
                  className="field-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-group">
              <label htmlFor="login-password" className="field-label">Password</label>
              <div className="field-input-wrap">
                <Lock className="field-icon" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="field-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="field-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions checkbox */}
            <div>
              <label
                className={`terms-row${termsChecked ? ' terms-checked' : ''}`}
                onClick={toggleTermsCheck}
              >
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={toggleTermsCheck}
                  aria-label="Accept Terms and Conditions"
                />
                <span className="terms-checkbox">
                  <Check size={11} className="terms-check-icon" strokeWidth={3} />
                </span>
                <span className="terms-text">
                  I agree to the{' '}
                  <button
                    type="button"
                    className="terms-link"
                    onClick={(e) => { e.stopPropagation(); setShowTerms((v) => !v); }}
                    aria-expanded={showTerms}
                  >
                    Terms and Conditions
                  </button>
                </span>
              </label>

              {/* Inline expandable T&C */}
              {showTerms && (
                <div className="terms-accordion" role="region" aria-label="Terms and Conditions">
                  <h4>Academic Integrity &amp; System Usage Policy</h4>
                  <ul>
                    {TERMS_ITEMS.map(({ key, b, text }) => (
                      <li key={key}>
                        <strong>{b}</strong> {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !termsChecked}
            >
              {loading ? (
                <span className="btn-spinner-wrap">
                  <span className="btn-spinner" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-switch-link">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
