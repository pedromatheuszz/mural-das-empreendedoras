import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { neonAuth, type AuthSession, type AuthUser } from '@/lib/neon-auth';

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  /** true enquanto a sessão salva no aparelho é restaurada. */
  isLoading: boolean;
  isSignedIn: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    neonAuth
      .restoreSession()
      .then((restored) => {
        if (active) setSession(restored);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const unsubscribe = neonAuth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      // Nenhum dado da conta anterior pode continuar em cache.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    isSignedIn: session !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
