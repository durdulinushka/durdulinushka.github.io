export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_members: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          head_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          head_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          head_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          access_type: string
          allowed_users: Json | null
          created_at: string
          department: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string | null
          title: string
          updated_at: string
          uploader_id: string
        }
        Insert: {
          access_type?: string
          allowed_users?: Json | null
          created_at?: string
          department?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
          uploader_id: string
        }
        Update: {
          access_type?: string
          allowed_users?: Json | null
          created_at?: string
          department?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          message_type: string
          reply_to: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string
          reply_to?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string
          reply_to?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      note_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          note_id: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          note_id: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          note_id?: string
          uploader_id?: string
        }
        Relationships: []
      }
      personal_notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          employee_id: string
          id: string
          position_x: number | null
          position_y: number | null
          reminder_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          employee_id: string
          id?: string
          position_x?: number | null
          position_y?: number | null
          reminder_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          position_x?: number | null
          position_y?: number | null
          reminder_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_hours: number | null
          department: string
          email: string
          full_name: string
          id: string
          position: string
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_hours?: number | null
          department: string
          email: string
          full_name: string
          id?: string
          position: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_hours?: number | null
          department?: string
          email?: string
          full_name?: string
          id?: string
          position?: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          added_at: string
          employee_id: string
          id: string
          project_id: string
          role: string | null
        }
        Insert: {
          added_at?: string
          employee_id: string
          id?: string
          project_id: string
          role?: string | null
        }
        Update: {
          added_at?: string
          employee_id?: string
          id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          creator_id: string
          department: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          department: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          department?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_views: {
        Row: {
          created_at: string
          id: string
          report_id: string
          report_type: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_id: string
          report_type: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_id?: string
          report_type?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_documents: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          task_id: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_documents_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          creator_id: string | null
          department: string
          description: string | null
          due_date: string | null
          id: string
          planned_date: string | null
          priority: string | null
          project_id: string | null
          start_date: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string
          viewed_by: Json | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string | null
          department: string
          description?: string | null
          due_date?: string | null
          id?: string
          planned_date?: string | null
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string
          viewed_by?: Json | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string | null
          department?: string
          description?: string | null
          due_date?: string | null
          id?: string
          planned_date?: string | null
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string
          viewed_by?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_pauses: {
        Row: {
          created_at: string
          id: string
          pause_end: string | null
          pause_start: string
          time_tracking_id: string
          worked_time_before_pause: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          pause_end?: string | null
          pause_start: string
          time_tracking_id: string
          worked_time_before_pause?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          pause_end?: string | null
          pause_start?: string
          time_tracking_id?: string
          worked_time_before_pause?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "time_pauses_time_tracking_id_fkey"
            columns: ["time_tracking_id"]
            isOneToOne: false
            referencedRelation: "time_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          end_time: string | null
          id: string
          login_time: string | null
          pause_duration: number | null
          start_time: string | null
          status: string | null
          task_id: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          employee_id: string
          end_time?: string | null
          id?: string
          login_time?: string | null
          pause_duration?: number | null
          start_time?: string | null
          status?: string | null
          task_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          end_time?: string | null
          id?: string
          login_time?: string | null
          pause_duration?: number | null
          start_time?: string | null
          status?: string | null
          task_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_overdue_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_overdue: number
          overdue_urgent: number
          overdue_long_term: number
          days_overdue_avg: number
        }[]
      }
      is_chat_admin: {
        Args: { chat_id: string; user_id: string }
        Returns: boolean
      }
      is_chat_member: {
        Args: { chat_id: string; user_id: string }
        Returns: boolean
      }
      refresh_overdue_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_overdue_tasks: {
        Args: Record<PropertyKey, never>
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
  public: {
    Enums: {},
  },
} as const
