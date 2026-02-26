/**
 * AuthContext.tsx
 *
 * Provides the current user, login/logout helpers, and a role-check utility
 * to the entire React tree.
 *
 * Usage:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 *   const { user, login, logout, hasRole } = useAuth();
 */

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

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  /** True while the initial /api/me/ check is in flight */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Returns true if the logged-in user has one of the given roles */
  hasRole: (...roles: UserRole[]) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // On mount: check if the user already has an active session
  useEffect(() => {
    api.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.auth.login({ email, password });
    // After login Django sets the session cookie; fetch the user object
    const me = await api.auth.me();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    // Django session logout — fire and forget; clear local state immediately
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api-auth/logout/`, {
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Route guard ──────────────────────────────────────────────────────────────

/**
 * Wrap any component tree to require authentication (and optionally a role).
 *
 * @example
 *   <RequireAuth>
 *     <Dashboard />
 *   </RequireAuth>
 *
 *   <RequireAuth roles={['surgeon', 'admin']}>
 *     <FeedbackPage />
 *   </RequireAuth>
 */
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
