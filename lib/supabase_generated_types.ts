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
      assessments: {
        Row: {
          id: string
          company_id: string
          application_id: string
          title: string
          description: string
          deadline: string | null
          status: "pending" | "submitted" | "reviewed"
          questions: Json | null
          submission: Json | null
          score: number | null
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          application_id: string
          title: string
          description: string
          deadline?: string | null
          status?: "pending" | "submitted" | "reviewed"
          questions?: Json | null
          submission?: Json | null
          score?: number | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          application_id?: string
          title?: string
          description?: string
          deadline?: string | null
          status?: "pending" | "submitted" | "reviewed"
          questions?: Json | null
          submission?: Json | null
          score?: number | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
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
          id: string
          name: string
          description: string
          industry: string | null
          website: string | null
          logo_url: string | null
          location: string | null
          size: string | null
          founded_year: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string
          industry?: string | null
          website?: string | null
          logo_url?: string | null
          location?: string | null
          size?: string | null
          founded_year?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          industry?: string | null
          website?: string | null
          logo_url?: string | null
          location?: string | null
          size?: string | null
          founded_year?: string | null
          created_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          status: "applied" | "under_review" | "assessment_sent" | "assessment_completed" | "shortlisted" | "rejected"
          cover_letter: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          applicant_id: string
          status?: "applied" | "under_review" | "assessment_sent" | "assessment_completed" | "shortlisted" | "rejected"
          cover_letter?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          applicant_id?: string
          status?: "applied" | "under_review" | "assessment_sent" | "assessment_completed" | "shortlisted" | "rejected"
          cover_letter?: string | null
          created_at?: string
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
      jobs: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string
          location: string | null
          type: "Full-time" | "Part-time" | "Remote" | "Hybrid" | "Contract" | "Internship"
          salary_range: string | null
          requirements: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description: string
          location?: string | null
          type?: "Full-time" | "Part-time" | "Remote" | "Hybrid" | "Contract" | "Internship"
          salary_range?: string | null
          requirements?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string
          location?: string | null
          type?: "Full-time" | "Part-time" | "Remote" | "Hybrid" | "Contract" | "Internship"
          salary_range?: string | null
          requirements?: string | null
          is_active?: boolean
          created_at?: string
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
          bio: string
          cv_url: string | null
          degree: string | null
          edu_end: string | null
          edu_start: string | null
          first_name: string
          github: string | null
          gpa: string | null
          id: string
          institution: string | null
          joined_date: string
          last_name: string
          location: string | null
          logo_url: string | null
          role: "job_seeker" | "company"
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          cv_url?: string | null
          degree?: string | null
          edu_end?: string | null
          edu_start?: string | null
          first_name?: string
          github?: string | null
          gpa?: string | null
          id: string
          institution?: string | null
          joined_date?: string
          last_name?: string
          location?: string | null
          logo_url?: string | null
          role?: "job_seeker" | "company"
          username?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          cv_url?: string | null
          degree?: string | null
          edu_end?: string | null
          edu_start?: string | null
          first_name?: string
          github?: string | null
          gpa?: string | null
          id?: string
          institution?: string | null
          joined_date?: string
          last_name?: string
          location?: string | null
          logo_url?: string | null
          role?: "job_seeker" | "company"
          username?: string
          website?: string | null
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
      [_ in never]: never
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
