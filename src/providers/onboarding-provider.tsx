import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { preferences } from '@/lib/secure-storage';

const ONBOARDING_KEY = 'onboarding_done_v1';

type OnboardingContextValue = {
  /** null enquanto a preferência é lida do aparelho. */
  done: boolean | null;
  complete: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/** Lembra se a apresentação inicial (onboarding) já foi vista neste aparelho. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    preferences.getFlag(ONBOARDING_KEY).then((value) => {
      if (active) setDone(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const complete = async () => {
    setDone(true);
    await preferences.setFlag(ONBOARDING_KEY, true);
  };

  return <OnboardingContext.Provider value={{ done, complete }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding precisa estar dentro de <OnboardingProvider>.');
  return context;
}
