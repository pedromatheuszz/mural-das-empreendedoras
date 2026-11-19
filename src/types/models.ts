import type { Database, EntrepreneurProfileRow } from './database';

export type PublicationStatus = Database['public']['Enums']['publication_status'];
export type ReportReason = Database['public']['Enums']['report_reason'];

export type Account = Database['public']['Tables']['users']['Row'];

/** Perfil completo (visto pela própria empreendedora). */
export type EntrepreneurProfile = EntrepreneurProfileRow;

/** Campos exibidos nos cards do Mural e da busca. */
export type ProfileSummary = Pick<
  EntrepreneurProfileRow,
  | 'id'
  | 'business_name'
  | 'entrepreneur_name'
  | 'service_description'
  | 'logo_url'
  | 'profile_image_url'
  | 'category'
  | 'city'
  | 'state'
  | 'serves_nationwide'
  | 'contact_url'
>;

/** Campos exibidos no perfil público (nunca inclui dados da conta, como e-mail). */
export type PublicProfile = ProfileSummary &
  Pick<
    EntrepreneurProfileRow,
    'user_id' | 'instagram_url' | 'website_url' | 'community_perks' | 'publication_status' | 'published_at'
  >;

export type Page<T> = {
  items: T[];
  nextPage: number | undefined;
};
