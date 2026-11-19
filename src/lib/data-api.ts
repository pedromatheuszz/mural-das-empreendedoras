import 'react-native-url-polyfill/auto';

import { PostgrestClient } from '@supabase/postgrest-js';

import type { Database } from '@/types/database';

import { env, isBackendConfigured } from './env';
import { neonAuth } from './neon-auth';

/**
 * Cliente da Data API do Neon (compatível com PostgREST). Cada requisição leva o JWT
 * da usuária logada; a segurança dos dados é garantida pelas políticas de RLS no banco.
 */
export const db = new PostgrestClient<Database>(
  isBackendConfigured ? env.dataApiUrl : 'https://configure-o-neon.invalid',
  {
    timeout: 20_000,
    fetch: async (input, init) => {
      const token = await neonAuth.getAccessToken();
      const headers = new Headers(init?.headers);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const response = await fetch(input, { ...init, headers }).catch((error: unknown) => {
        if (__DEV__) console.warn('[data-api] falha de rede', String(error));
        throw error;
      });
      if (__DEV__ && !response.ok) console.warn('[data-api]', response.status, Boolean(token), String(input).slice(0, 120));
      return response;
    },
  },
);
