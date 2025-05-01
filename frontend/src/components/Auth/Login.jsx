import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/Login.css';
import BG_UI from '../../assets/login_bg.svg';
import dnd_logo from '../../assets/logo_dnd.svg';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

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

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.msg || 
        err.message || 
        'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!authLoading && isAuthenticated)) {
    return <div className="login-loading">Loading...</div>;
  }

  return (
    <div className="login-container">
      <div className="login-left-container">
        <img src={BG_UI} alt="Background Illustration" className="login-svg-illustration" />
      </div>

      <div className="login-right-container">
        <div className="login-black-box">
          <img src={dnd_logo} alt="DND Logo" className="login-logo-dnd" />
          <h1 className="login-title">Login</h1>
          {error && <div className="login-error-message" role="alert">{error}</div>}

          <form onSubmit={onSubmit} className="login-form">
            <div className="login-form-group">
              <label htmlFor="email" className="login-form-label">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                className="login-form-input"
                required
                disabled={loading}
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password" className="login-form-label">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                className="login-form-input"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-submit-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="login-auth-link">
            New user? <Link to="/register" className="login-auth-link-text">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;