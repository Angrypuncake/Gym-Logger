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
      exercises: {
        Row: {
          id: string
          modality: Database["public"]["Enums"]["modality"]
          name: string
          vault_id: string
        }
        Insert: {
          id?: string
          modality: Database["public"]["Enums"]["modality"]
          name: string
          vault_id: string
        }
        Update: {
          id?: string
          modality?: Database["public"]["Enums"]["modality"]
          name?: string
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
          date: string
          finished_at: string | null
          id: string
          notes: string | null
          template_id: string
          vault_id: string
        }
        Insert: {
          date?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          template_id: string
          vault_id: string
        }
        Update: {
          date?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          template_id?: string
          vault_id?: string
        }
        Relationships: [
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      modality: "REPS" | "ISOMETRIC"
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
      modality: ["REPS", "ISOMETRIC"],
    },
  },
} as const
