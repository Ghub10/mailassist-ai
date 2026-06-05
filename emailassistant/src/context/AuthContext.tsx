import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { User, Tone } from '../types/user';
import { loadUser, saveUser, clearUser, clearAllData, syncFromSupabase, pushToneToSupabase } from '../utils/tokenStorage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_TONE'; payload: Tone }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_TOKEN'; payload: { accessToken: string; tokenExpiry: number } };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, isLoading: false };
    case 'SET_TONE':
      if (!state.user) return state;
      return { ...state, user: { ...state.user, tone: action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_TOKEN':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          accessToken: action.payload.accessToken,
          tokenExpiry: action.payload.tokenExpiry,
        },
      };
    default:
      return state;
  }
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  disconnect: () => void;
  updateTone: (tone: Tone) => void;
  updateToken: (accessToken: string, tokenExpiry: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
  });

  // Restore session from LocalStorage on mount
  useEffect(() => {
    const saved = loadUser();
    if (saved) {
      dispatch({ type: 'LOGIN', payload: saved });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Persist user to LocalStorage whenever it changes
  useEffect(() => {
    if (state.user) {
      saveUser(state.user);
    }
  }, [state.user]);

  // dispatch is stable, so these callbacks never need to change identity
  const login = useCallback((user: User) => {
    dispatch({ type: 'LOGIN', payload: user });
    // Pull user data from Supabase into localStorage so tags/statuses/prefs
    // are available immediately when the inbox loads.
    syncFromSupabase(user.email);
  }, []);

  // Sign out: clears auth only — tags, statuses, and reply history are kept
  const logout = useCallback(() => {
    clearUser();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Disconnect: full reset — wipes tags, statuses, and reply history too
  const disconnect = useCallback(() => {
    clearAllData();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateTone = useCallback((tone: Tone) => {
    dispatch({ type: 'SET_TONE', payload: tone });
    const userId = loadUser()?.email;
    if (userId) pushToneToSupabase(userId, tone);
  }, []);

  const updateToken = useCallback((accessToken: string, tokenExpiry: number) => {
    dispatch({ type: 'UPDATE_TOKEN', payload: { accessToken, tokenExpiry } });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: state.user,
    isLoading: state.isLoading,
    login,
    logout,
    disconnect,
    updateTone,
    updateToken,
  }), [state.user, state.isLoading, login, logout, disconnect, updateTone, updateToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
