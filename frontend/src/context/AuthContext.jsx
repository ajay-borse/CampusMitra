import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();

  const [token, setToken] = useState(
    () => localStorage.getItem('campusmitra_token') || localStorage.getItem('token') || null
  );
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusmitra_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('campusmitra_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDBUnavailable, setIsDBUnavailable] = useState(false);

  // Synchronize user profile from backend
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('campusmitra_token') || localStorage.getItem('token');
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res?.success && res.data) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        localStorage.setItem('campusmitra_user', JSON.stringify(res.data.user));
        localStorage.setItem('campusmitra_profile', JSON.stringify(res.data.profile));
        setIsDBUnavailable(false);
      }
    } catch (err) {
      if (err.status === 503) {
        setIsDBUnavailable(true);
      } else if (err.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen for 401 unauthorized events dispatched from Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
      setToken(null);
      localStorage.removeItem('campusmitra_token');
      localStorage.removeItem('token');
      localStorage.removeItem('campusmitra_user');
      localStorage.removeItem('campusmitra_profile');
      showToast('Your session has expired. Please log in again.', 'warning');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshUser, showToast]);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res?.success && res.data) {
        const { token: newToken, user: newUser, profile: newProfile } = res.data;
        setToken(newToken);
        setUser(newUser);
        setProfile(newProfile);
        localStorage.setItem('campusmitra_token', newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('campusmitra_user', JSON.stringify(newUser));
        if (newProfile) {
          localStorage.setItem('campusmitra_profile', JSON.stringify(newProfile));
        }
        setIsDBUnavailable(false);
        showToast(`Welcome back, ${newUser.firstName}! 🎓`, 'success');
        return { success: true, user: newUser, profile: newProfile };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
      showToast(errorMsg, 'error');
      return { success: false, message: errorMsg, status: err.status };
    }
  };

  const register = async (formData) => {
    try {
      const res = await authApi.register(formData);
      if (res?.success && res.data) {
        const { token: newToken, user: newUser, profile: newProfile } = res.data;
        setToken(newToken);
        setUser(newUser);
        setProfile(newProfile);
        localStorage.setItem('campusmitra_token', newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('campusmitra_user', JSON.stringify(newUser));
        if (newProfile) {
          localStorage.setItem('campusmitra_profile', JSON.stringify(newProfile));
        }
        setIsDBUnavailable(false);
        showToast(`Account created! Welcome to CampusMitra, ${newUser.firstName}! 🎉`, 'success');
        return { success: true, user: newUser, profile: newProfile, verificationUrl: res.data.verificationUrl };
      }
      return { success: false, message: 'Registration response was empty' };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Make sure you use a @mitwpu.edu.in email.';
      showToast(errorMsg, 'error');
      return { success: false, message: errorMsg, status: err.status };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('campusmitra_token');
    localStorage.removeItem('token');
    localStorage.removeItem('campusmitra_user');
    localStorage.removeItem('campusmitra_profile');
    showToast('Logged out successfully.', 'info');
  };

  const updateCurrentProfile = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('campusmitra_profile', JSON.stringify(newProfile));
  };

  const value = {
    user,
    profile,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    isDBUnavailable,
    login,
    register,
    logout,
    refreshUser,
    updateCurrentProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
