import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    const res = await loginAsDemo();
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Demo login failed');
    }
  };

  return (
    <div className="auth-view">
      <div className="auth-card">
        <div className="brand-wrap">
          <div className="brand-icon">🍛</div>
          <span className="brand-title">VendorQuery</span>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-sub">Log in to manage your restaurant and view sales insights</p>

        {/* Dedicated Instant Demo Account Box */}
        <div className="auth-demo-box">
          <div className="auth-demo-box-header">
            <span>⚡ INSTANT DEMO ACCOUNT</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>350+ Sample Orders</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
            Try the pre-seeded restaurant <strong>Spice Craft Bistro</strong> with full analytics.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={handleDemoSignIn}
            disabled={loading}
          >
            <KeyRound size={14} />
            <span>One-Click Demo Sign In</span>
          </button>
        </div>

        {error && <div className="auth-error" style={{ display: 'block' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              type="email"
              id="login-email"
              className="form-input"
              placeholder="vendor@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account yet? <Link to="/signup">Sign Up</Link> &bull;{' '}
          <Link to="/">
            <ArrowLeft size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
