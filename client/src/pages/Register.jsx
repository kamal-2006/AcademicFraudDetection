import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Eye, EyeOff,
  GraduationCap, Briefcase, AlertCircle, Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    department: '',
  });
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!formData.name.trim() || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields'); return false;
    }
    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters'); return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    const result = await register(
      formData.name.trim(),
      formData.email.trim(),
      formData.password,
      selectedRole,
      {
        studentId:  formData.studentId.trim()  || undefined,
        department: formData.department.trim() || undefined,
      },
    );

    if (result.success) {
      navigate('/login?registered=true');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--register">
      <div className="auth-card">

        {/* ── Left: name only ── */}
        <div className="auth-left">
          <span className="auth-left-name">Academi&shy;Guard</span>
        </div>

        {/* ── Right: form ── */}
        <div className="auth-right">
          <div className="auth-form-header">
            <h1>Create account</h1>
            <p>Fill in your details to get started</p>
          </div>

          {/* Role Selector */}
          <div className="role-selector" style={{ marginBottom: '1rem' }}>
            <span className="role-selector-label">Select your role</span>

            <button
              type="button"
              className={`role-card${selectedRole === 'student' ? ' role-card--active' : ''}`}
              onClick={() => setSelectedRole('student')}
            >
              <div className="role-card-icon"><GraduationCap size={18} /></div>
              <div className="role-card-text">
                <span className="role-card-title">Student</span>
                <span className="role-card-desc">View your academic data</span>
              </div>
            </button>

            <button
              type="button"
              className={`role-card${selectedRole === 'faculty' ? ' role-card--active' : ''}`}
              onClick={() => setSelectedRole('faculty')}
            >
              <div className="role-card-icon"><Briefcase size={18} /></div>
              <div className="role-card-text">
                <span className="role-card-title">Faculty</span>
                <span className="role-card-desc">Monitor &amp; manage data</span>
              </div>
            </button>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Name */}
            <div className="field-group">
              <label htmlFor="reg-name" className="field-label">Full Name</label>
              <div className="field-input-wrap">
                <User className="field-icon" size={16} />
                <input
                  type="text"
                  id="reg-name"
                  name="name"
                  className="field-input"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div className="field-group">
              <label htmlFor="reg-email" className="field-label">Email address</label>
              <div className="field-input-wrap">
                <Mail className="field-icon" size={16} />
                <input
                  type="email"
                  id="reg-email"
                  name="email"
                  className="field-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Role-specific optional field */}
            {selectedRole === 'student' && (
              <div className="field-group">
                <label htmlFor="reg-sid" className="field-label">
                  Student ID{' '}
                  <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="field-input-wrap">
                  <GraduationCap className="field-icon" size={16} />
                  <input
                    type="text"
                    id="reg-sid"
                    name="studentId"
                    className="field-input"
                    placeholder="e.g. STU2024001"
                    value={formData.studentId}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {selectedRole === 'faculty' && (
              <div className="field-group">
                <label htmlFor="reg-dept" className="field-label">
                  Department{' '}
                  <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="field-input-wrap">
                  <Briefcase className="field-icon" size={16} />
                  <input
                    type="text"
                    id="reg-dept"
                    name="department"
                    className="field-input"
                    placeholder="e.g. Computer Science"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password pair */}
            <div className="form-row">
              <div className="field-group">
                <label htmlFor="reg-pw" className="field-label">Password</label>
                <div className="field-input-wrap">
                  <Lock className="field-icon" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-pw"
                    name="password"
                    className="field-input"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="field-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide' : 'Show'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="reg-cpw" className="field-label">Confirm Password</label>
                <div className="field-input-wrap">
                  <Lock className="field-icon" size={16} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="reg-cpw"
                    name="confirmPassword"
                    className="field-input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="field-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner-wrap">
                  <span className="btn-spinner" />
                  Creating account…
                </span>
              ) : (
                `Create ${selectedRole === 'student' ? 'Student' : 'Faculty'} Account`
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
