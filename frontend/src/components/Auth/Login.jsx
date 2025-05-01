import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import '../../css/Login.css'
import BG_UI from '../../assets/login_bg.svg'
import dnd_logo from '../../assets/logo_dnd.svg'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;
  const navigate = useNavigate();
  const { login } = useAuth();

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

  return (
    <div className="auth-container">
      <div className="left-container">
        <img src={BG_UI} alt="Background Illustration" className="svg-illustration" />
      </div>

      <div className="right-container">
        <div className="black-box">
          <img src={dnd_logo} alt="DND Logo" className="logo_dnd" />
          <h1>Login</h1>
          {error && <div className="error-message" role="alert">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-link">
            New user? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;