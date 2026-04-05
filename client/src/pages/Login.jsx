import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, CheckCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TERMS_ITEMS = [
  { key: 1, b: 'Confidentiality:', text: 'All student and institutional data accessed through this system is confidential and must be handled responsibly.' },
  { key: 2, b: 'Authorised use only:', text: 'You may use this system solely for legitimate academic and administrative purposes.' },
  { key: 3, b: 'Audit trail:', text: 'All actions are logged and may be reviewed by system administrators.' },
  { key: 4, b: 'Data protection:', text: 'Unauthorised disclosure of data is a violation of institutional policy and applicable law.' },
  { key: 5, b: 'Account security:', text: 'You are responsible for keeping your credentials secure and for all activity under your account.' },
  { key: 6, b: 'Reporting:', text: 'Suspected misconduct must be reported through official institutional channels.' },
  { key: 7, b: 'Misuse:', text: 'Misuse of this system may result in account suspension and disciplinary action.' },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ag-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0ede8;
    font-family: 'DM Sans', sans-serif;
    padding: 24px;
  }

  .ag-card {
    display: flex;
    width: 100%;
    max-width: 940px;
    min-height: 620px;
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.06),
      0 24px 64px rgba(0,0,0,0.12),
      0 4px 16px rgba(0,0,0,0.06);
  }

  /* ── LEFT PANEL ── */
  .ag-left {
    width: 42%;
    background: #0d1f2d;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 36px;
    position: relative;
    overflow: hidden;
    gap: 0;
  }

  .ag-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,160,130,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(99,160,130,0.10) 0%, transparent 60%);
    pointer-events: none;
  }

  /* decorative grid lines */
  .ag-left::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .ag-logo-wrap {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    width: 100%;
  }

  /* Full image display — circular frame */
  .ag-logo-ring {
    width: 164px;
    height: 164px;
    border-radius: 50%;
    border: 2px solid rgba(99,160,130,0.4);
    box-shadow:
      0 0 0 8px rgba(99,160,130,0.08),
      0 0 48px rgba(99,160,130,0.15);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.04);
    flex-shrink: 0;
    margin-bottom: 28px;
  }

  .ag-logo-ring img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .ag-brand-name {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    color: #fff;
    letter-spacing: -0.3px;
    margin-bottom: 4px;
    text-align: center;
  }

  .ag-tagline {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-bottom: 36px;
    text-align: center;
  }

  .ag-divider {
    width: 40px;
    height: 1px;
    background: rgba(99,160,130,0.5);
    margin-bottom: 32px;
  }

  .ag-features {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
  }

  .ag-feature {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    font-weight: 400;
    letter-spacing: 0.1px;
  }

  .ag-feature-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #63a082;
    flex-shrink: 0;
    box-shadow: 0 0 6px rgba(99,160,130,0.6);
  }

  /* ── RIGHT PANEL ── */
  .ag-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 52px 48px;
    overflow-y: auto;
  }

  .ag-form-header {
    margin-bottom: 32px;
  }

  .ag-form-header h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    color: #0d1f2d;
    font-weight: 400;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .ag-form-header p {
    font-size: 13.5px;
    color: #8a9099;
    font-weight: 400;
  }

  /* Alerts */
  .ag-alert {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 20px;
    line-height: 1.4;
  }

  .ag-alert-success {
    background: #f0faf5;
    border: 1px solid #b8e4cc;
    color: #1a6840;
  }

  .ag-alert-error {
    background: #fff5f5;
    border: 1px solid #fcc;
    color: #b82c2c;
  }

  /* Fields */
  .ag-form { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; }

  .ag-field { display: flex; flex-direction: column; gap: 6px; }

  .ag-label {
    font-size: 12.5px;
    font-weight: 600;
    color: #3a4550;
    letter-spacing: 0.2px;
  }

  .ag-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .ag-input-icon {
    position: absolute;
    left: 13px;
    color: #a0aab4;
    pointer-events: none;
    display: flex;
  }

  .ag-input {
    width: 100%;
    padding: 11px 40px 11px 38px;
    border: 1.5px solid #e4e8ec;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #0d1f2d;
    background: #fafbfc;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    outline: none;
  }

  .ag-input::placeholder { color: #b8bec5; }

  .ag-input:focus {
    border-color: #63a082;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(99,160,130,0.12);
  }

  .ag-input:disabled { opacity: 0.6; cursor: not-allowed; }

  .ag-input.ag-input-error {
    border-color: #d96b6b;
    background: #fff9f9;
    box-shadow: 0 0 0 3px rgba(217,107,107,0.12);
  }

  .ag-inline-error {
    margin-top: -8px;
    margin-bottom: -2px;
    display: flex;
    align-items: flex-start;
    gap: 7px;
    font-size: 12.5px;
    color: #b82c2c;
    background: #fff5f5;
    border: 1px solid #fcc;
    border-radius: 8px;
    padding: 8px 10px;
    line-height: 1.35;
  }

  .ag-toggle {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: #a0aab4;
    display: flex;
    padding: 2px;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .ag-toggle:hover { color: #63a082; }

  /* Terms */
  .ag-terms-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    padding: 2px 0;
  }

  .ag-terms-row input[type="checkbox"] { display: none; }

  .ag-checkbox {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 1.5px solid #d0d8e0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    transition: all 0.18s;
    background: #fafbfc;
  }

  .ag-terms-row.checked .ag-checkbox {
    background: #63a082;
    border-color: #63a082;
    box-shadow: 0 0 0 3px rgba(99,160,130,0.15);
  }

  .ag-check-icon { color: #fff; opacity: 0; transition: opacity 0.15s; }
  .ag-terms-row.checked .ag-check-icon { opacity: 1; }

  .ag-terms-text {
    font-size: 13px;
    color: #5a6472;
    line-height: 1.5;
  }

  .ag-terms-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    color: #63a082;
    font-weight: 600;
    padding: 0;
    text-decoration: underline;
    text-decoration-color: rgba(99,160,130,0.35);
    transition: color 0.15s;
  }

  .ag-terms-btn:hover { color: #4a8a68; }

  /* Accordion */
  .ag-accordion {
    margin-top: 12px;
    background: #f8faf9;
    border: 1px solid #d4e8dd;
    border-radius: 10px;
    padding: 16px 18px;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ag-accordion h4 {
    font-family: 'DM Serif Display', serif;
    font-size: 13px;
    color: #1a4430;
    margin-bottom: 10px;
    font-weight: 400;
    letter-spacing: 0.2px;
  }

  .ag-accordion ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .ag-accordion li {
    font-size: 12px;
    color: #4a6255;
    line-height: 1.55;
    padding-left: 10px;
    border-left: 2px solid rgba(99,160,130,0.3);
  }

  /* Submit button */
  .ag-submit {
    width: 100%;
    padding: 13px;
    background: #0d1f2d;
    color: #fff;
    border: none;
    border-radius: 11px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.2px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .ag-submit:hover:not(:disabled) {
    background: #162d40;
    box-shadow: 0 8px 24px rgba(13,31,45,0.28);
    transform: translateY(-1px);
  }

  .ag-submit:active:not(:disabled) { transform: translateY(0); }

  .ag-submit:disabled {
    background: #c8d0d8;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .ag-spinner-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }

  .ag-spinner {
    width: 15px;
    height: 15px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Footer */
  .ag-switch {
    text-align: center;
    font-size: 13px;
    color: #8a9099;
  }

  .ag-switch a {
    color: #63a082;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.15s;
  }

  .ag-switch a:hover { color: #4a8a68; text-decoration: underline; }

  /* Responsive */
  @media (max-width: 680px) {
    .ag-left { display: none; }
    .ag-right { padding: 40px 28px; }
    .ag-card { max-width: 420px; }
  }
`;

const Login = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showTerms, setShowTerms]       = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const isEmailValid = (value) => /^\S+@\S+\.\S+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) { setError('Please fill in all fields.'); return; }
    if (!isEmailValid(trimmedEmail)) { setError('Please enter a valid email address.'); return; }
    if (!termsChecked) { setError('You must accept the Terms and Conditions to continue'); return; }

    setLoading(true);
    const result = await login(trimmedEmail, password);
    if (!result.success) {
      const normalizedMessage = /invalid|credential|email|password|unauthorized|401/i.test(result.message)
        ? 'Invalid email or password'
        : result.message;
      setError(normalizedMessage);
      setLoading(false);
    }
  };

  const toggleTerms = () => { setTermsChecked(v => !v); setError(''); };

  return (
    <>
      <style>{styles}</style>
      <div className="ag-page">
        <div className="ag-card">

          {/* ── LEFT ── */}
          <div className="ag-left">
            <div className="ag-logo-wrap">
              <div className="ag-logo-ring">
                <img src="/security.png" alt="AcademicGuard logo" />
              </div>
              <span className="ag-brand-name">AcademicGuard</span>
              <span className="ag-tagline">Integrity · Security · Trust</span>
              <div className="ag-divider" />
              <div className="ag-features">
                {['Real-time fraud detection', 'AI-powered proctoring', 'Plagiarism analysis'].map(f => (
                  <div className="ag-feature" key={f}>
                    <span className="ag-feature-dot" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="ag-right">
            <div className="ag-form-header">
              <h1>Sign in</h1>
              <p>Enter your credentials to access your account</p>
            </div>

            {justRegistered && (
              <div className="ag-alert ag-alert-success" role="status">
                <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Account created! Please sign in to continue.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="ag-form" noValidate>
              {/* Email */}
              <div className="ag-field">
                <label htmlFor="login-email" className="ag-label">Email address</label>
                <div className="ag-input-wrap">
                  <span className="ag-input-icon"><Mail size={15} /></span>
                  <input
                    type="email" id="login-email" className={`ag-input${error ? ' ag-input-error' : ''}`}
                    placeholder="you@example.com" value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    disabled={loading} autoComplete="email" autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="ag-field">
                <label htmlFor="login-password" className="ag-label">Password</label>
                <div className="ag-input-wrap">
                  <span className="ag-input-icon"><Lock size={15} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'} id="login-password"
                    className={`ag-input${error ? ' ag-input-error' : ''}`} placeholder="Enter your password" value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    disabled={loading} autoComplete="current-password"
                  />
                  <button
                    type="button" className="ag-toggle" tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="ag-inline-error" role="alert" aria-live="polite">
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Terms */}
              <div>
                <label className={`ag-terms-row${termsChecked ? ' checked' : ''}`} onClick={toggleTerms}>
                  <input type="checkbox" checked={termsChecked} onChange={toggleTerms} />
                  <span className="ag-checkbox">
                    <Check size={10} className="ag-check-icon" strokeWidth={3} />
                  </span>
                  <span className="ag-terms-text">
                    I agree to the{' '}
                    <button
                      type="button" className="ag-terms-btn"
                      onClick={e => { e.stopPropagation(); setShowTerms(v => !v); }}
                    >
                      Terms and Conditions
                    </button>
                  </span>
                </label>

                {showTerms && (
                  <div className="ag-accordion" role="region" aria-label="Terms and Conditions">
                    <h4>Academic Integrity &amp; System Usage Policy</h4>
                    <ul>
                      {TERMS_ITEMS.map(({ key, b, text }) => (
                        <li key={key}><strong>{b}</strong> {text}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button type="submit" className="ag-submit" disabled={loading || !termsChecked}>
                {loading ? (
                  <span className="ag-spinner-wrap">
                    <span className="ag-spinner" />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="ag-switch">
              Don&apos;t have an account?{' '}
              <Link to="/register">Create account</Link>
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;