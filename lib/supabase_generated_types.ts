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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          target_id: string
          target_label: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id: string
          target_label: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string
          target_label?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          added_at: string
          id: string
        }
        Insert: {
          added_at?: string
          id: string
        }
        Update: {
          added_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          questions: Json
          tags: string[]
          time_limit: number | null
          title: string
          updated_at: string
          use_count: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          id?: string
          questions?: Json
          tags?: string[]
          time_limit?: number | null
          title: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          questions?: Json
          tags?: string[]
          time_limit?: number | null
          title?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          application_id: string
          company_id: string
          created_at: string
          deadline: string | null
          description: string
          feedback: string | null
          id: string
          questions: Json | null
          results_released: boolean
          score: number | null
          status: string
          submission: Json | null
          time_limit: number | null
          title: string
          updated_at: string
        }
        Insert: {
          application_id: string
          company_id: string
          created_at?: string
          deadline?: string | null
          description: string
          feedback?: string | null
          id?: string
          questions?: Json | null
          results_released?: boolean
          score?: number | null
          status?: string
          submission?: Json | null
          time_limit?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          feedback?: string | null
          id?: string
          questions?: Json | null
          results_released?: boolean
          score?: number | null
          status?: string
          submission?: Json | null
          time_limit?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          date: string
          id: number
          image: string
          issuer: string
          name: string
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: number
          image: string
          issuer: string
          name: string
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: number
          image?: string
          issuer?: string
          name?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          description: string
          founded_year: string | null
          id: string
          industry: string | null
          is_verified: boolean
          location: string | null
          logo_url: string | null
          name: string
          size: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          founded_year?: string | null
          id: string
          industry?: string | null
          is_verified?: boolean
          location?: string | null
          logo_url?: string | null
          name: string
          size?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          founded_year?: string | null
          id?: string
          industry?: string | null
          is_verified?: boolean
          location?: string | null
          logo_url?: string | null
          name?: string
          size?: string | null
          website?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          application_id: string
          company_id: string
          created_at: string | null
          id: string
          job_seeker_id: string
        }
        Insert: {
          application_id: string
          company_id: string
          created_at?: string | null
          id?: string
          job_seeker_id: string
        }
        Update: {
          application_id?: string
          company_id?: string
          created_at?: string | null
          id?: string
          job_seeker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_seeker_id_fkey"
            columns: ["job_seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          improvements: string | null
          question_index: number
          question_text: string
          score: number | null
          session_id: string
          strengths: string | null
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          improvements?: string | null
          question_index: number
          question_text: string
          score?: number | null
          session_id: string
          strengths?: string | null
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          improvements?: string | null
          question_index?: number
          question_text?: string
          score?: number | null
          session_id?: string
          strengths?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          interview_type: string
          job_description: string
          job_title: string
          level: string
          overall_score: number | null
          overall_summary: string | null
          question_count: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          interview_type: string
          job_description: string
          job_title: string
          level: string
          overall_score?: number | null
          overall_summary?: string | null
          question_count: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          interview_type?: string
          job_description?: string
          job_title?: string
          level?: string
          overall_score?: number | null
          overall_summary?: string | null
          question_count?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reports: {
        Row: {
          created_at: string
          id: string
          job_id: string
          reason: string
          reported_by: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          reason: string
          reported_by: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          reason?: string
          reported_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_seeker_profiles: {
        Row: {
          bio: string
          cv_url: string | null
          degree: string | null
          edu_end: string | null
          edu_start: string | null
          github: string | null
          gpa: string | null
          id: string
          institution: string | null
          location: string | null
          website: string | null
        }
        Insert: {
          bio?: string
          cv_url?: string | null
          degree?: string | null
          edu_end?: string | null
          edu_start?: string | null
          github?: string | null
          gpa?: string | null
          id: string
          institution?: string | null
          location?: string | null
          website?: string | null
        }
        Update: {
          bio?: string
          cv_url?: string | null
          degree?: string | null
          edu_end?: string | null
          edu_start?: string | null
          github?: string | null
          gpa?: string | null
          id?: string
          institution?: string | null
          location?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_seeker_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_to_skills: {
        Row: {
          id: number
          job_id: string
          skill_id: number
        }
        Insert: {
          id?: never
          job_id: string
          skill_id: number
        }
        Update: {
          id?: never
          job_id?: string
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_to_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_to_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          admin_locked: boolean
          company_id: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          location: string | null
          requirements: string | null
          salary_range: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_locked?: boolean
          company_id: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          admin_locked?: boolean
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          job_id: string | null
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_to_skills: {
        Row: {
          id: number
          skill_id: number | null
          user_id: string | null
        }
        Insert: {
          id?: number
          skill_id?: number | null
          user_id?: string | null
        }
        Update: {
          id?: number
          skill_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_to_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string
          id: string
          is_blocked: boolean
          is_suspended: boolean
          joined_date: string
          last_name: string
          role: string
          suspension_reason: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string
          id: string
          is_blocked?: boolean
          is_suspended?: boolean
          joined_date?: string
          last_name?: string
          role?: string
          suspension_reason?: string | null
          username?: string
        }
        Update: {
          avatar_url?: string | null
          first_name?: string
          id?: string
          is_blocked?: boolean
          is_suspended?: boolean
          joined_date?: string
          last_name?: string
          role?: string
          suspension_reason?: string | null
          username?: string
        }
        Relationships: []
      }
      project_to_skills: {
        Row: {
          id: number
          project_id: number
          skill_id: number
        }
        Insert: {
          id?: number
          project_id: number
          skill_id: number
        }
        Update: {
          id?: number
          project_id?: number
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_to_skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_to_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string
          id: number
          name: string
          status: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: number
          name: string
          status: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: number
          name?: string
          status?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          job_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          job_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          job_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          id: number
          logo_url: string
          name: string
        }
        Insert: {
          id?: number
          logo_url: string
          name: string
        }
        Update: {
          id?: number
          logo_url?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      promote_to_admin: {
        Args: { admin_name: string; admin_username: string; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
