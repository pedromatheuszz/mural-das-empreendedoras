import * as SecureStore from 'expo-secure-store';

import { isSecretValue } from '../env';
import { preferences, secureStorage } from '../secure-storage';

describe('proteção contra segredos no app', () => {
  it('detecta a string de conexão do banco e chaves da API do Neon', () => {
    expect(isSecretValue('postgresql://neondb_owner:senha@ep-x.neon.tech/neondb?sslmode=require')).toBe(true);
    expect(isSecretValue('napi_abc123')).toBe(true);
    expect(isSecretValue('cloudinary://123:segredo@minha-nuvem')).toBe(true);
  });

  it('aceita os endereços públicos do Neon Auth e da Data API', () => {
    expect(isSecretValue('https://ep-x.neonauth.sa-east-1.aws.neon.tech/neondb/auth')).toBe(false);
    expect(isSecretValue('https://ep-x.apirest.sa-east-1.aws.neon.tech/neondb/rest/v1')).toBe(false);
    expect(isSecretValue('mural_unsigned')).toBe(false);
  });
});

describe('armazenamento seguro da sessão', () => {
  it('divide valores grandes em partes no Keychain/Keystore e reconstrói', async () => {
    const session = JSON.stringify({ access_token: 'x'.repeat(5000), refresh_token: 'y' });
    await secureStorage.setItem('mural.auth.cookies', session);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('mural.auth.cookies.count', '3');
    expect(await secureStorage.getItem('mural.auth.cookies')).toBe(session);

    await secureStorage.removeItem('mural.auth.cookies');
    expect(await secureStorage.getItem('mural.auth.cookies')).toBeNull();
  });

  it('guarda preferências simples', async () => {
    expect(await preferences.getFlag('onboarding')).toBe(false);
    await preferences.setFlag('onboarding', true);
    expect(await preferences.getFlag('onboarding')).toBe(true);
  });
});
