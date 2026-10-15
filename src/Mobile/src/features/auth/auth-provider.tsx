import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { clearTokens, getAccessToken, saveTokens, setUnauthorizedHandler } from '@/services/api/client';

import { authApi } from './api/auth-api';
import type { AuthUser } from './types';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const signOut = useCallback(async () => {
    setUser(null);
    await clearTokens();
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });

    let active = true;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (active) setStatus('signedOut');
          return;
        }
        // client tự thử refresh một lần nếu access token đã hết hạn.
        const me = await authApi.me();
        if (!active) return;
        setUser(me);
        setStatus('signedIn');
      } catch {
        await clearTokens();
        if (active) {
          setUser(null);
          setStatus('signedOut');
        }
      }
    })();

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    await saveTokens(session.accessToken, session.refreshToken);
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus('signedIn');
    } catch (error) {
      await clearTokens();
      setUser(null);
      setStatus('signedOut');
      throw error;
    }
  }, []);

  const reloadUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    setStatus('signedIn');
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signOut, reloadUser }),
    [status, user, signIn, signOut, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
