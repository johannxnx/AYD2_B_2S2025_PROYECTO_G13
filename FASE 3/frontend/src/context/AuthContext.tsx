// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { meRequest, type AuthUser } from '../services/auth/authApi';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredToken(): string | null {
  return localStorage.getItem('authToken');
}

function getStoredUser(): AuthUser | null {
  const rawUser = localStorage.getItem('authUser');
  console.log('[Auth] getStoredUser - raw:', rawUser);
  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser) as AuthUser;
    console.log('[Auth] getStoredUser - parsed:', parsed);
    return parsed;
  } catch {
    console.error('[Auth] Error parsing stored user');
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  console.log('[Auth] Provider init - token:', !!token, 'user:', user);

  const logout = () => {
    console.log('[Auth] Logout called');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  };

  const setSession = (nextToken: string, nextUser: AuthUser) => {
    console.log('[Auth] setSession called');
    console.log('[Auth] - nextToken:', nextToken.substring(0, 30) + '...');
    console.log('[Auth] - nextUser:', nextUser);
    console.log('[Auth] - nextUser.id:', nextUser.id);
    console.log('[Auth] - nextUser.role:', nextUser.role);
    
    localStorage.setItem('authToken', nextToken);
    localStorage.setItem('authUser', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  // src/context/AuthContext.tsx - Modificar refreshSession

const refreshSession = async () => {
  const storedToken = getStoredToken();
  console.log('[Auth] refreshSession - storedToken exists:', !!storedToken);
  if (storedToken) {
    console.log('[Auth] refreshSession - token preview:', storedToken.substring(0, 30) + '...');
  }

  if (!storedToken) {
    console.log('[Auth] No token found, logging out');
    logout();
    return;
  }

  try {
    console.log('[Auth] Calling meRequest...');
    const response = await meRequest(storedToken);
    const payload = response.data;
    console.log('[Auth] meRequest payload:', payload);
    console.log('[Auth] payload.sub:', payload.sub);
    console.log('[Auth] typeof payload.sub:', typeof payload.sub);

    const normalizedUser: AuthUser = {
      id: payload.sub ? Number(payload.sub) : undefined,
      email: payload.email || user?.email || '',
      role: payload.role || user?.role || 'cliente',
      nombres: payload.nombres || user?.nombres,
      apellidos: payload.apellidos || user?.apellidos,
    };
    
    console.log('[Auth] Normalized user:', normalizedUser);
    console.log('[Auth] User ID (final):', normalizedUser.id);

    setSession(storedToken, normalizedUser);
  } catch (error) {
    console.error('[Auth] refreshSession error:', error);
    logout();
  }
};

  useEffect(() => {
    (async () => {
      console.log('[Auth] Bootstrapping...');
      await refreshSession();
      setIsBootstrapping(false);
      console.log('[Auth] Bootstrapping complete - user:', user);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    setSession,
    logout,
    refreshSession,
  }), [user, token, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}