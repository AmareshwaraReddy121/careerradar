import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, LoginInput, RegisterInput, UserDTO } from '@careerradar/shared';
import { api, refreshSession, tokenStore } from './api';

interface AuthContextValue {
  user: UserDTO | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<UserDTO>;
  register: (input: RegisterInput) => Promise<UserDTO>;
  logout: () => Promise<void>;
  setSession: (data: AuthResponse) => void;
  setUser: (user: UserDTO) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const setSession = useCallback((data: AuthResponse) => {
    tokenStore.set(data.accessToken);
    setUser(data.user);
  }, []);

  useEffect(() => {
    tokenStore.onExpired(() => {
      setUser(null);
      qc.clear();
    });
    refreshSession()
      .then((data) => data && setUser(data.user))
      .finally(() => setLoading(false));
  }, [qc]);

  const login = useCallback(
    async (input: LoginInput) => {
      const data = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: input,
        noRetry: true,
      });
      qc.clear();
      setSession(data);
      return data.user;
    },
    [qc, setSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: input,
        noRetry: true,
      });
      qc.clear();
      setSession(data);
      return data.user;
    },
    [qc, setSession],
  );

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST', noRetry: true }).catch(() => undefined);
    tokenStore.set(null);
    setUser(null);
    qc.clear();
  }, [qc]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setSession, setUser }),
    [user, loading, login, register, logout, setSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
