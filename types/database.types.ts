export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["category_level"]
          name: string
          partner_type: Database["public"]["Enums"]["partner_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          level: Database["public"]["Enums"]["category_level"]
          name: string
          partner_type: Database["public"]["Enums"]["partner_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["category_level"]
          name?: string
          partner_type?: Database["public"]["Enums"]["partner_type"]
        }
        Relationships: []
      }
      courts: {
        Row: {
          created_at: string
          id: string
          name: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      group_teams: {
        Row: {
          created_at: string
          group_id: string
          id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          team_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          category_id: string
          completed_at: string | null
          court_id: string | null
          created_at: string
          current_point_a: string
          current_point_b: string
          games_team_a: number
          games_team_b: number
          group_id: string | null
          id: string
          round: Database["public"]["Enums"]["match_round"]
          scheduled_time: string | null
          status: Database["public"]["Enums"]["match_status"]
          team_a_id: string
          team_b_id: string
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          category_id: string
          completed_at?: string | null
          court_id?: string | null
          created_at?: string
          current_point_a?: string
          current_point_b?: string
          games_team_a?: number
          games_team_b?: number
          group_id?: string | null
          id?: string
          round: Database["public"]["Enums"]["match_round"]
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team_a_id: string
          team_b_id: string
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          category_id?: string
          completed_at?: string | null
          court_id?: string | null
          created_at?: string
          current_point_a?: string
          current_point_b?: string
          games_team_a?: number
          games_team_b?: number
          group_id?: string | null
          id?: string
          round?: Database["public"]["Enums"]["match_round"]
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team_a_id?: string
          team_b_id?: string
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          category_id: string
          created_at: string
          id: string
          instagram_handle: string | null
          payment_proof_url: string | null
          phone_number: string
          player1_name: string
          player2_name: string
          reclub_handle: string | null
          status: Database["public"]["Enums"]["team_status"]
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          instagram_handle?: string | null
          payment_proof_url?: string | null
          phone_number: string
          player1_name: string
          player2_name: string
          reclub_handle?: string | null
          status?: Database["public"]["Enums"]["team_status"]
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          instagram_handle?: string | null
          payment_proof_url?: string | null
          phone_number?: string
          player1_name?: string
          player2_name?: string
          reclub_handle?: string | null
          status?: Database["public"]["Enums"]["team_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_settings: {
        Row: {
          created_at: string
          daily_end_time: string
          daily_start_time: string
          golden_point_enabled: boolean
          id: string
          match_duration_minutes: number
          name: string
          number_of_courts: number
          status: Database["public"]["Enums"]["tournament_status"]
          team_per_group: number
          third_place_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_end_time?: string
          daily_start_time?: string
          golden_point_enabled?: boolean
          id?: string
          match_duration_minutes?: number
          name: string
          number_of_courts?: number
          status?: Database["public"]["Enums"]["tournament_status"]
          team_per_group?: number
          third_place_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_end_time?: string
          daily_start_time?: string
          golden_point_enabled?: boolean
          id?: string
          match_duration_minutes?: number
          name?: string
          number_of_courts?: number
          status?: Database["public"]["Enums"]["tournament_status"]
          team_per_group?: number
          third_place_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      standings: {
        Row: {
          drawn: number | null
          game_diff: number | null
          games_against: number | null
          games_for: number | null
          group_id: string | null
          lost: number | null
          played: number | null
          points: number | null
          team_id: string | null
          won: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin_user: { Args: never; Returns: boolean }
    }
    Enums: {
      category_level: "beginner" | "lower_bronze" | "bronze"
      match_round: "group" | "semifinal" | "final" | "third_place"
      match_status: "scheduled" | "live" | "completed" | "walkover"
      partner_type: "fix" | "mix"
      team_status: "pending" | "confirmed" | "rejected"
      tournament_status: "draft" | "draw_done" | "ongoing" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      category_level: ["beginner", "lower_bronze", "bronze"],
      match_round: ["group", "semifinal", "final", "third_place"],
      match_status: ["scheduled", "live", "completed", "walkover"],
      partner_type: ["fix", "mix"],
      team_status: ["pending", "confirmed", "rejected"],
      tournament_status: ["draft", "draw_done", "ongoing", "completed"],
    },
  },
} as const
