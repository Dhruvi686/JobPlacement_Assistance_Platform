import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const url = `${API_BASE_URL}/api/admin/login`;
      const res = await axios.post(url, { username, password });
      const { token, admin } = res.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      navigate('/admin'); // or admin dashboard route
    } catch (err) {
      console.error('Admin login error:', err?.response?.status, err?.response?.data || err.message);
      const msg = err?.response?.data?.error
        || (typeof err?.response?.data === 'string' ? err.response.data : '')
        || err.message
        || 'Login failed';
      alert(msg);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-logo">
          <img src={process.env.PUBLIC_URL + '/savvy-logo.png'} alt="Savvy Logo" />
        </div>
        
        <div className="admin-login-card">
          <h1 className="admin-login-title">Admin Login</h1>
          
          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label className="form-label">Enter Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Registered Mobile Number"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Enter Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            <button type="button" className="forgot-password">Forgot Password ?</button>

            <button type="submit" className="admin-login-btn">
              🔒 Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;