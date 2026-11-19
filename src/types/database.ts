/**
 * Tipos do banco no formato usado pelo cliente PostgREST (@supabase/postgrest-js), que
 * conversa com a Data API do Neon. Escritos à mão e mantidos em sincronia com
 * database/migrations — toda mudança de schema precisa atualizar este arquivo.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type PublicationStatus = 'draft' | 'published' | 'unpublished' | 'suspended';
type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'scam' | 'other';
type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
/** Cargo gravado em user_roles. Sem linha = empreendedora. */
type MemberRole = 'developer' | 'administrator';
/** Cargo efetivo devolvido por my_role() e list_members(). */
export type RoleName = MemberRole | 'entrepreneur';

type UsersRow = {
  id: string;
  full_name: string;
  email: string;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
  updated_at: string;
};

export type EntrepreneurProfileRow = {
  id: string;
  /** Nulo = perfil cadastrado pela organização do grupo (sem conta própria no app). */
  user_id: string | null;
  business_name: string;
  entrepreneur_name: string;
  service_description: string;
  logo_url: string | null;
  profile_image_url: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  instagram_url: string | null;
  website_url: string | null;
  contact_url: string | null;
  serves_nationwide: boolean;
  community_perks: string[];
  publication_status: PublicationStatus;
  public_consent_at: string | null;
  published_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  sort_name: string | null;
  search_text: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      users: {
        Row: UsersRow;
        Insert: {
          id: string;
          full_name: string;
          email?: string;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role: MemberRole; created_at: string };
        Insert: { user_id: string; role: MemberRole; created_at?: string };
        Update: { user_id?: string; role?: MemberRole; created_at?: string };
        Relationships: [];
      };
      entrepreneur_profiles: {
        Row: EntrepreneurProfileRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          business_name: string;
          entrepreneur_name: string;
          service_description: string;
          logo_url?: string | null;
          profile_image_url?: string | null;
          category?: string | null;
          city?: string | null;
          state?: string | null;
          instagram_url?: string | null;
          website_url?: string | null;
          contact_url?: string | null;
          serves_nationwide?: boolean;
          community_perks?: string[];
          publication_status?: PublicationStatus;
          public_consent_at?: string | null;
        };
        Update: {
          business_name?: string;
          entrepreneur_name?: string;
          service_description?: string;
          logo_url?: string | null;
          profile_image_url?: string | null;
          category?: string | null;
          city?: string | null;
          state?: string | null;
          instagram_url?: string | null;
          website_url?: string | null;
          contact_url?: string | null;
          serves_nationwide?: boolean;
          community_perks?: string[];
          publication_status?: PublicationStatus;
          public_consent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'entrepreneur_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_reports: {
        Row: {
          id: string;
          profile_id: string;
          reporter_id: string | null;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          resolution_note: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          reporter_id?: string | null;
          reason: ReportReason;
          details?: string | null;
          status?: ReportStatus;
        };
        Update: {
          status?: ReportStatus;
          resolution_note?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_reports_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'entrepreneur_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_audit_log: {
        Row: {
          id: number;
          profile_id: string;
          actor_id: string | null;
          action: string;
          old_status: PublicationStatus | null;
          new_status: PublicationStatus | null;
          changed_fields: string[];
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      search_entrepreneur_profiles: {
        Args: {
          search_query?: string;
          category_filter?: string | null;
          page_size?: number;
          page_offset?: number;
        };
        Returns: EntrepreneurProfileRow[];
        SetofOptions: {
          from: '*';
          to: 'entrepreneur_profiles';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      delete_my_account: { Args: never; Returns: undefined };
      ensure_my_account: { Args: { p_terms_version?: string | null }; Returns: UsersRow };
      is_moderator: { Args: never; Returns: boolean };
      is_developer: { Args: never; Returns: boolean };
      my_role: { Args: never; Returns: RoleName };
      list_members: {
        Args: { search?: string; page_size?: number };
        Returns: { id: string; full_name: string; email: string; role: RoleName; created_at: string }[];
      };
      set_member_role: { Args: { target_user_id: string; new_role: RoleName }; Returns: undefined };
      set_member_role_by_email: {
        Args: { target_email: string; new_role: RoleName };
        Returns: { id: string; email: string; role: RoleName }[];
      };
      list_open_reports: {
        Args: { page_size?: number };
        Returns: {
          id: string;
          profile_id: string;
          business_name: string;
          publication_status: PublicationStatus;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          created_at: string;
        }[];
      };
      moderate_profile: {
        Args: { target_profile_id: string; new_status: PublicationStatus; reason?: string | null };
        Returns: undefined;
      };
      normalize_search_text: { Args: { value: string }; Returns: string };
      escape_like: { Args: { value: string }; Returns: string };
    };
    Enums: {
      publication_status: PublicationStatus;
      report_reason: ReportReason;
      report_status: ReportStatus;
      member_role: MemberRole;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
