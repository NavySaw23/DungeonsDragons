import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/Register.css';
import BG_UI from '../../assets/login_bg.svg';
import dnd_logo from '../../assets/logo_dnd.svg';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { username, email, password, confirmPassword } = formData;
  const navigate = useNavigate();
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register({ username, email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!authLoading && isAuthenticated)) {
    return <div className="register-loading">Loading...</div>;
  }

  return (
    <div className="register-container">
      <div className="register-left-container">
        <img src={BG_UI} alt="Background Illustration" className="register-svg-illustration" />
      </div>

      <div className="register-right-container">
        <div className="register-black-box">
          <img src={dnd_logo} alt="DND Logo" className="register-logo-dnd" />
          <h1 className="register-title">Register</h1>
          {error && <div className="register-error-message" role="alert">{error}</div>}

          <form onSubmit={onSubmit} className="register-form">
            <div className="register-form-group">
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={onChange}
                className="register-form-input"
                placeholder="Username"
                required
                disabled={loading}
                minLength="3"
              />
            </div>

            <div className="register-form-group">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                className="register-form-input"
                placeholder="Email"
                required
                disabled={loading}
              />
            </div>

            <div className="register-form-group">
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                className="register-form-input"
                placeholder="Password"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <div className="register-form-group">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                className="register-form-input"
                placeholder="Confirm Password"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <button type="submit" className="register-submit-button" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="register-auth-link">
            Already have an account? <Link to="/login" className="register-auth-link-text">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;