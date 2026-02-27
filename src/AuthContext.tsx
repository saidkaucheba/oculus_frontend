import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api } from './api.client';
import type { User, UserRole, ApiError } from './api.types';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    api.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.auth.login({ email, password });
    const me = await api.auth.me();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api-auth/logout/`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function RequireAuth({
  children,
  roles,
  fallback = null,
}: {
  children: ReactNode;
  roles?: UserRole[];
  fallback?: ReactNode;
}) {
  const { user, initializing, hasRole } = useAuth();

  if (initializing) return null;
  if (!user) return <>{fallback}</>;
  if (roles && !hasRole(...roles)) return <>{fallback}</>;

  return <>{children}</>;
}
