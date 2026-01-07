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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      anatomical_targets: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["anatomical_target_kind"]
          name: string
          parent_id: string | null
          slug: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["anatomical_target_kind"]
          name: string
          parent_id?: string | null
          slug: string
          vault_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["anatomical_target_kind"]
          name?: string
          parent_id?: string | null
          slug?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anatomical_targets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "anatomical_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anatomical_targets_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_prs: {
        Row: {
          achieved_at: string
          exercise_id: string
          id: string
          pr_type: Database["public"]["Enums"]["pr_type"]
          session_id: string
          set_id: string
          value: number
          vault_id: string
        }
        Insert: {
          achieved_at?: string
          exercise_id: string
          id?: string
          pr_type: Database["public"]["Enums"]["pr_type"]
          session_id: string
          set_id: string
          value: number
          vault_id: string
        }
        Update: {
          achieved_at?: string
          exercise_id?: string
          id?: string
          pr_type?: Database["public"]["Enums"]["pr_type"]
          session_id?: string
          set_id?: string
          value?: number
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_prs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_prs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_summaries"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "exercise_prs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_prs_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_prs_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_targets: {
        Row: {
          created_at: string
          exercise_id: string
          role: Database["public"]["Enums"]["anatomical_target_role"]
          target_id: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          role?: Database["public"]["Enums"]["anatomical_target_role"]
          target_id: string
          vault_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          role?: Database["public"]["Enums"]["anatomical_target_role"]
          target_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_targets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_targets_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "anatomical_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_targets_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          id: string
          modality: Database["public"]["Enums"]["modality"]
          name: string
          uses_bodyweight: boolean
          vault_id: string
        }
        Insert: {
          id?: string
          modality: Database["public"]["Enums"]["modality"]
          name: string
          uses_bodyweight?: boolean
          vault_id: string
        }
        Update: {
          id?: string
          modality?: Database["public"]["Enums"]["modality"]
          name?: string
          uses_bodyweight?: boolean
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_vault_fk"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_events: {
        Row: {
          achieved_at: string
          exercise_id: string
          id: string
          pr_type: Database["public"]["Enums"]["pr_type"]
          session_id: string
          set_id: string
          value: number
          vault_id: string
        }
        Insert: {
          achieved_at?: string
          exercise_id: string
          id?: string
          pr_type: Database["public"]["Enums"]["pr_type"]
          session_id: string
          set_id: string
          value: number
          vault_id: string
        }
        Update: {
          achieved_at?: string
          exercise_id?: string
          id?: string
          pr_type?: Database["public"]["Enums"]["pr_type"]
          session_id?: string
          set_id?: string
          value?: number
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pr_events_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_summaries"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "pr_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_events_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_events_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          duration_sec: number | null
          entry_id: string
          id: string
          reps: number | null
          set_index: number
          skipped: boolean | null
          vault_id: string
          weight_kg: number | null
        }
        Insert: {
          duration_sec?: number | null
          entry_id: string
          id?: string
          reps?: number | null
          set_index: number
          skipped?: boolean | null
          vault_id: string
          weight_kg?: number | null
        }
        Update: {
          duration_sec?: number | null
          entry_id?: string
          id?: string
          reps?: number | null
          set_index?: number
          skipped?: boolean | null
          vault_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sets_entry_fk"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "workout_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_vault_fk"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      template_items: {
        Row: {
          exercise_id: string
          id: string
          order: number
          rep_max: number | null
          rep_min: number | null
          target_sets: number | null
          template_id: string
          vault_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          order: number
          rep_max?: number | null
          rep_min?: number | null
          target_sets?: number | null
          template_id: string
          vault_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          order?: number
          rep_max?: number | null
          rep_min?: number | null
          target_sets?: number | null
          template_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_items_exercise_fk"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_template_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_vault_fk"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          id: string
          name: string
          order: number
          vault_id: string
        }
        Insert: {
          id?: string
          name: string
          order: number
          vault_id: string
        }
        Update: {
          id?: string
          name?: string
          order?: number
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_vault_fk"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      workout_entries: {
        Row: {
          exercise_id: string
          id: string
          order: number
          session_id: string
          vault_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          order: number
          session_id: string
          vault_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          order?: number
          session_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_entries_exercise_fk"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_entries_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_summaries"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "workout_entries_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_entries_vault_fk"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          body_weight_kg: number | null
          date: string
          finished_at: string | null
          id: string
          notes: string | null
          planned_template_id: string | null
          rpe: number | null
          session_date: string
          tags: string[] | null
          template_id: string
          vault_id: string
        }
        Insert: {
          body_weight_kg?: number | null
          date?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          planned_template_id?: string | null
          rpe?: number | null
          session_date: string
          tags?: string[] | null
          template_id: string
          vault_id: string
        }
        Update: {
          body_weight_kg?: number | null
          date?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          planned_template_id?: string | null
          rpe?: number | null
          session_date?: string
          tags?: string[] | null
          template_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_planned_template_fk"
            columns: ["planned_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_template_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_vault_fk"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      session_summaries: {
        Row: {
          body_weight_kg: number | null
          exercise_count: number | null
          finished_at: string | null
          has_pr: boolean | null
          logged_sets: number | null
          modalities: string[] | null
          planned_sets: number | null
          planned_template_id: string | null
          rpe: number | null
          session_date: string | null
          session_id: string | null
          started_at: string | null
          tags: string[] | null
          template_id: string | null
          template_name: string | null
          vault_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_planned_template_fk"
            columns: ["planned_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_template_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_vault_fk"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      anatomical_target_kind: "MUSCLE_GROUP" | "TENDON"
      anatomical_target_role: "PRIMARY" | "SECONDARY" | "STABILIZER"
      modality: "REPS" | "ISOMETRIC"
      pr_type: "REPS_MAX_WEIGHT" | "REPS_MAX_REPS" | "ISO_MAX_DURATION"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      anatomical_target_kind: ["MUSCLE_GROUP", "TENDON"],
      anatomical_target_role: ["PRIMARY", "SECONDARY", "STABILIZER"],
      modality: ["REPS", "ISOMETRIC"],
      pr_type: ["REPS_MAX_WEIGHT", "REPS_MAX_REPS", "ISO_MAX_DURATION"],
    },
  },
} as const
