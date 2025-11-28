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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_analysis_history: {
        Row: {
          ai_output: Json | null
          created_at: string | null
          id: string
          input_data: Json | null
          user_id: string
        }
        Insert: {
          ai_output?: Json | null
          created_at?: string | null
          id?: string
          input_data?: Json | null
          user_id: string
        }
        Update: {
          ai_output?: Json | null
          created_at?: string | null
          id?: string
          input_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ai_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_profiles: {
        Row: {
          branch: string | null
          created_at: string | null
          id: string
          malgrupp: string | null
          malsattning: string | null
          marknadsplan: string | null
          prisniva: string | null
          produkt_beskrivning: string | null
          sprakpreferens: string | null
          tonalitet: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branch?: string | null
          created_at?: string | null
          id?: string
          malgrupp?: string | null
          malsattning?: string | null
          marknadsplan?: string | null
          prisniva?: string | null
          produkt_beskrivning?: string | null
          sprakpreferens?: string | null
          tonalitet?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branch?: string | null
          created_at?: string | null
          id?: string
          malgrupp?: string | null
          malsattning?: string | null
          marknadsplan?: string | null
          prisniva?: string | null
          produkt_beskrivning?: string | null
          sprakpreferens?: string | null
          tonalitet?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics: {
        Row: {
          engagement: number | null
          followers: number | null
          history: Json | null
          id: string
          platform: string
          reach: number | null
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          engagement?: number | null
          followers?: number | null
          history?: Json | null
          id?: string
          platform: string
          reach?: number | null
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          engagement?: number | null
          followers?: number | null
          history?: Json | null
          id?: string
          platform?: string
          reach?: number | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      calendar_posts: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          platform: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          platform: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          platform?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          id: string
          message: string
          role: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message: string
          role: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message?: string
          role?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          account_id: string
          connected_at: string
          id: string
          provider: Database["public"]["Enums"]["social_provider"]
          user_id: string
          username: string | null
        }
        Insert: {
          account_id: string
          connected_at?: string
          id?: string
          provider: Database["public"]["Enums"]["social_provider"]
          user_id: string
          username?: string | null
        }
        Update: {
          account_id?: string
          connected_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["social_provider"]
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consented_at: string
          id: string
          policy_version: string
          user_id: string
        }
        Insert: {
          consented_at?: string
          id?: string
          policy_version?: string
          user_id: string
        }
        Update: {
          consented_at?: string
          id?: string
          policy_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          sender_id: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          sender_id?: string | null
          sender_type: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          sender_id?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: []
      }
      live_chat_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          id: string
          session_id: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          session_id: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          session_id?: string
          status?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          captured_at: string
          connection_id: string
          id: string
          metric_type: string
          period: string | null
          provider: Database["public"]["Enums"]["social_provider"]
          user_id: string
          value: number
        }
        Insert: {
          captured_at?: string
          connection_id: string
          id?: string
          metric_type: string
          period?: string | null
          provider: Database["public"]["Enums"]["social_provider"]
          user_id: string
          value: number
        }
        Update: {
          captured_at?: string
          connection_id?: string
          id?: string
          metric_type?: string
          period?: string | null
          provider?: Database["public"]["Enums"]["social_provider"]
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          discord_webhook_url: string | null
          id: string
          notification_email: string | null
          recipient_phone_number: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discord_webhook_url?: string | null
          id?: string
          notification_email?: string | null
          recipient_phone_number?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discord_webhook_url?: string | null
          id?: string
          notification_email?: string | null
          recipient_phone_number?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          code_verifier: string | null
          consumed: boolean
          consumed_at: string | null
          created_at: string
          id: string
          provider: string
          state_token: string
          user_id: string
        }
        Insert: {
          code_verifier?: string | null
          consumed?: boolean
          consumed_at?: string | null
          created_at?: string
          id?: string
          provider: string
          state_token: string
          user_id: string
        }
        Update: {
          code_verifier?: string | null
          consumed?: boolean
          consumed_at?: string | null
          created_at?: string
          id?: string
          provider?: string
          state_token?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          last_request: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          last_request?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          endpoint?: string
          id?: string
          last_request?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      social_stats: {
        Row: {
          comments: number | null
          followers: number | null
          id: string
          impressions: number | null
          likes: number | null
          platform: string
          profile_views: number | null
          reach: number | null
          shares: number | null
          top_posts: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform: string
          profile_views?: number | null
          reach?: number | null
          shares?: number | null
          top_posts?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          profile_views?: number | null
          reach?: number | null
          shares?: number | null
          top_posts?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          best_time: string | null
          caption: string
          created_at: string
          credits_spent: number
          hashtags: string[]
          id: string
          idea: string
          platform: string
          user_id: string
        }
        Insert: {
          best_time?: string | null
          caption: string
          created_at?: string
          credits_spent?: number
          hashtags: string[]
          id?: string
          idea: string
          platform: string
          user_id: string
        }
        Update: {
          best_time?: string | null
          caption?: string
          created_at?: string
          credits_spent?: number
          hashtags?: string[]
          id?: string
          idea?: string
          platform?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          access_token_enc: string
          created_at: string
          expires_at: string | null
          id: string
          provider: Database["public"]["Enums"]["social_provider"]
          refresh_token_enc: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_enc: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: Database["public"]["Enums"]["social_provider"]
          refresh_token_enc?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_enc?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["social_provider"]
          refresh_token_enc?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          company_name: string | null
          created_at: string
          credits_left: number
          credits_used: number | null
          deleted_at: string | null
          deletion_scheduled_at: string | null
          email: string
          id: string
          industry: string | null
          keywords: string[] | null
          max_credits: number | null
          plan: Database["public"]["Enums"]["user_plan"]
          renewal_date: string | null
          trial_used: boolean
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          credits_left?: number
          credits_used?: number | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          email: string
          id: string
          industry?: string | null
          keywords?: string[] | null
          max_credits?: number | null
          plan?: Database["public"]["Enums"]["user_plan"]
          renewal_date?: string | null
          trial_used?: boolean
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          credits_left?: number
          credits_used?: number | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          email?: string
          id?: string
          industry?: string | null
          keywords?: string[] | null
          max_credits?: number | null
          plan?: Database["public"]["Enums"]["user_plan"]
          renewal_date?: string | null
          trial_used?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { _endpoint: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          _event_details?: Json
          _event_type: string
          _ip_address?: string
          _user_agent?: string
          _user_id: string
        }
        Returns: string
      }
      soft_delete_user_account: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      social_provider: "meta_ig" | "meta_fb" | "tiktok"
      user_plan: "free_trial" | "pro" | "pro_xl" | "pro_unlimited"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
      social_provider: ["meta_ig", "meta_fb", "tiktok"],
      user_plan: ["free_trial", "pro", "pro_xl", "pro_unlimited"],
    },
  },
} as const
