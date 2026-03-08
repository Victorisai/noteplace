import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('noteplace_token');

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await getMe();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem('noteplace_token');
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, []);

  function login(token, userData) {
    localStorage.setItem('noteplace_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('noteplace_token');
    setUser(null);
  }

  function updateUser(nextUserData) {
    setUser(nextUserData);
  }

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateUser,
    }),
    [user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}