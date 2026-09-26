import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Vendor } from '../types';
import { apiRequest, getAuthToken, setAuthToken, clearAuthToken } from '../api/client';

interface AuthContextType {
  vendor: Vendor | null;
  token: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (businessName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsDemo: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [token, setToken] = useState<string>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    if (!token) {
      setVendor(null);
      setLoading(false);
      return;
    }

    const res = await apiRequest<Vendor>('/api/auth/profile');
    if (res.success && res.data) {
      setVendor(res.data);
    } else {
      clearAuthToken();
      setToken('');
      setVendor(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ vendor: Vendor; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setToken(res.data.token);
      setVendor(res.data.vendor);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const register = async (businessName: string, email: string, password: string) => {
    const res = await apiRequest<{ vendor: Vendor; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ businessName, email, password }),
    });

    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setToken(res.data.token);
      setVendor(res.data.vendor);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const loginAsDemo = async () => {
    return login('demo@restaurant.com', 'password123');
  };

  const logout = () => {
    clearAuthToken();
    setToken('');
    setVendor(null);
  };

  return (
    <AuthContext.Provider
      value={{
        vendor,
        token,
        loading,
        login,
        register,
        logout,
        loginAsDemo,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
