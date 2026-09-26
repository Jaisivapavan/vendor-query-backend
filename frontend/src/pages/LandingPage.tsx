import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, BarChart2, ShieldCheck, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleTryDemo = async () => {
    const res = await loginAsDemo();
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="landing-view">
      <header className="landing-nav">
        <div className="brand-wrap">
          <div className="brand-icon">🍛</div>
          <span className="brand-title">VendorQuery</span>
        </div>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          {/* <a href="/docs" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            📖 Swagger Docs
          </a> */}
          <Link to="/login" className="btn btn-secondary btn-sm">
            Log In
          </Link>
          <Link to="/signup" className="btn btn-sm">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-pill">✨ Autonomous Gemini Sales Intelligence & POS</div>
        <h1 className="landing-heading">
          Intelligent Sales Analytics for <span>Modern Restaurants</span>
        </h1>
        <p className="landing-desc">
          Deterministic multi-tenant POS analytics powered by PostgreSQL, combined with autonomous Google Gemini tool-calling for real-time sales intelligence and operational insights.
        </p>

        <div className="landing-actions">
          <button className="btn" style={{ padding: '0.8rem 1.6rem', fontSize: '1rem' }} onClick={handleTryDemo}>
            🚀 Try Live Demo (Spice Craft Bistro)
          </button>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.8rem 1.6rem', fontSize: '1rem' }}>
            <span>Sign In to Your Restaurant</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="landing-features">
          <div className="feature-box">
            <div className="feature-icon">
              <Sparkles size={28} color="var(--primary)" />
            </div>
            <div className="feature-title">AI Sales Intelligence</div>
            <div className="feature-desc">
              Ask questions in natural language. Streaming responses powered by Gemini function-calling without raw SQL risks.
            </div>
          </div>

          <div className="feature-box">
            <div className="feature-icon">
              <BarChart2 size={28} color="var(--warm-accent)" />
            </div>
            <div className="feature-title">Real-Time POS Analytics</div>
            <div className="feature-desc">
              Monitor revenue, taxes, average order value, and top selling dishes across 60 days of transactional data.
            </div>
          </div>

          <div className="feature-box">
            <div className="feature-icon">
              <ShieldCheck size={28} color="var(--success)" />
            </div>
            <div className="feature-title">Multi-Tenant Isolation</div>
            <div className="feature-desc">
              Enterprise-grade tenant boundaries. Every query strictly filtered by verified JWT vendor sessions.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
