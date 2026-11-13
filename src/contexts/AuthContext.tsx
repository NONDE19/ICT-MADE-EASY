import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types/index.ts';
import {
  ApiError,
  apiRequest,
  clearSession,
  getStoredTokens,
  getStoredUser,
  storeSession,
} from '../services/api.ts';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isOfflineGuest: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  enterOfflineMode: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>());
  const [loading, setLoading] = useState(true);

  const isOfflineGuest = user?.id === 'offline-guest';

  useEffect(() => {
    const cached = getStoredUser<AuthUser>();
    if (cached?.id === 'offline-guest') {
      setLoading(false);
      return;
    }

    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    apiRequest<{ user: AuthUser }>('/api/auth/me')
      .then((res) => {
        setUser(res.user);
        localStorage.setItem('virtuolab_user', JSON.stringify(res.user));
      })
      .catch((err) => {
        // Clear session only when server rejects credentials; preserve cached user when offline
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    storeSession(res.accessToken, res.refreshToken, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const enterOfflineMode = useCallback(() => {
    const offlineUser: AuthUser = {
      id: 'offline-guest',
      email: 'offline@ictmadeeasy.local',
      username: 'offline.learner',
      fullName: 'Offline Learner',
      role: 'PUPIL',
      schoolId: null,
      school: {
        id: 'offline-school',
        name: 'Offline Practice Workspace',
        code: 'OFFLINE',
      },
    };
    localStorage.setItem('virtuolab_user', JSON.stringify(offlineUser));
    setUser(offlineUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (!isOfflineGuest) {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore network error on logout
    } finally {
      clearSession();
      setUser(null);
    }
  }, [isOfflineGuest]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isOfflineGuest, login, enterOfflineMode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
