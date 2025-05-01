import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import '../../css/Register.css';
import BG_UI from '../../assets/login_bg.svg'
import dnd_logo from '../../assets/logo_dnd.svg'

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
  const { register } = useAuth();

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
      // Display the specific error message from the backend
      setError(err.response?.data?.msg || 'Registration failed');
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
          <h2>Register</h2>
          {error && <div className="error-message" role="alert">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={onChange}
                placeholder="Username"
                required
                disabled={loading}
                minLength="3"
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="Email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Password"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                placeholder="Confirm Password"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;