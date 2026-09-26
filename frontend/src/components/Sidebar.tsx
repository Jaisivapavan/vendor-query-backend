import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, UtensilsCrossed, ReceiptText, BarChart3, Settings, LogOut } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { vendor, logout } = useAuth();
  const businessName = vendor?.businessName || 'Spice Craft Bistro';
  const initial = businessName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">🍛</div>
          <div>
            <div className="brand-title-small">VendorQuery</div>
            <div className="brand-subtitle">POS & AI Intelligence</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>

        <NavLink to="/menu" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UtensilsCrossed size={18} />
          <span>Menu Management</span>
        </NavLink>

        <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ReceiptText size={18} />
          <span>Orders</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span>Reports</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          <span>Settings & Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="vendor-profile-card">
          <div className="vendor-avatar">{initial}</div>
          <div className="vendor-details">
            <div className="vendor-title">{businessName}</div>
            <div className="vendor-sub">
              <span className="status-dot"></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
