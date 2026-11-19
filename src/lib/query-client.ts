import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isRetryableError, isSessionNotIdentified } from '@/utils/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 15 * 60_000,
      retry: (failureCount, error) => failureCount < 2 && isRetryableError(error),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      // Ações não se repetem sozinhas, exceto quando o banco avisa que a sessão não foi
      // identificada (ele recusa antes de alterar algo, então repetir é seguro).
      retry: (failureCount, error) => failureCount < 2 && isSessionNotIdentified(error),
      retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 2000),
    },
  },
});

// Pausa/retoma consultas conforme a conexão (evita requisições inúteis offline).
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  }),
);

// Atualiza dados "velhos" quando o app volta ao primeiro plano.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
}
