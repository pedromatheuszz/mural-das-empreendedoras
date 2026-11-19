/**
 * Variáveis de ambiente públicas (prefixo EXPO_PUBLIC_ é embutido no app no build).
 * Configure no arquivo .env (veja .env.example) ou nas variáveis de ambiente do EAS.
 *
 * Só entram aqui endereços PÚBLICOS do Neon (Auth e Data API) e do Cloudinary.
 * A string de conexão do banco (NEON_DATABASE_URL) e as chaves de API NUNCA vão para o app.
 */
const read = (value: string | undefined) => value?.trim() ?? '';
/** Cabeçalho Origin = só protocolo + domínio (sem caminho). */
const toOrigin = (value: string) => value.match(/^https?:\/\/[^/?#\s]+/i)?.[0] ?? '';

const authUrl = read(process.env.EXPO_PUBLIC_NEON_AUTH_URL).replace(/\/+$/, '');
const dataApiUrl = read(process.env.EXPO_PUBLIC_NEON_DATA_API_URL).replace(/\/+$/, '');
/** Origem aceita pelo Neon Auth. Padrão: o próprio domínio do Neon Auth (aceito em produção). */
const authOrigin = toOrigin(read(process.env.EXPO_PUBLIC_NEON_AUTH_ORIGIN)) || toOrigin(authUrl) || 'http://localhost';
const cloudinaryCloudName = read(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);
const cloudinaryUploadPreset = read(process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

/**
 * Impede que um segredo seja embutido no app por engano: a string de conexão do Postgres
 * (dá acesso total ao banco, sem RLS) ou uma chave da API do Neon/Cloudinary.
 */
export function isSecretValue(value: string): boolean {
  return /^postgres(ql)?:\/\//i.test(value) || /^napi_/i.test(value) || /:\/\/[^/\s]*:[^/\s]*@/.test(value);
}

const isHttpUrl = (value: string) => /^https?:\/\/[^\s]+$/i.test(value);
const publicValues = [authUrl, dataApiUrl, cloudinaryCloudName, cloudinaryUploadPreset];

export const env = {
  authUrl,
  dataApiUrl,
  authOrigin,
  cloudinaryCloudName,
  cloudinaryUploadPreset,
};

export type EnvProblem = 'missing' | 'secret-key' | null;

export const envProblem: EnvProblem = publicValues.some(isSecretValue)
  ? 'secret-key'
  : !isHttpUrl(authUrl) || !isHttpUrl(dataApiUrl)
    ? 'missing'
    : null;

export const isBackendConfigured = envProblem === null;

/** Upload de imagens só funciona com o Cloudinary configurado. */
export const isCloudinaryConfigured = cloudinaryCloudName.length > 0 && cloudinaryUploadPreset.length > 0;
