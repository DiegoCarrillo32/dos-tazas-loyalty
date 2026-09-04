/**
 * Database types for the loyalty schema.
 *
 * Hand-authored to match supabase/migrations/. Regenerate against the live
 * project once it exists:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public \
 *     > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          national_id: string;
          phone: string;
          full_name: string;
          card_token: string;
          auth_user_id: string | null;
          tier: "basic" | "member";
          birthday: string | null;
          points_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: { birthday?: string | null };
        Relationships: [];
      };
      rewards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          points_cost: number;
          member_only: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          points_cost: number;
          member_only?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<{
          name: string;
          description: string | null;
          points_cost: number;
          member_only: boolean;
          is_active: boolean;
          sort_order: number;
        }>;
        Relationships: [];
      };
      point_transactions: {
        Row: {
          id: string;
          member_id: string;
          kind: "earn" | "redeem" | "adjust";
          points: number;
          purchase_amount: number | null;
          reward_id: string | null;
          staff_id: string | null;
          note: string | null;
          client_request_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        // Declared so PostgREST embedded selects — `rewards(name)` on the
        // account history — typecheck against the real foreign keys.
        Relationships: [
          {
            foreignKeyName: "point_transactions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "point_transactions_reward_id_fkey";
            columns: ["reward_id"];
            isOneToOne: false;
            referencedRelation: "rewards";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          id: string;
          full_name: string;
          role: "admin" | "barista";
          created_at: string;
        };
        Insert: { id: string; full_name: string; role?: "admin" | "barista" };
        Update: Partial<{ full_name: string; role: "admin" | "barista" }>;
        Relationships: [];
      };
      loyalty_settings: {
        Row: { id: boolean; colones_per_point: number; updated_at: string };
        Insert: never;
        Update: { colones_per_point?: number };
        Relationships: [];
      };
      lookup_attempts: {
        Row: { id: number; national_id: string; succeeded: boolean; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      register_member: {
        Args: { p_national_id: string; p_phone: string; p_full_name: string };
        Returns: Json;
      };
      lookup_member: {
        Args: { p_national_id: string; p_phone: string };
        Returns: Json;
      };
      link_member_to_auth: {
        Args: { p_national_id: string; p_phone: string };
        Returns: Json;
      };
      staff_lookup_member: {
        Args: { p_card_token: string };
        Returns: Json;
      };
      staff_add_points: {
        Args: { p_card_token: string; p_purchase_amount: number; p_client_request_id: string };
        Returns: Json;
      };
      staff_redeem_points: {
        Args: { p_card_token: string; p_reward_id: string; p_client_request_id: string };
        Returns: Json;
      };
      rotate_card_token: {
        Args: { p_member_id: string };
        Returns: Json;
      };
      is_staff: { Args: Record<never, never>; Returns: boolean };
      is_staff_admin: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
