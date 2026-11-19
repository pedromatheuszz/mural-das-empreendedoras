import Constants from 'expo-constants';

export const APP_NAME = 'Mural das Empreendedoras';

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** Versão dos Termos de Uso e da Política de Privacidade aceita no cadastro. */
export const LEGAL_VERSION = '2026-11';

/**
 * Dados da organização responsável pelo app (controladora dos dados, LGPD).
 * ⚠️ Preencha antes de publicar nas lojas — veja docs/PUBLICACAO.md.
 */
export const LEGAL_ENTITY = {
  name: '[Razão social da organização responsável]',
  document: '[CNPJ]',
  city: '[Cidade/UF]',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'contato@seudominio.com.br',
  privacyEmail: process.env.EXPO_PUBLIC_PRIVACY_EMAIL?.trim() || 'privacidade@seudominio.com.br',
};

/** Grupo que reúne as empreendedoras divulgadas no Mural. */
export const COMMUNITY = {
  name: 'Joinville Empreendedoras',
  instagramUrl: 'https://www.instagram.com/joinvilleempreendedoras',
  instagramHandle: '@joinvilleempreendedoras',
} as const;

export const PAGE_SIZE = 12;

export const RECENT_PROFILES_LIMIT = 8;


export const LIMITS = {
  fullName: { min: 3, max: 120 },
  businessName: { min: 2, max: 80 },
  entrepreneurName: { min: 2, max: 80 },
  description: { min: 20, max: 1500 },
  city: { min: 2, max: 80 },
  url: { max: 300 },
  reportDetails: { max: 1000 },
  password: { min: 8, max: 72 },
  searchQuery: { min: 2, max: 100 },
} as const;
