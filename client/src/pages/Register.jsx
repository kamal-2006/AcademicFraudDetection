import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Eye, EyeOff,
  GraduationCap, Briefcase, AlertCircle, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    max-width: 980px;
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
    width: 38%;
    background: #0d1f2d;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 36px;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
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
    width: 100%;
  }

  .ag-logo-ring {
    width: 156px;
    height: 156px;
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
    font-size: 24px;
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
    padding: 44px 48px;
    overflow-y: auto;
  }

  .ag-form-header {
    margin-bottom: 24px;
  }

  .ag-form-header h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 30px;
    color: #0d1f2d;
    font-weight: 400;
    letter-spacing: -0.5px;
    margin-bottom: 5px;
  }

  .ag-form-header p {
    font-size: 13.5px;
    color: #8a9099;
  }

  /* Role selector */
  .ag-role-label {
    font-size: 12.5px;
    font-weight: 600;
    color: #3a4550;
    letter-spacing: 0.2px;
    display: block;
    margin-bottom: 10px;
  }

  .ag-role-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 22px;
  }

  .ag-role-card {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 13px 15px;
    border: 1.5px solid #e4e8ec;
    border-radius: 11px;
    background: #fafbfc;
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .ag-role-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(99,160,130,0.07), transparent);
    opacity: 0;
    transition: opacity 0.18s;
  }

  .ag-role-card:hover {
    border-color: #b8d9c9;
    box-shadow: 0 2px 8px rgba(99,160,130,0.1);
  }

  .ag-role-card:hover::before { opacity: 1; }

  .ag-role-card.active {
    border-color: #63a082;
    background: #f0faf5;
    box-shadow: 0 0 0 3px rgba(99,160,130,0.12);
  }

  .ag-role-card.active::before { opacity: 1; }

  .ag-role-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(13,31,45,0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #5a7080;
    flex-shrink: 0;
    transition: all 0.18s;
  }

  .ag-role-card.active .ag-role-icon {
    background: #63a082;
    color: #fff;
  }

  .ag-role-info { flex: 1; min-width: 0; }

  .ag-role-title {
    display: block;
    font-size: 13.5px;
    font-weight: 600;
    color: #0d1f2d;
    margin-bottom: 1px;
  }

  .ag-role-desc {
    display: block;
    font-size: 11.5px;
    color: #8a9099;
  }

  .ag-role-check {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid #d0d8e0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.18s;
    margin-left: auto;
  }

  .ag-role-card.active .ag-role-check {
    background: #63a082;
    border-color: #63a082;
  }

  .ag-role-check-icon { color: #fff; opacity: 0; transition: opacity 0.15s; }
  .ag-role-card.active .ag-role-check-icon { opacity: 1; }

  /* Alert */
  .ag-alert {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 18px;
    line-height: 1.4;
  }

  .ag-alert-error {
    background: #fff5f5;
    border: 1px solid #fcc;
    color: #b82c2c;
  }

  /* Form */
  .ag-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 22px; }

  .ag-field { display: flex; flex-direction: column; gap: 5px; }

  .ag-label {
    font-size: 12.5px;
    font-weight: 600;
    color: #3a4550;
    letter-spacing: 0.2px;
  }

  .ag-label-opt {
    font-weight: 400;
    color: #a0aab4;
    font-size: 12px;
    margin-left: 4px;
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

  /* Two-column row for passwords */
  .ag-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  /* Submit */
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

  @media (max-width: 720px) {
    .ag-left { display: none; }
    .ag-right { padding: 36px 24px; }
    .ag-row { grid-template-columns: 1fr; }
    .ag-role-wrap { grid-template-columns: 1fr; }
  }
`;

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', studentId: '', department: '',
  });
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!formData.name.trim() || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields'); return false;
    }
    if (formData.name.trim().length < 2) { setError('Name must be at least 2 characters'); return false; }
    if (formData.password.length < 6)    { setError('Password must be at least 6 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    const result = await register(
      formData.name.trim(), formData.email.trim(), formData.password, selectedRole,
      { studentId: formData.studentId.trim() || undefined, department: formData.department.trim() || undefined },
    );
    if (result.success) { navigate('/login?registered=true'); }
    else { setError(result.message); setLoading(false); }
  };

  const roles = [
    { id: 'student', icon: <GraduationCap size={17} />, title: 'Student', desc: 'View your academic data' },
    { id: 'faculty', icon: <Briefcase size={17} />,     title: 'Faculty', desc: 'Monitor & manage data'  },
  ];

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
                {['Secure account creation', 'Role-based access control', 'Full audit-trail logging'].map(f => (
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
              <h1>Create account</h1>
              <p>Fill in your details to get started</p>
            </div>

            {/* Role selector */}
            <span className="ag-role-label">Select your role</span>
            <div className="ag-role-wrap">
              {roles.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`ag-role-card${selectedRole === r.id ? ' active' : ''}`}
                  onClick={() => { setSelectedRole(r.id); setError(''); }}
                >
                  <div className="ag-role-icon">{r.icon}</div>
                  <div className="ag-role-info">
                    <span className="ag-role-title">{r.title}</span>
                    <span className="ag-role-desc">{r.desc}</span>
                  </div>
                  <div className="ag-role-check">
                    <Check size={9} className="ag-role-check-icon" strokeWidth={3} />
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="ag-alert ag-alert-error" role="alert">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="ag-form" noValidate>
              {/* Name */}
              <div className="ag-field">
                <label htmlFor="reg-name" className="ag-label">Full Name</label>
                <div className="ag-input-wrap">
                  <span className="ag-input-icon"><User size={15} /></span>
                  <input type="text" id="reg-name" name="name" className="ag-input"
                    placeholder="Your full name" value={formData.name}
                    onChange={handleChange} disabled={loading} autoComplete="name" autoFocus />
                </div>
              </div>

              {/* Email */}
              <div className="ag-field">
                <label htmlFor="reg-email" className="ag-label">Email address</label>
                <div className="ag-input-wrap">
                  <span className="ag-input-icon"><Mail size={15} /></span>
                  <input type="email" id="reg-email" name="email" className="ag-input"
                    placeholder="you@example.com" value={formData.email}
                    onChange={handleChange} disabled={loading} autoComplete="email" />
                </div>
              </div>

              {/* Role-specific optional field */}
              {selectedRole === 'student' && (
                <div className="ag-field">
                  <label htmlFor="reg-sid" className="ag-label">
                    Student ID <span className="ag-label-opt">(optional)</span>
                  </label>
                  <div className="ag-input-wrap">
                    <span className="ag-input-icon"><GraduationCap size={15} /></span>
                    <input type="text" id="reg-sid" name="studentId" className="ag-input"
                      placeholder="e.g. STU2024001" value={formData.studentId}
                      onChange={handleChange} disabled={loading} />
                  </div>
                </div>
              )}

              {selectedRole === 'faculty' && (
                <div className="ag-field">
                  <label htmlFor="reg-dept" className="ag-label">
                    Department <span className="ag-label-opt">(optional)</span>
                  </label>
                  <div className="ag-input-wrap">
                    <span className="ag-input-icon"><Briefcase size={15} /></span>
                    <input type="text" id="reg-dept" name="department" className="ag-input"
                      placeholder="e.g. Computer Science" value={formData.department}
                      onChange={handleChange} disabled={loading} />
                  </div>
                </div>
              )}

              {/* Password pair — side by side */}
              <div className="ag-row">
                <div className="ag-field">
                  <label htmlFor="reg-pw" className="ag-label">Password</label>
                  <div className="ag-input-wrap">
                    <span className="ag-input-icon"><Lock size={15} /></span>
                    <input type={showPassword ? 'text' : 'password'} id="reg-pw" name="password"
                      className="ag-input" placeholder="Min 6 chars" value={formData.password}
                      onChange={handleChange} disabled={loading} autoComplete="new-password" />
                    <button type="button" className="ag-toggle" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide' : 'Show'}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="ag-field">
                  <label htmlFor="reg-cpw" className="ag-label">Confirm Password</label>
                  <div className="ag-input-wrap">
                    <span className="ag-input-icon"><Lock size={15} /></span>
                    <input type={showConfirmPassword ? 'text' : 'password'} id="reg-cpw"
                      name="confirmPassword" className="ag-input" placeholder="Repeat password"
                      value={formData.confirmPassword} onChange={handleChange}
                      disabled={loading} autoComplete="new-password" />
                    <button type="button" className="ag-toggle" tabIndex={-1}
                      onClick={() => setShowConfirmPassword(v => !v)}
                      aria-label={showConfirmPassword ? 'Hide' : 'Show'}>
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="ag-submit" disabled={loading}>
                {loading ? (
                  <span className="ag-spinner-wrap">
                    <span className="ag-spinner" />
                    Creating account…
                  </span>
                ) : `Create ${selectedRole === 'student' ? 'Student' : 'Faculty'} Account`}
              </button>
            </form>

            <p className="ag-switch">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default Register;