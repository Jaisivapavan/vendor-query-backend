import React from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

interface SettingsPageProps {
  onOpenAi: () => void;
  isDevMode: boolean;
  onToggleDevMode: (enabled: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenAi,
  isDevMode,
  onToggleDevMode,
}) => {
  const { vendor } = useAuth();

  return (
    <>
      <TopBar title="Restaurant Profile & Settings" onOpenAi={onOpenAi} />

      <main className="content-body">
        <div className="card" style={{ maxWidth: '640px' }}>
          <div className="card-title">
            <span>⚙️ Store Profile Information</span>
          </div>

          <div className="form-group">
            <label className="form-label">Restaurant / Store Name</label>
            <input
              type="text"
              className="form-input"
              value={vendor?.businessName || ''}
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="form-label">Registered Owner Email</label>
            <input
              type="email"
              className="form-input"
              value={vendor?.email || ''}
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vendor / Tenant Session ID</label>
            <input
              type="text"
              className="form-input"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={vendor?.id || ''}
              readOnly
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '1.5rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-heading)' }}>
                Developer Security Mode
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Show prompt-injection refusal test chips in the AI drawer.
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={isDevMode}
                onChange={(e) => onToggleDevMode(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </main>
    </>
  );
};
