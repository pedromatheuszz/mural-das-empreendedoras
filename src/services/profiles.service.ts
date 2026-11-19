import { PAGE_SIZE, RECENT_PROFILES_LIMIT } from '@/constants/app';
import { db } from '@/lib/data-api';
import { toProfilePayload, type ProfileFormValues } from '@/schemas/profile.schema';
import type { EntrepreneurProfile, Page, ProfileSummary, PublicationStatus, PublicProfile } from '@/types/models';
import { AppError } from '@/utils/errors';

import { isLocalImage, removeImages, uploadProfileImage, type ImageKind } from './storage.service';

/** Colunas dos cards (evita trafegar dados desnecessários). */
export const SUMMARY_COLUMNS =
  'id, business_name, entrepreneur_name, service_description, logo_url, profile_image_url, category, city, state, serves_nationwide, contact_url';

/** Colunas do perfil público — nunca inclui dados da conta (e-mail etc.). */
export const PUBLIC_COLUMNS = `${SUMMARY_COLUMNS}, user_id, instagram_url, website_url, community_perks, publication_status, published_at`;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toPage<T>(items: T[], page: number): Page<T> {
  return { items, nextPage: items.length === PAGE_SIZE ? page + 1 : undefined };
}

export async function listHubProfiles(params: { page: number; category: string | null }): Promise<Page<ProfileSummary>> {
  const from = params.page * PAGE_SIZE;
  let query = db.from('entrepreneur_profiles').select(SUMMARY_COLUMNS).eq('publication_status', 'published');
  if (params.category) query = query.eq('category', params.category);
  const { data, error } = await query
    .order('sort_name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return toPage(data, params.page);
}

export async function listRecentProfiles(limit = RECENT_PROFILES_LIMIT): Promise<ProfileSummary[]> {
  const { data, error } = await db
    .from('entrepreneur_profiles')
    .select(SUMMARY_COLUMNS)
    .eq('publication_status', 'published')
    .order('published_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function searchProfiles(params: {
  query: string;
  category: string | null;
  page: number;
}): Promise<Page<ProfileSummary>> {
  const { data, error } = await db
    .rpc('search_entrepreneur_profiles', {
      search_query: params.query.trim().slice(0, 100),
      category_filter: params.category,
      page_size: PAGE_SIZE,
      page_offset: params.page * PAGE_SIZE,
    })
    .select(SUMMARY_COLUMNS);
  if (error) throw error;
  return toPage(data as ProfileSummary[], params.page);
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await db.from('entrepreneur_profiles').select(PUBLIC_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyProfile(userId: string): Promise<EntrepreneurProfile | null> {
  const { data, error } = await db
    .from('entrepreneur_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

type ResolvedImage = { url: string | null; uploaded: string | null; replaced: string | null };

async function resolveImage(
  userId: string,
  next: string | null,
  current: string | null,
  kind: ImageKind,
): Promise<ResolvedImage> {
  if (isLocalImage(next)) {
    const url = await uploadProfileImage(userId, next, kind);
    return { url, uploaded: url, replaced: current };
  }
  if (!next) return { url: null, uploaded: null, replaced: current };
  return { url: next, uploaded: null, replaced: next === current ? null : current };
}

export async function createProfile(params: {
  userId: string;
  values: ProfileFormValues;
  publish: boolean;
}): Promise<EntrepreneurProfile> {
  const [logo, photo] = await Promise.all([
    resolveImage(params.userId, params.values.logoUri, null, 'logo'),
    resolveImage(params.userId, params.values.photoUri, null, 'photo'),
  ]);
  const { data, error } = await db
    .from('entrepreneur_profiles')
    .insert({
      ...toProfilePayload(params.values),
      user_id: params.userId,
      logo_url: logo.url,
      profile_image_url: photo.url,
      publication_status: params.publish ? 'published' : 'draft',
      // O horário oficial do consentimento é definido pelo servidor.
      public_consent_at: params.publish ? new Date().toISOString() : null,
    })
    .select('*')
    .single();
  if (error) {
    await removeImages([logo.uploaded, photo.uploaded]);
    throw error;
  }
  return data;
}

export async function updateProfile(params: {
  profile: EntrepreneurProfile;
  values: ProfileFormValues;
  /** Conta que está editando (usada na pasta das imagens dos perfis do grupo). */
  editorId?: string;
}): Promise<EntrepreneurProfile> {
  const { profile, values } = params;
  const ownerId = profile.user_id ?? params.editorId;
  if (!ownerId) {
    throw new AppError('Este perfil é mantido pela organização do grupo e só pode ser editado pela equipe do Mural.');
  }
  const [logo, photo] = await Promise.all([
    resolveImage(ownerId, values.logoUri, profile.logo_url, 'logo'),
    resolveImage(ownerId, values.photoUri, profile.profile_image_url, 'photo'),
  ]);
  const { data, error } = await db
    .from('entrepreneur_profiles')
    .update({ ...toProfilePayload(values), logo_url: logo.url, profile_image_url: photo.url })
    .eq('id', profile.id)
    .select('*')
    .single();
  if (error) {
    await removeImages([logo.uploaded, photo.uploaded]);
    throw error;
  }
  await removeImages([logo.replaced, photo.replaced]);
  return data;
}

export async function setPublicationStatus(params: {
  profileId: string;
  status: Exclude<PublicationStatus, 'suspended'>;
  consent?: boolean;
}): Promise<EntrepreneurProfile> {
  const { data, error } = await db
    .from('entrepreneur_profiles')
    .update({
      publication_status: params.status,
      ...(params.consent ? { public_consent_at: new Date().toISOString() } : {}),
    })
    .eq('id', params.profileId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(profile: EntrepreneurProfile): Promise<void> {
  const { error } = await db.from('entrepreneur_profiles').delete().eq('id', profile.id);
  if (error) throw error;
  await removeImages([profile.logo_url, profile.profile_image_url]);
}
