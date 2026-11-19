import { z } from 'zod';

import { LIMITS } from '@/constants/app';
import { CATEGORY_SLUGS } from '@/constants/categories';
import { STATE_CODES } from '@/constants/locations';
import { PERK_SLUGS } from '@/constants/perks';
import type { Database } from '@/types/database';
import type { EntrepreneurProfile } from '@/types/models';
import { nullIfEmpty, sanitizeLine, sanitizeMultiline } from '@/utils/sanitize';
import { linkToInputValue, normalizeContact, normalizeSocialLink, normalizeUrl } from '@/utils/url';

const optionalLink = (normalize: (value: string) => string | null, message: string) =>
  z
    .string()
    .trim()
    .max(LIMITS.url.max, `Use no máximo ${LIMITS.url.max} caracteres.`)
    .refine((value) => value === '' || normalize(value) !== null, message);

export const profileFormSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(LIMITS.businessName.min, 'Informe o nome da sua marca ou empresa.')
    .max(LIMITS.businessName.max, `Use no máximo ${LIMITS.businessName.max} caracteres.`),
  entrepreneurName: z
    .string()
    .trim()
    .min(LIMITS.entrepreneurName.min, 'Informe o nome da empreendedora responsável.')
    .max(LIMITS.entrepreneurName.max, `Use no máximo ${LIMITS.entrepreneurName.max} caracteres.`),
  category: z.enum(CATEGORY_SLUGS).nullable(),
  serviceDescription: z
    .string()
    .trim()
    .min(LIMITS.description.min, `Conte um pouco mais: escreva pelo menos ${LIMITS.description.min} caracteres.`)
    .max(LIMITS.description.max, 'Use no máximo 1.500 caracteres.'),
  communityPerks: z.array(z.enum(PERK_SLUGS)).max(PERK_SLUGS.length),
  logoUri: z.string().nullable(),
  photoUri: z.string().nullable(),
  city: z
    .string()
    .trim()
    .max(LIMITS.city.max, `Use no máximo ${LIMITS.city.max} caracteres.`)
    .refine((value) => value === '' || value.length >= LIMITS.city.min, 'Informe o nome da cidade.'),
  state: z.enum(STATE_CODES).nullable(),
  servesNationwide: z.boolean(),
  social: optionalLink(normalizeSocialLink, 'Informe seu @ do Instagram ou o link de uma rede social.'),
  contact: optionalLink(normalizeContact, 'Informe um WhatsApp com DDD, como (11) 91234-5678, ou um link válido.'),
  website: optionalLink(normalizeUrl, 'Informe um endereço válido, como www.suamarca.com.br.'),
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ProfileFormOutput = z.output<typeof profileFormSchema>;
export type ProfileField = keyof ProfileFormValues;

/** Campos validados em cada etapa do cadastro guiado. */
export const PROFILE_STEPS: { title: string; subtitle: string; fields: ProfileField[] }[] = [
  {
    title: 'Sua marca',
    subtitle: 'Como as pessoas vão reconhecer o seu negócio.',
    fields: ['businessName', 'entrepreneurName', 'category'],
  },
  {
    title: 'O que você oferece',
    subtitle: 'Explique como contaria para uma amiga.',
    fields: ['serviceDescription', 'communityPerks'],
  },
  {
    title: 'Imagens',
    subtitle: 'Opcional, mas perfis com imagem chamam mais atenção.',
    fields: ['logoUri', 'photoUri'],
  },
  {
    title: 'Contato e localização',
    subtitle: 'Onde você atende e como falar com você.',
    fields: ['city', 'state', 'servesNationwide', 'social', 'contact', 'website'],
  },
];

export function emptyProfileForm(entrepreneurName = ''): ProfileFormValues {
  return {
    businessName: '',
    entrepreneurName,
    category: null,
    serviceDescription: '',
    communityPerks: [],
    logoUri: null,
    photoUri: null,
    city: '',
    state: null,
    servesNationwide: false,
    social: '',
    contact: '',
    website: '',
  };
}

export function profileToFormValues(profile: EntrepreneurProfile): ProfileFormValues {
  const category = CATEGORY_SLUGS.find((slug) => slug === profile.category) ?? null;
  const state = STATE_CODES.find((code) => code === profile.state) ?? null;
  const perks = profile.community_perks.filter((perk): perk is ProfileFormValues['communityPerks'][number] =>
    (PERK_SLUGS as readonly string[]).includes(perk),
  );
  return {
    businessName: profile.business_name,
    entrepreneurName: profile.entrepreneur_name,
    category,
    serviceDescription: profile.service_description,
    communityPerks: perks,
    logoUri: profile.logo_url,
    photoUri: profile.profile_image_url,
    city: profile.city ?? '',
    state,
    servesNationwide: profile.serves_nationwide,
    social: linkToInputValue(profile.instagram_url),
    contact: linkToInputValue(profile.contact_url),
    website: profile.website_url ?? '',
  };
}

type ProfileContent = Required<
  Pick<
    Database['public']['Tables']['entrepreneur_profiles']['Update'],
    | 'business_name'
    | 'entrepreneur_name'
    | 'service_description'
    | 'category'
    | 'city'
    | 'state'
    | 'serves_nationwide'
    | 'community_perks'
    | 'instagram_url'
    | 'contact_url'
    | 'website_url'
  >
>;

/** Converte os valores do formulário em colunas do banco (sanitizadas e normalizadas). */
export function toProfilePayload(values: ProfileFormValues): ProfileContent {
  return {
    business_name: sanitizeLine(values.businessName),
    entrepreneur_name: sanitizeLine(values.entrepreneurName),
    service_description: sanitizeMultiline(values.serviceDescription),
    category: values.category ?? null,
    city: nullIfEmpty(sanitizeLine(values.city)),
    state: values.state ?? null,
    serves_nationwide: values.servesNationwide,
    community_perks: [...new Set(values.communityPerks)],
    instagram_url: normalizeSocialLink(values.social),
    contact_url: normalizeContact(values.contact),
    website_url: normalizeUrl(values.website),
  };
}
