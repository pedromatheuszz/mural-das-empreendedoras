/**
 * Normalização e descrição de links (site, redes sociais e WhatsApp).
 * Somente http(s) é aceito — esquemas como javascript: ou data: são rejeitados.
 */

const INSTAGRAM_HANDLE = /^@?([A-Za-z0-9._]{1,30})$/;
const LOOKS_LIKE_DOMAIN =
  /\.(com|net|org|br|io|app|me|co|shop|store|site|online|art|blog|link|bio|page|dev|info|biz|tv|xyz)(\.|\/|$)/i;

type LinkKind =
  | 'whatsapp'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'x'
  | 'pinterest'
  | 'website';

const NETWORKS: { kind: LinkKind; label: string; hosts: string[] }[] = [
  { kind: 'whatsapp', label: 'WhatsApp', hosts: ['wa.me', 'whatsapp.com', 'api.whatsapp.com', 'wa.link'] },
  { kind: 'instagram', label: 'Instagram', hosts: ['instagram.com', 'instagr.am'] },
  { kind: 'tiktok', label: 'TikTok', hosts: ['tiktok.com'] },
  { kind: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.com', 'fb.me'] },
  { kind: 'linkedin', label: 'LinkedIn', hosts: ['linkedin.com'] },
  { kind: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  { kind: 'x', label: 'X (Twitter)', hosts: ['x.com', 'twitter.com'] },
  { kind: 'pinterest', label: 'Pinterest', hosts: ['pinterest.com', 'pin.it'] },
];

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    if (!/\.[a-z0-9-]{2,}$/i.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

/** "www.minhaloja.com.br" -> "https://www.minhaloja.com.br". Retorna null se inválido. */
export function normalizeUrl(input: string | null | undefined): string | null {
  const value = (input ?? '').trim();
  if (!value || /\s/.test(value)) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^:]+:\d+/.test(value);
  const candidate = hasScheme ? value : `https://${value.replace(/^\/+/, '')}`;
  const url = parseHttpUrl(candidate);
  if (!url) return null;
  const normalized = url.toString();
  return url.pathname === '/' && !url.search && !url.hash ? normalized.replace(/\/$/, '') : normalized;
}

/** Instagram (@usuario) ou link de qualquer rede social/site. */
export function normalizeSocialLink(input: string | null | undefined): string | null {
  const value = (input ?? '').trim();
  if (!value) return null;
  if (value.startsWith('@')) {
    const match = value.match(INSTAGRAM_HANDLE);
    return match ? `https://instagram.com/${match[1]}` : null;
  }
  if (!value.includes('/') && !LOOKS_LIKE_DOMAIN.test(value)) {
    const match = value.match(INSTAGRAM_HANDLE);
    return match ? `https://instagram.com/${match[1]}` : null;
  }
  return normalizeUrl(value);
}

/** Converte só dígitos em número internacional brasileiro para o WhatsApp (55 + DDD + número). */
export function toWhatsAppNumber(input: string): string | null {
  const trimmed = input.trim();
  const international = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (!international) digits = digits.replace(/^0+/, '');
  if (!international && (digits.length === 10 || digits.length === 11)) digits = `55${digits}`;
  if (digits.startsWith('55')) {
    const national = digits.slice(2);
    const ddd = Number(national.slice(0, 2));
    const valid = (national.length === 10 || national.length === 11) && ddd >= 11 && ddd <= 99;
    return valid ? digits : null;
  }
  return international && digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** WhatsApp com DDD ("(47) 99999-8888") ou link de contato (agenda, catálogo, formulário...). */
export function normalizeContact(input: string | null | undefined): string | null {
  const value = (input ?? '').trim();
  if (!value) return null;
  if (/^[+\d\s().-]+$/.test(value)) {
    const phone = toWhatsAppNumber(value);
    return phone ? `https://wa.me/${phone}` : null;
  }
  return normalizeUrl(value);
}

/** "5547999998888" -> "(47) 99999-8888"; números de outros países ficam com "+". */
export function formatPhone(digits: string): string {
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const number = digits.slice(4);
    const split = number.length === 9 ? 5 : 4;
    return `(${ddd}) ${number.slice(0, split)}-${number.slice(split)}`;
  }
  return `+${digits}`;
}

function matchNetwork(hostname: string) {
  const host = hostname.replace(/^www\./i, '').replace(/^m\./i, '').toLowerCase();
  return NETWORKS.find((network) => network.hosts.some((item) => host === item || host.endsWith(`.${item}`)));
}

export type LinkInfo = {
  kind: LinkKind;
  /** Nome amigável: "WhatsApp", "Instagram", "Site"... */
  label: string;
  /** Texto curto para exibir: "@suamarca", "(47) 99999-8888", "suamarca.com.br". */
  display: string;
};

export function describeLink(href: string): LinkInfo {
  const url = parseHttpUrl(href);
  if (!url) return { kind: 'website', label: 'Link', display: href };
  const host = url.hostname.replace(/^www\./i, '');
  const network = matchNetwork(url.hostname);
  const path = url.pathname.replace(/\/+$/, '');
  if (network?.kind === 'whatsapp') {
    const digits = path.replace(/\D/g, '') || url.searchParams.get('phone')?.replace(/\D/g, '') || '';
    return { kind: 'whatsapp', label: 'WhatsApp', display: digits ? formatPhone(digits) : 'WhatsApp' };
  }
  if (network) {
    const handle = path.split('/').filter(Boolean)[0];
    const display = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : host;
    return { kind: network.kind, label: network.label, display };
  }
  return { kind: 'website', label: 'Site', display: `${host}${path}`.slice(0, 48) };
}

/** Converte um link salvo de volta para o formato digitado no formulário. */
export function linkToInputValue(href: string | null | undefined): string {
  if (!href) return '';
  const info = describeLink(href);
  if (info.kind === 'whatsapp' && info.display !== 'WhatsApp') return info.display;
  if (info.kind === 'instagram' && info.display.startsWith('@')) return info.display;
  return href;
}
