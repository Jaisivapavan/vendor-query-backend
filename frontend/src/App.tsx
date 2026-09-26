import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { AiChatDrawer } from './components/AiChatDrawer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { MenuPage } from './pages/MenuPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected layout wrapper
const DashboardLayout: React.FC = () => {
  const { token, loading } = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return localStorage.getItem('vendorquery_dev_mode') === 'true';
  });

  const handleToggleDevMode = (enabled: boolean) => {
    setIsDevMode(enabled);
    localStorage.setItem('vendorquery_dev_mode', String(enabled));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--primary)', fontWeight: 600 }}>
        Loading session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Routes>
          <Route path="/" element={<DashboardPage onOpenAi={() => setIsAiOpen(true)} />} />
          <Route path="/overview" element={<DashboardPage onOpenAi={() => setIsAiOpen(true)} />} />
          <Route path="/menu" element={<MenuPage onOpenAi={() => setIsAiOpen(true)} />} />
          <Route path="/orders" element={<OrdersPage onOpenAi={() => setIsAiOpen(true)} />} />
          <Route path="/reports" element={<ReportsPage onOpenAi={() => setIsAiOpen(true)} />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                onOpenAi={() => setIsAiOpen(true)}
                isDevMode={isDevMode}
                onToggleDevMode={handleToggleDevMode}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      <AiChatDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onToggle={() => setIsAiOpen((prev) => !prev)}
        isDevMode={isDevMode}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing & Auth Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected App Routes */}
          <Route path="/dashboard/*" element={<DashboardLayout />} />
          <Route path="/overview" element={<DashboardLayout />} />
          <Route path="/menu" element={<DashboardLayout />} />
          <Route path="/orders" element={<DashboardLayout />} />
          <Route path="/reports" element={<DashboardLayout />} />
          <Route path="/settings" element={<DashboardLayout />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
