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
      accessibility_issues: {
        Row: {
          audit_id: string
          created_at: string | null
          description: string
          element_selector: string | null
          id: string
          rule: string
          severity: string
          suggested_fix: string | null
          wcag_criteria: string[] | null
        }
        Insert: {
          audit_id: string
          created_at?: string | null
          description: string
          element_selector?: string | null
          id?: string
          rule: string
          severity: string
          suggested_fix?: string | null
          wcag_criteria?: string[] | null
        }
        Update: {
          audit_id?: string
          created_at?: string | null
          description?: string
          element_selector?: string | null
          id?: string
          rule?: string
          severity?: string
          suggested_fix?: string | null
          wcag_criteria?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "accessibility_issues_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "quality_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          duration_ms: number | null
          event_type: string
          id: string
          metadata: Json | null
          project_id: string
          screenshot_url: string | null
          session_id: string
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          metadata?: Json | null
          project_id: string
          screenshot_url?: string | null
          session_id: string
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          screenshot_url?: string | null
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          action_url: string | null
          affected_area: string | null
          affected_entities: Json | null
          category: string | null
          confidence: number
          created_at: string | null
          data_points: Json | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_resolved: boolean | null
          metadata: Json | null
          project_id: string
          recommendation: string | null
          related_test_ids: string[] | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          suggested_action: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          affected_area?: string | null
          affected_entities?: Json | null
          category?: string | null
          confidence: number
          created_at?: string | null
          data_points?: Json | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_resolved?: boolean | null
          metadata?: Json | null
          project_id: string
          recommendation?: string | null
          related_test_ids?: string[] | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          suggested_action?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          affected_area?: string | null
          affected_entities?: Json | null
          category?: string | null
          confidence?: number
          created_at?: string | null
          data_points?: Json | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          project_id?: string
          recommendation?: string | null
          related_test_ids?: string[] | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_action?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          cached: boolean | null
          cost_usd: number
          created_at: string | null
          id: string
          input_tokens: number
          latency_ms: number | null
          metadata: Json | null
          model: string
          organization_id: string
          output_tokens: number
          project_id: string | null
          provider: string
          request_id: string
          task_type: string
          total_tokens: number | null
        }
        Insert: {
          cached?: boolean | null
          cost_usd?: number
          created_at?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          metadata?: Json | null
          model: string
          organization_id: string
          output_tokens?: number
          project_id?: string | null
          provider?: string
          request_id: string
          task_type: string
          total_tokens?: number | null
        }
        Update: {
          cached?: boolean | null
          cost_usd?: number
          created_at?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          metadata?: Json | null
          model?: string
          organization_id?: string
          output_tokens?: number
          project_id?: string | null
          provider?: string
          request_id?: string
          task_type?: string
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_daily: {
        Row: {
          cache_hits: number | null
          cache_misses: number | null
          created_at: string | null
          date: string
          id: string
          organization_id: string
          total_cost_usd: number
          total_input_tokens: number
          total_output_tokens: number
          total_requests: number
          updated_at: string | null
          usage_by_model: Json | null
          usage_by_task: Json | null
        }
        Insert: {
          cache_hits?: number | null
          cache_misses?: number | null
          created_at?: string | null
          date?: string
          id?: string
          organization_id: string
          total_cost_usd?: number
          total_input_tokens?: number
          total_output_tokens?: number
          total_requests?: number
          updated_at?: string | null
          usage_by_model?: Json | null
          usage_by_task?: Json | null
        }
        Update: {
          cache_hits?: number | null
          cache_misses?: number | null
          created_at?: string | null
          date?: string
          id?: string
          organization_id?: string
          total_cost_usd?: number
          total_input_tokens?: number
          total_output_tokens?: number
          total_requests?: number
          updated_at?: string | null
          usage_by_model?: Json | null
          usage_by_task?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_daily_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          request_count: number | null
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          request_count?: number | null
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          request_count?: number | null
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          action_description: string | null
          content_type: string | null
          created_at: string | null
          expires_at: string | null
          file_size_bytes: number | null
          id: string
          metadata: Json | null
          organization_id: string | null
          project_id: string | null
          step_index: number | null
          storage_backend: string
          storage_key: string | null
          storage_url: string | null
          test_id: string | null
          test_run_id: string | null
          thread_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_description?: string | null
          content_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id: string
          metadata?: Json | null
          organization_id?: string | null
          project_id?: string | null
          step_index?: number | null
          storage_backend?: string
          storage_key?: string | null
          storage_url?: string | null
          test_id?: string | null
          test_run_id?: string | null
          thread_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          action_description?: string | null
          content_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          project_id?: string | null
          step_index?: number | null
          storage_backend?: string
          storage_key?: string | null
          storage_url?: string | null
          test_id?: string | null
          test_run_id?: string | null
          thread_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string
          duration_ms: number | null
          error_message: string | null
          event_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string | null
          organization_id: string | null
          path: string | null
          request_id: string | null
          resource_id: string | null
          resource_type: string
          status: string
          status_code: number | null
          user_agent: string | null
          user_email: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          organization_id?: string | null
          path?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type: string
          status?: string
          status_code?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          organization_id?: string | null
          path?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string
          status?: string
          status_code?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      browser_matrix: {
        Row: {
          accept_downloads: boolean | null
          browser: string
          browser_args: string[] | null
          channel: string | null
          color_scheme: string | null
          created_at: string | null
          default_timeout_ms: number | null
          device_emulation: string | null
          download_path: string | null
          enabled: boolean | null
          forced_colors: string | null
          geolocation: Json | null
          headless: boolean | null
          http_credentials: Json | null
          id: string
          locale: string | null
          metadata: Json | null
          notes: string | null
          permissions: string[] | null
          priority: number | null
          project_id: string
          proxy: Json | null
          record_har: boolean | null
          record_video: boolean | null
          reduced_motion: string | null
          slow_mo_ms: number | null
          timezone_id: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          accept_downloads?: boolean | null
          browser: string
          browser_args?: string[] | null
          channel?: string | null
          color_scheme?: string | null
          created_at?: string | null
          default_timeout_ms?: number | null
          device_emulation?: string | null
          download_path?: string | null
          enabled?: boolean | null
          forced_colors?: string | null
          geolocation?: Json | null
          headless?: boolean | null
          http_credentials?: Json | null
          id?: string
          locale?: string | null
          metadata?: Json | null
          notes?: string | null
          permissions?: string[] | null
          priority?: number | null
          project_id: string
          proxy?: Json | null
          record_har?: boolean | null
          record_video?: boolean | null
          reduced_motion?: string | null
          slow_mo_ms?: number | null
          timezone_id?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          accept_downloads?: boolean | null
          browser?: string
          browser_args?: string[] | null
          channel?: string | null
          color_scheme?: string | null
          created_at?: string | null
          default_timeout_ms?: number | null
          device_emulation?: string | null
          download_path?: string | null
          enabled?: boolean | null
          forced_colors?: string | null
          geolocation?: Json | null
          headless?: boolean | null
          http_credentials?: Json | null
          id?: string
          locale?: string | null
          metadata?: Json | null
          notes?: string | null
          permissions?: string[] | null
          priority?: number | null
          project_id?: string
          proxy?: Json | null
          record_har?: boolean | null
          record_video?: boolean | null
          reduced_motion?: string | null
          slow_mo_ms?: number | null
          timezone_id?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "browser_matrix_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          message_count: number | null
          preview: string | null
          project_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_count?: number | null
          preview?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_count?: number | null
          preview?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          tool_calls: Json | null
          tool_invocations: Json | null
          tool_results: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          tool_calls?: Json | null
          tool_invocations?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          tool_calls?: Json | null
          tool_invocations?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoint_blobs: {
        Row: {
          blob: string | null
          channel: string
          checkpoint_ns: string
          thread_id: string
          type: string
          version: string
        }
        Insert: {
          blob?: string | null
          channel: string
          checkpoint_ns?: string
          thread_id: string
          type: string
          version: string
        }
        Update: {
          blob?: string | null
          channel?: string
          checkpoint_ns?: string
          thread_id?: string
          type?: string
          version?: string
        }
        Relationships: []
      }
      checkpoint_migrations: {
        Row: {
          v: number
        }
        Insert: {
          v: number
        }
        Update: {
          v?: number
        }
        Relationships: []
      }
      checkpoint_writes: {
        Row: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns: string
          idx: number
          task_id: string
          task_path: string
          thread_id: string
          type: string | null
        }
        Insert: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns?: string
          idx: number
          task_id: string
          task_path?: string
          thread_id: string
          type?: string | null
        }
        Update: {
          blob?: string
          channel?: string
          checkpoint_id?: string
          checkpoint_ns?: string
          idx?: number
          task_id?: string
          task_path?: string
          thread_id?: string
          type?: string | null
        }
        Relationships: []
      }
      checkpoints: {
        Row: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns: string
          metadata: Json
          parent_checkpoint_id: string | null
          thread_id: string
          type: string | null
        }
        Insert: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns?: string
          metadata?: Json
          parent_checkpoint_id?: string | null
          thread_id: string
          type?: string | null
        }
        Update: {
          checkpoint?: Json
          checkpoint_id?: string
          checkpoint_ns?: string
          metadata?: Json
          parent_checkpoint_id?: string | null
          thread_id?: string
          type?: string | null
        }
        Relationships: []
      }
      ci_events: {
        Row: {
          branch: string
          commit_sha: string
          coverage_percent: number | null
          created_at: string | null
          duration_seconds: number | null
          event_type: string
          external_id: string
          external_url: string | null
          id: string
          metadata: Json | null
          project_id: string
          raw_payload: Json | null
          run_number: number
          source: string
          status: string
          test_results: Json | null
          updated_at: string | null
          workflow_name: string
        }
        Insert: {
          branch: string
          commit_sha: string
          coverage_percent?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          event_type: string
          external_id: string
          external_url?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          raw_payload?: Json | null
          run_number?: number
          source: string
          status: string
          test_results?: Json | null
          updated_at?: string | null
          workflow_name: string
        }
        Update: {
          branch?: string
          commit_sha?: string
          coverage_percent?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          event_type?: string
          external_id?: string
          external_url?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          raw_payload?: Json | null
          run_number?: number
          source?: string
          status?: string
          test_results?: Json | null
          updated_at?: string | null
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ci_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_reports: {
        Row: {
          branch: string
          branches_covered: number
          branches_percent: number
          branches_total: number
          ci_run_id: string | null
          commit_sha: string
          created_at: string | null
          files: Json | null
          format: string
          functions_covered: number
          functions_percent: number
          functions_total: number
          id: string
          lines_covered: number
          lines_percent: number
          lines_total: number
          project_id: string
        }
        Insert: {
          branch?: string
          branches_covered?: number
          branches_percent?: number
          branches_total?: number
          ci_run_id?: string | null
          commit_sha: string
          created_at?: string | null
          files?: Json | null
          format: string
          functions_covered?: number
          functions_percent?: number
          functions_total?: number
          id?: string
          lines_covered?: number
          lines_percent?: number
          lines_total?: number
          project_id: string
        }
        Update: {
          branch?: string
          branches_covered?: number
          branches_percent?: number
          branches_total?: number
          ci_run_id?: string | null
          commit_sha?: string
          created_at?: string | null
          files?: Json | null
          format?: string
          functions_covered?: number
          functions_percent?: number
          functions_total?: number
          id?: string
          lines_covered?: number
          lines_percent?: number
          lines_total?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_reports_ci_run_id_fkey"
            columns: ["ci_run_id"]
            isOneToOne: false
            referencedRelation: "ci_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          avg_duration_ms: number | null
          date: string
          failed: number | null
          id: string
          passed: number | null
          project_id: string
          runs: number | null
        }
        Insert: {
          avg_duration_ms?: number | null
          date?: string
          failed?: number | null
          id?: string
          passed?: number | null
          project_id: string
          runs?: number | null
        }
        Update: {
          avg_duration_ms?: number | null
          date?: string
          failed?: number | null
          id?: string
          passed?: number | null
          project_id?: string
          runs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          access_type: string
          created_at: string | null
          data_classification: string | null
          fields_accessed: string[] | null
          id: string
          ip_address: unknown
          organization_id: string | null
          purpose: string | null
          resource_id: string
          resource_type: string
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string | null
          data_classification?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          purpose?: string | null
          resource_id: string
          resource_type: string
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string | null
          data_classification?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          purpose?: string | null
          resource_id?: string
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_auth_sessions: {
        Row: {
          approved_at: string | null
          client_id: string
          connection_id: string | null
          created_at: string | null
          device_code_hash: string
          email: string | null
          exchanged_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          name: string | null
          organization_id: string | null
          scopes: string[]
          status: string
          user_agent: string | null
          user_code: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          client_id?: string
          connection_id?: string | null
          created_at?: string | null
          device_code_hash: string
          email?: string | null
          exchanged_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          name?: string | null
          organization_id?: string | null
          scopes?: string[]
          status?: string
          user_agent?: string | null
          user_code: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          client_id?: string
          connection_id?: string | null
          created_at?: string | null
          device_code_hash?: string
          email?: string | null
          exchanged_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          name?: string | null
          organization_id?: string | null
          scopes?: string[]
          status?: string
          user_agent?: string | null
          user_code?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_auth_sessions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "mcp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_auth_sessions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "v_active_mcp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_auth_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_elements: {
        Row: {
          alternative_selectors: string[] | null
          aria_label: string | null
          bounds: Json | null
          category: string
          created_at: string | null
          discovery_session_id: string
          html_attributes: Json | null
          id: string
          importance_score: number | null
          is_enabled: boolean | null
          is_required: boolean | null
          is_visible: boolean | null
          label: string | null
          metadata: Json | null
          page_id: string
          purpose: string | null
          role: string | null
          selector: string
          stability_score: number | null
          tag_name: string
          updated_at: string | null
          xpath: string | null
        }
        Insert: {
          alternative_selectors?: string[] | null
          aria_label?: string | null
          bounds?: Json | null
          category: string
          created_at?: string | null
          discovery_session_id: string
          html_attributes?: Json | null
          id?: string
          importance_score?: number | null
          is_enabled?: boolean | null
          is_required?: boolean | null
          is_visible?: boolean | null
          label?: string | null
          metadata?: Json | null
          page_id: string
          purpose?: string | null
          role?: string | null
          selector: string
          stability_score?: number | null
          tag_name: string
          updated_at?: string | null
          xpath?: string | null
        }
        Update: {
          alternative_selectors?: string[] | null
          aria_label?: string | null
          bounds?: Json | null
          category?: string
          created_at?: string | null
          discovery_session_id?: string
          html_attributes?: Json | null
          id?: string
          importance_score?: number | null
          is_enabled?: boolean | null
          is_required?: boolean | null
          is_visible?: boolean | null
          label?: string | null
          metadata?: Json | null
          page_id?: string
          purpose?: string | null
          role?: string | null
          selector?: string
          stability_score?: number | null
          tag_name?: string
          updated_at?: string | null
          xpath?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_elements_discovery_session_id_fkey"
            columns: ["discovery_session_id"]
            isOneToOne: false
            referencedRelation: "discovery_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_elements_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "discovered_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_flows: {
        Row: {
          auto_generated_test: Json | null
          business_value_score: number | null
          category: string | null
          complexity_score: number | null
          confidence_score: number | null
          converted_to_test_id: string | null
          created_at: string | null
          description: string | null
          discovery_session_id: string
          entry_points: Json | null
          exit_points: Json | null
          failure_indicators: Json | null
          flow_type: string | null
          id: string
          last_validated_at: string | null
          metadata: Json | null
          name: string
          page_ids: string[] | null
          priority: string | null
          project_id: string
          similar_flows: Json | null
          step_count: number | null
          steps: Json
          success_criteria: Json | null
          updated_at: string | null
          validated: boolean | null
          validation_error: string | null
          validation_result: Json | null
        }
        Insert: {
          auto_generated_test?: Json | null
          business_value_score?: number | null
          category?: string | null
          complexity_score?: number | null
          confidence_score?: number | null
          converted_to_test_id?: string | null
          created_at?: string | null
          description?: string | null
          discovery_session_id: string
          entry_points?: Json | null
          exit_points?: Json | null
          failure_indicators?: Json | null
          flow_type?: string | null
          id?: string
          last_validated_at?: string | null
          metadata?: Json | null
          name: string
          page_ids?: string[] | null
          priority?: string | null
          project_id: string
          similar_flows?: Json | null
          step_count?: number | null
          steps?: Json
          success_criteria?: Json | null
          updated_at?: string | null
          validated?: boolean | null
          validation_error?: string | null
          validation_result?: Json | null
        }
        Update: {
          auto_generated_test?: Json | null
          business_value_score?: number | null
          category?: string | null
          complexity_score?: number | null
          confidence_score?: number | null
          converted_to_test_id?: string | null
          created_at?: string | null
          description?: string | null
          discovery_session_id?: string
          entry_points?: Json | null
          exit_points?: Json | null
          failure_indicators?: Json | null
          flow_type?: string | null
          id?: string
          last_validated_at?: string | null
          metadata?: Json | null
          name?: string
          page_ids?: string[] | null
          priority?: string | null
          project_id?: string
          similar_flows?: Json | null
          step_count?: number | null
          steps?: Json
          success_criteria?: Json | null
          updated_at?: string | null
          validated?: boolean | null
          validation_error?: string | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_flows_converted_to_test_id_fkey"
            columns: ["converted_to_test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_flows_discovery_session_id_fkey"
            columns: ["discovery_session_id"]
            isOneToOne: false
            referencedRelation: "discovery_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_pages: {
        Row: {
          canonical_url: string | null
          category: string | null
          cls_score: number | null
          coverage_score: number | null
          created_at: string | null
          depth_from_start: number | null
          discovery_session_id: string
          dom_snapshot_url: string | null
          element_count: number | null
          elements_summary: Json | null
          form_count: number | null
          has_dynamic_content: boolean | null
          id: string
          importance_score: number | null
          incoming_links: string[] | null
          interactive_element_count: number | null
          lcp_ms: number | null
          link_count: number | null
          load_time_ms: number | null
          metadata: Json | null
          outgoing_links: string[] | null
          page_type: string | null
          project_id: string
          requires_auth: boolean | null
          risk_score: number | null
          screenshot_url: string | null
          title: string | null
          tti_ms: number | null
          updated_at: string | null
          url: string
          url_hash: string | null
        }
        Insert: {
          canonical_url?: string | null
          category?: string | null
          cls_score?: number | null
          coverage_score?: number | null
          created_at?: string | null
          depth_from_start?: number | null
          discovery_session_id: string
          dom_snapshot_url?: string | null
          element_count?: number | null
          elements_summary?: Json | null
          form_count?: number | null
          has_dynamic_content?: boolean | null
          id?: string
          importance_score?: number | null
          incoming_links?: string[] | null
          interactive_element_count?: number | null
          lcp_ms?: number | null
          link_count?: number | null
          load_time_ms?: number | null
          metadata?: Json | null
          outgoing_links?: string[] | null
          page_type?: string | null
          project_id: string
          requires_auth?: boolean | null
          risk_score?: number | null
          screenshot_url?: string | null
          title?: string | null
          tti_ms?: number | null
          updated_at?: string | null
          url: string
          url_hash?: string | null
        }
        Update: {
          canonical_url?: string | null
          category?: string | null
          cls_score?: number | null
          coverage_score?: number | null
          created_at?: string | null
          depth_from_start?: number | null
          discovery_session_id?: string
          dom_snapshot_url?: string | null
          element_count?: number | null
          elements_summary?: Json | null
          form_count?: number | null
          has_dynamic_content?: boolean | null
          id?: string
          importance_score?: number | null
          incoming_links?: string[] | null
          interactive_element_count?: number | null
          lcp_ms?: number | null
          link_count?: number | null
          load_time_ms?: number | null
          metadata?: Json | null
          outgoing_links?: string[] | null
          page_type?: string | null
          project_id?: string
          requires_auth?: boolean | null
          risk_score?: number | null
          screenshot_url?: string | null
          title?: string | null
          tti_ms?: number | null
          updated_at?: string | null
          url?: string
          url_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_pages_discovery_session_id_fkey"
            columns: ["discovery_session_id"]
            isOneToOne: false
            referencedRelation: "discovery_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_history: {
        Row: {
          coverage_score: number | null
          created_at: string | null
          elements_added: number | null
          elements_removed: number | null
          flows_added: number | null
          flows_removed: number | null
          id: string
          metadata: Json | null
          pages_added: number | null
          pages_removed: number | null
          project_id: string
          quality_score: number | null
          session_id: string | null
          snapshot_data: Json | null
          snapshot_date: string
          total_elements: number
          total_flows: number
          total_pages: number
        }
        Insert: {
          coverage_score?: number | null
          created_at?: string | null
          elements_added?: number | null
          elements_removed?: number | null
          flows_added?: number | null
          flows_removed?: number | null
          id?: string
          metadata?: Json | null
          pages_added?: number | null
          pages_removed?: number | null
          project_id: string
          quality_score?: number | null
          session_id?: string | null
          snapshot_data?: Json | null
          snapshot_date: string
          total_elements?: number
          total_flows?: number
          total_pages?: number
        }
        Update: {
          coverage_score?: number | null
          created_at?: string | null
          elements_added?: number | null
          elements_removed?: number | null
          flows_added?: number | null
          flows_removed?: number | null
          id?: string
          metadata?: Json | null
          pages_added?: number | null
          pages_removed?: number | null
          project_id?: string
          quality_score?: number | null
          session_id?: string | null
          snapshot_data?: Json | null
          snapshot_date?: string
          total_elements?: number
          total_flows?: number
          total_pages?: number
        }
        Relationships: [
          {
            foreignKeyName: "discovery_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "discovery_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_patterns: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          pattern_data: Json
          pattern_name: string
          pattern_signature: string
          pattern_type: string
          projects_seen: number | null
          self_heal_success_rate: number | null
          test_success_rate: number | null
          times_seen: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          pattern_data?: Json
          pattern_name: string
          pattern_signature: string
          pattern_type: string
          projects_seen?: number | null
          self_heal_success_rate?: number | null
          test_success_rate?: number | null
          times_seen?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          pattern_data?: Json
          pattern_name?: string
          pattern_signature?: string
          pattern_type?: string
          projects_seen?: number | null
          self_heal_success_rate?: number | null
          test_success_rate?: number | null
          times_seen?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      discovery_sessions: {
        Row: {
          ai_cost_usd: number | null
          ai_tokens_used: number | null
          app_url: string
          compared_to_session_id: string | null
          completed_at: string | null
          config: Json | null
          coverage_summary: Json | null
          created_at: string | null
          current_page: string | null
          diff_summary: Json | null
          elements_found: number | null
          exclude_patterns: string[] | null
          flows_found: number | null
          focus_areas: string[] | null
          forms_found: number | null
          id: string
          include_patterns: string[] | null
          insights: Json | null
          max_depth: number | null
          max_pages: number | null
          mode: string
          name: string
          page_graph: Json | null
          pages_discovered: number | null
          pages_found: number | null
          patterns_detected: Json | null
          progress_percentage: number | null
          project_id: string
          quality_score: number | null
          recommendations: Json | null
          recording_url: string | null
          start_url: string
          started_at: string | null
          status: string | null
          strategy: string
          triggered_by: string | null
          updated_at: string | null
          video_artifact_id: string | null
          visual_baseline_ids: string[] | null
        }
        Insert: {
          ai_cost_usd?: number | null
          ai_tokens_used?: number | null
          app_url: string
          compared_to_session_id?: string | null
          completed_at?: string | null
          config?: Json | null
          coverage_summary?: Json | null
          created_at?: string | null
          current_page?: string | null
          diff_summary?: Json | null
          elements_found?: number | null
          exclude_patterns?: string[] | null
          flows_found?: number | null
          focus_areas?: string[] | null
          forms_found?: number | null
          id?: string
          include_patterns?: string[] | null
          insights?: Json | null
          max_depth?: number | null
          max_pages?: number | null
          mode?: string
          name: string
          page_graph?: Json | null
          pages_discovered?: number | null
          pages_found?: number | null
          patterns_detected?: Json | null
          progress_percentage?: number | null
          project_id: string
          quality_score?: number | null
          recommendations?: Json | null
          recording_url?: string | null
          start_url: string
          started_at?: string | null
          status?: string | null
          strategy?: string
          triggered_by?: string | null
          updated_at?: string | null
          video_artifact_id?: string | null
          visual_baseline_ids?: string[] | null
        }
        Update: {
          ai_cost_usd?: number | null
          ai_tokens_used?: number | null
          app_url?: string
          compared_to_session_id?: string | null
          completed_at?: string | null
          config?: Json | null
          coverage_summary?: Json | null
          created_at?: string | null
          current_page?: string | null
          diff_summary?: Json | null
          elements_found?: number | null
          exclude_patterns?: string[] | null
          flows_found?: number | null
          focus_areas?: string[] | null
          forms_found?: number | null
          id?: string
          include_patterns?: string[] | null
          insights?: Json | null
          max_depth?: number | null
          max_pages?: number | null
          mode?: string
          name?: string
          page_graph?: Json | null
          pages_discovered?: number | null
          pages_found?: number | null
          patterns_detected?: Json | null
          progress_percentage?: number | null
          project_id?: string
          quality_score?: number | null
          recommendations?: Json | null
          recording_url?: string | null
          start_url?: string
          started_at?: string | null
          status?: string | null
          strategy?: string
          triggered_by?: string | null
          updated_at?: string | null
          video_artifact_id?: string | null
          visual_baseline_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_sessions_compared_to_session_id_fkey"
            columns: ["compared_to_session_id"]
            isOneToOne: false
            referencedRelation: "discovery_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      error_patterns: {
        Row: {
          avg_time_to_fix_ms: number | null
          category: string
          common_fixes: string[] | null
          common_root_causes: string[] | null
          companies_affected: number | null
          created_at: string | null
          example_message: string | null
          fix_success_rate: number | null
          frameworks: string[] | null
          id: string
          pattern_hash: string
          pattern_signature: Json
          pattern_type: string
          prevention_strategies: string[] | null
          subcategory: string | null
          test_templates: Json | null
          total_occurrences: number | null
          updated_at: string | null
        }
        Insert: {
          avg_time_to_fix_ms?: number | null
          category: string
          common_fixes?: string[] | null
          common_root_causes?: string[] | null
          companies_affected?: number | null
          created_at?: string | null
          example_message?: string | null
          fix_success_rate?: number | null
          frameworks?: string[] | null
          id?: string
          pattern_hash: string
          pattern_signature: Json
          pattern_type: string
          prevention_strategies?: string[] | null
          subcategory?: string | null
          test_templates?: Json | null
          total_occurrences?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_time_to_fix_ms?: number | null
          category?: string
          common_fixes?: string[] | null
          common_root_causes?: string[] | null
          companies_affected?: number | null
          created_at?: string | null
          example_message?: string | null
          fix_success_rate?: number | null
          frameworks?: string[] | null
          id?: string
          pattern_hash?: string
          pattern_signature?: Json
          pattern_type?: string
          prevention_strategies?: string[] | null
          subcategory?: string | null
          test_templates?: Json | null
          total_occurrences?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_test_mappings: {
        Row: {
          confidence: number
          created_at: string | null
          generated_test_id: string | null
          id: string
          mapping_type: string
          production_event_id: string
          test_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence: number
          created_at?: string | null
          generated_test_id?: string | null
          id?: string
          mapping_type: string
          production_event_id: string
          test_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          generated_test_id?: string | null
          id?: string
          mapping_type?: string
          production_event_id?: string
          test_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_test_mappings_generated_test_id_fkey"
            columns: ["generated_test_id"]
            isOneToOne: false
            referencedRelation: "generated_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_test_mappings_production_event_id_fkey"
            columns: ["production_event_id"]
            isOneToOne: false
            referencedRelation: "production_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_test_mappings_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_tests: {
        Row: {
          assertions: Json | null
          confidence_score: number
          converted_to_test_id: string | null
          created_at: string | null
          deployed_at: string | null
          description: string | null
          error_pattern_id: string | null
          framework: string | null
          github_pr_number: number | null
          github_pr_status: string | null
          github_pr_url: string | null
          id: string
          metadata: Json | null
          name: string
          prevented_incidents: number | null
          production_event_id: string | null
          project_id: string
          quality_score: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          steps: Json | null
          test_code: string
          test_file_path: string | null
          test_type: string
          times_failed: number | null
          times_passed: number | null
          times_run: number | null
          updated_at: string | null
        }
        Insert: {
          assertions?: Json | null
          confidence_score: number
          converted_to_test_id?: string | null
          created_at?: string | null
          deployed_at?: string | null
          description?: string | null
          error_pattern_id?: string | null
          framework?: string | null
          github_pr_number?: number | null
          github_pr_status?: string | null
          github_pr_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          prevented_incidents?: number | null
          production_event_id?: string | null
          project_id: string
          quality_score?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          steps?: Json | null
          test_code: string
          test_file_path?: string | null
          test_type: string
          times_failed?: number | null
          times_passed?: number | null
          times_run?: number | null
          updated_at?: string | null
        }
        Update: {
          assertions?: Json | null
          confidence_score?: number
          converted_to_test_id?: string | null
          created_at?: string | null
          deployed_at?: string | null
          description?: string | null
          error_pattern_id?: string | null
          framework?: string | null
          github_pr_number?: number | null
          github_pr_status?: string | null
          github_pr_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          prevented_incidents?: number | null
          production_event_id?: string | null
          project_id?: string
          quality_score?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          steps?: Json | null
          test_code?: string
          test_file_path?: string | null
          test_type?: string
          times_failed?: number | null
          times_passed?: number | null
          times_run?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_tests_converted_to_test_id_fkey"
            columns: ["converted_to_test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tests_error_pattern_id_fkey"
            columns: ["error_pattern_id"]
            isOneToOne: false
            referencedRelation: "error_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tests_production_event_id_fkey"
            columns: ["production_event_id"]
            isOneToOne: false
            referencedRelation: "production_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      global_test_results: {
        Row: {
          city: string
          created_at: string | null
          error_message: string | null
          global_test_id: string
          id: string
          latency_ms: number | null
          page_load_ms: number | null
          region_code: string
          status: string
          ttfb_ms: number | null
        }
        Insert: {
          city: string
          created_at?: string | null
          error_message?: string | null
          global_test_id: string
          id?: string
          latency_ms?: number | null
          page_load_ms?: number | null
          region_code: string
          status: string
          ttfb_ms?: number | null
        }
        Update: {
          city?: string
          created_at?: string | null
          error_message?: string | null
          global_test_id?: string
          id?: string
          latency_ms?: number | null
          page_load_ms?: number | null
          region_code?: string
          status?: string
          ttfb_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "global_test_results_global_test_id_fkey"
            columns: ["global_test_id"]
            isOneToOne: false
            referencedRelation: "global_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      global_tests: {
        Row: {
          avg_latency_ms: number | null
          avg_ttfb_ms: number | null
          completed_at: string | null
          created_at: string | null
          failed_regions: number | null
          id: string
          project_id: string
          slow_regions: number | null
          started_at: string | null
          status: string | null
          success_rate: number | null
          triggered_by: string | null
          url: string
        }
        Insert: {
          avg_latency_ms?: number | null
          avg_ttfb_ms?: number | null
          completed_at?: string | null
          created_at?: string | null
          failed_regions?: number | null
          id?: string
          project_id: string
          slow_regions?: number | null
          started_at?: string | null
          status?: string | null
          success_rate?: number | null
          triggered_by?: string | null
          url: string
        }
        Update: {
          avg_latency_ms?: number | null
          avg_ttfb_ms?: number | null
          completed_at?: string | null
          created_at?: string | null
          failed_regions?: number | null
          id?: string
          project_id?: string
          slow_regions?: number | null
          started_at?: string | null
          status?: string | null
          success_rate?: number | null
          triggered_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      healing_patterns: {
        Row: {
          code_context: string | null
          component_name: string | null
          confidence: number | null
          created_at: string | null
          element_context: Json | null
          error_type: string
          failure_count: number | null
          fingerprint: string
          git_commit_author: string | null
          git_commit_date: string | null
          git_commit_message: string | null
          git_commit_sha: string | null
          git_file_changed: string | null
          git_line_number: number | null
          healed_selector: string
          healing_source: string | null
          id: string
          metadata: Json | null
          original_selector: string
          page_url: string | null
          project_id: string | null
          success_count: number | null
          updated_at: string | null
        }
        Insert: {
          code_context?: string | null
          component_name?: string | null
          confidence?: number | null
          created_at?: string | null
          element_context?: Json | null
          error_type: string
          failure_count?: number | null
          fingerprint: string
          git_commit_author?: string | null
          git_commit_date?: string | null
          git_commit_message?: string | null
          git_commit_sha?: string | null
          git_file_changed?: string | null
          git_line_number?: number | null
          healed_selector: string
          healing_source?: string | null
          id?: string
          metadata?: Json | null
          original_selector: string
          page_url?: string | null
          project_id?: string | null
          success_count?: number | null
          updated_at?: string | null
        }
        Update: {
          code_context?: string | null
          component_name?: string | null
          confidence?: number | null
          created_at?: string | null
          element_context?: Json | null
          error_type?: string
          failure_count?: number | null
          fingerprint?: string
          git_commit_author?: string | null
          git_commit_date?: string | null
          git_commit_message?: string | null
          git_commit_sha?: string | null
          git_file_changed?: string | null
          git_line_number?: number | null
          healed_selector?: string
          healing_source?: string | null
          id?: string
          metadata?: Json | null
          original_selector?: string
          page_url?: string | null
          project_id?: string | null
          success_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "healing_patterns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      infra_anomaly_history: {
        Row: {
          description: string
          detected_at: string
          id: string
          metrics: Json | null
          org_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["infra_recommendation_priority"]
          suggested_action: string | null
          type: string
        }
        Insert: {
          description: string
          detected_at?: string
          id?: string
          metrics?: Json | null
          org_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["infra_recommendation_priority"]
          suggested_action?: string | null
          type: string
        }
        Update: {
          description?: string
          detected_at?: string
          id?: string
          metrics?: Json | null
          org_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["infra_recommendation_priority"]
          suggested_action?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "infra_anomaly_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      infra_cost_history: {
        Row: {
          avg_cpu_utilization: number | null
          avg_memory_utilization: number | null
          avg_node_count: number | null
          avg_pod_count: number | null
          compute_cost: number
          created_at: string
          date: string
          id: string
          network_cost: number
          org_id: string | null
          storage_cost: number
          total_cost: number
          total_sessions: number | null
        }
        Insert: {
          avg_cpu_utilization?: number | null
          avg_memory_utilization?: number | null
          avg_node_count?: number | null
          avg_pod_count?: number | null
          compute_cost?: number
          created_at?: string
          date: string
          id?: string
          network_cost?: number
          org_id?: string | null
          storage_cost?: number
          total_cost?: number
          total_sessions?: number | null
        }
        Update: {
          avg_cpu_utilization?: number | null
          avg_memory_utilization?: number | null
          avg_node_count?: number | null
          avg_pod_count?: number | null
          compute_cost?: number
          created_at?: string
          date?: string
          id?: string
          network_cost?: number
          org_id?: string | null
          storage_cost?: number
          total_cost?: number
          total_sessions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "infra_cost_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      infra_recommendations: {
        Row: {
          action: Json
          applied_at: string | null
          applied_by: string | null
          confidence: number | null
          created_at: string
          description: string
          estimated_savings_monthly: number | null
          expires_at: string
          id: string
          metrics_snapshot: Json | null
          org_id: string | null
          priority: Database["public"]["Enums"]["infra_recommendation_priority"]
          reasoning: string | null
          status: Database["public"]["Enums"]["infra_recommendation_status"]
          title: string
          type: Database["public"]["Enums"]["infra_recommendation_type"]
          updated_at: string | null
        }
        Insert: {
          action?: Json
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          created_at?: string
          description: string
          estimated_savings_monthly?: number | null
          expires_at?: string
          id?: string
          metrics_snapshot?: Json | null
          org_id?: string | null
          priority: Database["public"]["Enums"]["infra_recommendation_priority"]
          reasoning?: string | null
          status?: Database["public"]["Enums"]["infra_recommendation_status"]
          title: string
          type: Database["public"]["Enums"]["infra_recommendation_type"]
          updated_at?: string | null
        }
        Update: {
          action?: Json
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          created_at?: string
          description?: string
          estimated_savings_monthly?: number | null
          expires_at?: string
          id?: string
          metrics_snapshot?: Json | null
          org_id?: string | null
          priority?: Database["public"]["Enums"]["infra_recommendation_priority"]
          reasoning?: string | null
          status?: Database["public"]["Enums"]["infra_recommendation_status"]
          title?: string
          type?: Database["public"]["Enums"]["infra_recommendation_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "infra_recommendations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token_encrypted: string | null
          config: Json | null
          created_at: string | null
          credentials: Json | null
          data_points_synced: number | null
          error_message: string | null
          external_account_id: string | null
          external_account_name: string | null
          features_enabled: string[] | null
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          name: string | null
          oauth_scopes: string[] | null
          platform: string
          platform_type: string
          project_id: string | null
          refresh_token_encrypted: string | null
          sync_frequency_minutes: number | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          data_points_synced?: number | null
          error_message?: string | null
          external_account_id?: string | null
          external_account_name?: string | null
          features_enabled?: string[] | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          name?: string | null
          oauth_scopes?: string[] | null
          platform: string
          platform_type: string
          project_id?: string | null
          refresh_token_encrypted?: string | null
          sync_frequency_minutes?: number | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          data_points_synced?: number | null
          error_message?: string | null
          external_account_id?: string | null
          external_account_name?: string | null
          features_enabled?: string[] | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          name?: string | null
          oauth_scopes?: string[] | null
          platform?: string
          platform_type?: string
          project_id?: string | null
          refresh_token_encrypted?: string | null
          sync_frequency_minutes?: number | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          message: string | null
          organization_id: string
          role: string
          status: string
          token: string
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_by?: string | null
          message?: string | null
          organization_id: string
          role?: string
          status?: string
          token: string
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          message?: string | null
          organization_id?: string
          role?: string
          status?: string
          token?: string
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      iteration_results: {
        Row: {
          assertion_details: Json | null
          assertions_failed: number | null
          assertions_passed: number | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_screenshot_url: string | null
          error_stack: string | null
          id: string
          is_retry: boolean | null
          iteration_index: number
          metadata: Json | null
          original_iteration_id: string | null
          parameter_set_id: string | null
          parameter_values: Json
          parameterized_result_id: string
          retry_count: number | null
          started_at: string | null
          status: string
          step_results: Json | null
        }
        Insert: {
          assertion_details?: Json | null
          assertions_failed?: number | null
          assertions_passed?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_screenshot_url?: string | null
          error_stack?: string | null
          id?: string
          is_retry?: boolean | null
          iteration_index: number
          metadata?: Json | null
          original_iteration_id?: string | null
          parameter_set_id?: string | null
          parameter_values: Json
          parameterized_result_id: string
          retry_count?: number | null
          started_at?: string | null
          status: string
          step_results?: Json | null
        }
        Update: {
          assertion_details?: Json | null
          assertions_failed?: number | null
          assertions_passed?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_screenshot_url?: string | null
          error_stack?: string | null
          id?: string
          is_retry?: boolean | null
          iteration_index?: number
          metadata?: Json | null
          original_iteration_id?: string | null
          parameter_set_id?: string | null
          parameter_values?: Json
          parameterized_result_id?: string
          retry_count?: number | null
          started_at?: string | null
          status?: string
          step_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "iteration_results_original_iteration_id_fkey"
            columns: ["original_iteration_id"]
            isOneToOne: false
            referencedRelation: "iteration_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iteration_results_parameter_set_id_fkey"
            columns: ["parameter_set_id"]
            isOneToOne: false
            referencedRelation: "parameter_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iteration_results_parameterized_result_id_fkey"
            columns: ["parameterized_result_id"]
            isOneToOne: false
            referencedRelation: "parameterized_results"
            referencedColumns: ["id"]
          },
        ]
      }
      langgraph_checkpoint_writes: {
        Row: {
          channel: string
          checkpoint_id: string
          idx: number
          task_id: string
          thread_id: string
          type: string | null
          value: Json | null
        }
        Insert: {
          channel: string
          checkpoint_id: string
          idx: number
          task_id: string
          thread_id: string
          type?: string | null
          value?: Json | null
        }
        Update: {
          channel?: string
          checkpoint_id?: string
          idx?: number
          task_id?: string
          thread_id?: string
          type?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      langgraph_checkpoints: {
        Row: {
          checkpoint: Json
          checkpoint_id: string
          created_at: string | null
          metadata: Json | null
          parent_checkpoint_id: string | null
          thread_id: string
          type: string
        }
        Insert: {
          checkpoint: Json
          checkpoint_id: string
          created_at?: string | null
          metadata?: Json | null
          parent_checkpoint_id?: string | null
          thread_id: string
          type: string
        }
        Update: {
          checkpoint?: Json
          checkpoint_id?: string
          created_at?: string | null
          metadata?: Json | null
          parent_checkpoint_id?: string | null
          thread_id?: string
          type?: string
        }
        Relationships: []
      }
      langgraph_memory_store: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          key: string
          namespace: string[]
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          key: string
          namespace: string[]
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          key?: string
          namespace?: string[]
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          completed_at: string | null
          completed_steps: number | null
          current_step: string | null
          id: string
          last_screenshot_url: string | null
          metadata: Json | null
          project_id: string
          session_type: string
          started_at: string | null
          status: string | null
          total_steps: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: number | null
          current_step?: string | null
          id?: string
          last_screenshot_url?: string | null
          metadata?: Json | null
          project_id: string
          session_type: string
          started_at?: string | null
          status?: string | null
          total_steps?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_steps?: number | null
          current_step?: string | null
          id?: string
          last_screenshot_url?: string | null
          metadata?: Json | null
          project_id?: string
          session_type?: string
          started_at?: string | null
          status?: string | null
          total_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_connection_activity: {
        Row: {
          activity_type: string
          connection_id: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          request_id: string | null
          success: boolean | null
          tool_name: string | null
        }
        Insert: {
          activity_type: string
          connection_id: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          request_id?: string | null
          success?: boolean | null
          tool_name?: string | null
        }
        Update: {
          activity_type?: string
          connection_id?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          request_id?: string | null
          success?: boolean | null
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_connection_activity_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "mcp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_connection_activity_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "v_active_mcp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_connections: {
        Row: {
          client_id: string
          client_name: string | null
          client_type: string
          connected_at: string | null
          created_at: string | null
          device_fingerprint: string | null
          device_name: string | null
          disconnected_at: string | null
          id: string
          ip_address: unknown
          last_activity_at: string | null
          location: Json | null
          metadata: Json | null
          organization_id: string | null
          request_count: number | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[]
          session_id: string | null
          status: string
          token_id: string | null
          tools_used: Json | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          client_id?: string
          client_name?: string | null
          client_type?: string
          connected_at?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          disconnected_at?: string | null
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          location?: Json | null
          metadata?: Json | null
          organization_id?: string | null
          request_count?: number | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          session_id?: string | null
          status?: string
          token_id?: string | null
          tools_used?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          client_name?: string | null
          client_type?: string
          connected_at?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          disconnected_at?: string | null
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          location?: Json | null
          metadata?: Json | null
          organization_id?: string | null
          request_count?: number | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          session_id?: string | null
          status?: string
          token_id?: string | null
          tools_used?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_screenshots: {
        Row: {
          activity_id: string | null
          connection_id: string | null
          copied_at: string | null
          created_at: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          organization_id: string | null
          project_id: string | null
          r2_key: string
          retention_days: number | null
          screenshot_type: string
          step_index: number | null
          supabase_path: string | null
          tool_name: string | null
          url_tested: string | null
          width: number | null
        }
        Insert: {
          activity_id?: string | null
          connection_id?: string | null
          copied_at?: string | null
          created_at?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          organization_id?: string | null
          project_id?: string | null
          r2_key: string
          retention_days?: number | null
          screenshot_type?: string
          step_index?: number | null
          supabase_path?: string | null
          tool_name?: string | null
          url_tested?: string | null
          width?: number | null
        }
        Update: {
          activity_id?: string | null
          connection_id?: string | null
          copied_at?: string | null
          created_at?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          organization_id?: string | null
          project_id?: string | null
          r2_key?: string
          retention_days?: number | null
          screenshot_type?: string
          step_index?: number | null
          supabase_path?: string | null
          tool_name?: string | null
          url_tested?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_screenshots_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "mcp_connection_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_screenshots_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "mcp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_screenshots_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "v_active_mcp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_screenshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_screenshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel_type: string
          config: Json
          created_at: string | null
          created_by: string | null
          enabled: boolean | null
          id: string
          last_sent_at: string | null
          name: string
          organization_id: string
          project_id: string | null
          rate_limit_per_hour: number | null
          sent_today: number | null
          updated_at: string | null
          verification_token: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          channel_type: string
          config?: Json
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          last_sent_at?: string | null
          name: string
          organization_id: string
          project_id?: string | null
          rate_limit_per_hour?: number | null
          sent_today?: number | null
          updated_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          channel_type?: string
          config?: Json
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          last_sent_at?: string | null
          name?: string
          organization_id?: string
          project_id?: string | null
          rate_limit_per_hour?: number | null
          sent_today?: number | null
          updated_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_channels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel_id: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          max_retries: number | null
          next_retry_at: string | null
          payload: Json
          queued_at: string | null
          response_body: string | null
          response_code: number | null
          retry_count: number | null
          rule_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          payload: Json
          queued_at?: string | null
          response_body?: string | null
          response_code?: number | null
          retry_count?: number | null
          rule_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          payload?: Json
          queued_at?: string | null
          response_body?: string | null
          response_code?: number | null
          retry_count?: number | null
          rule_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "notification_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          channel_id: string
          conditions: Json | null
          cooldown_minutes: number | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          event_type: string
          id: string
          last_triggered_at: string | null
          message_template: string | null
          name: string | null
          priority: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          event_type: string
          id?: string
          last_triggered_at?: string | null
          message_template?: string | null
          name?: string | null
          priority?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          event_type?: string
          id?: string
          last_triggered_at?: string | null
          message_template?: string | null
          name?: string | null
          priority?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean | null
          event_types: string[]
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          templates: Json
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          event_types: string[]
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          templates?: Json
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          event_types?: string[]
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          templates?: Json
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          code_verifier: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          platform: string
          redirect_uri: string | null
          state: string
          user_id: string
        }
        Insert: {
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          platform: string
          redirect_uri?: string | null
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          redirect_uri?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_budget_daily: number | null
          ai_budget_monthly: number | null
          ai_budget_reset_at: string | null
          ai_spend_this_month: number | null
          ai_spend_today: number | null
          allowed_email_domains: string[] | null
          clerk_org_id: string | null
          created_at: string | null
          created_by: string | null
          data_retention_days: number | null
          domain: string | null
          features: Json | null
          id: string
          is_personal: boolean | null
          logo_url: string | null
          name: string
          plan: string
          require_2fa: boolean | null
          settings: Json | null
          slug: string
          sso_config: Json | null
          sso_enabled: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_budget_daily?: number | null
          ai_budget_monthly?: number | null
          ai_budget_reset_at?: string | null
          ai_spend_this_month?: number | null
          ai_spend_today?: number | null
          allowed_email_domains?: string[] | null
          clerk_org_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_retention_days?: number | null
          domain?: string | null
          features?: Json | null
          id?: string
          is_personal?: boolean | null
          logo_url?: string | null
          name: string
          plan?: string
          require_2fa?: boolean | null
          settings?: Json | null
          slug: string
          sso_config?: Json | null
          sso_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_budget_daily?: number | null
          ai_budget_monthly?: number | null
          ai_budget_reset_at?: string | null
          ai_spend_this_month?: number | null
          ai_spend_today?: number | null
          allowed_email_domains?: string[] | null
          clerk_org_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_retention_days?: number | null
          domain?: string | null
          features?: Json | null
          id?: string
          is_personal?: boolean | null
          logo_url?: string | null
          name?: string
          plan?: string
          require_2fa?: boolean | null
          settings?: Json | null
          slug?: string
          sso_config?: Json | null
          sso_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parameter_sets: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          environment_overrides: Json | null
          expected_error: string | null
          expected_outcome: string | null
          id: string
          name: string
          order_index: number | null
          parameterized_test_id: string
          run_only: boolean | null
          skip: boolean | null
          skip_reason: string | null
          source: string | null
          source_reference: string | null
          tags: string[] | null
          updated_at: string | null
          values: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          environment_overrides?: Json | null
          expected_error?: string | null
          expected_outcome?: string | null
          id?: string
          name: string
          order_index?: number | null
          parameterized_test_id: string
          run_only?: boolean | null
          skip?: boolean | null
          skip_reason?: string | null
          source?: string | null
          source_reference?: string | null
          tags?: string[] | null
          updated_at?: string | null
          values: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          environment_overrides?: Json | null
          expected_error?: string | null
          expected_outcome?: string | null
          id?: string
          name?: string
          order_index?: number | null
          parameterized_test_id?: string
          run_only?: boolean | null
          skip?: boolean | null
          skip_reason?: string | null
          source?: string | null
          source_reference?: string | null
          tags?: string[] | null
          updated_at?: string | null
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "parameter_sets_parameterized_test_id_fkey"
            columns: ["parameterized_test_id"]
            isOneToOne: false
            referencedRelation: "parameterized_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      parameterized_results: {
        Row: {
          app_url: string | null
          avg_iteration_ms: number | null
          browser: string | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          environment: string | null
          error: number | null
          failed: number | null
          failure_summary: Json | null
          id: string
          iteration_mode: string | null
          iteration_results: Json | null
          max_iteration_ms: number | null
          metadata: Json | null
          min_iteration_ms: number | null
          parallel_workers: number | null
          parameterized_test_id: string
          passed: number | null
          schedule_run_id: string | null
          skipped: number | null
          started_at: string | null
          status: string | null
          test_run_id: string | null
          total_iterations: number
          trigger_type: string | null
          triggered_by: string | null
        }
        Insert: {
          app_url?: string | null
          avg_iteration_ms?: number | null
          browser?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          error?: number | null
          failed?: number | null
          failure_summary?: Json | null
          id?: string
          iteration_mode?: string | null
          iteration_results?: Json | null
          max_iteration_ms?: number | null
          metadata?: Json | null
          min_iteration_ms?: number | null
          parallel_workers?: number | null
          parameterized_test_id: string
          passed?: number | null
          schedule_run_id?: string | null
          skipped?: number | null
          started_at?: string | null
          status?: string | null
          test_run_id?: string | null
          total_iterations: number
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Update: {
          app_url?: string | null
          avg_iteration_ms?: number | null
          browser?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          error?: number | null
          failed?: number | null
          failure_summary?: Json | null
          id?: string
          iteration_mode?: string | null
          iteration_results?: Json | null
          max_iteration_ms?: number | null
          metadata?: Json | null
          min_iteration_ms?: number | null
          parallel_workers?: number | null
          parameterized_test_id?: string
          passed?: number | null
          schedule_run_id?: string | null
          skipped?: number | null
          started_at?: string | null
          status?: string | null
          test_run_id?: string | null
          total_iterations?: number
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parameterized_results_parameterized_test_id_fkey"
            columns: ["parameterized_test_id"]
            isOneToOne: false
            referencedRelation: "parameterized_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parameterized_results_schedule_run_id_fkey"
            columns: ["schedule_run_id"]
            isOneToOne: false
            referencedRelation: "schedule_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parameterized_results_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      parameterized_tests: {
        Row: {
          after_each: Json | null
          assertions: Json | null
          base_test_id: string | null
          before_each: Json | null
          created_at: string | null
          created_by: string | null
          data_source_config: Json
          data_source_type: string
          description: string | null
          id: string
          is_active: boolean | null
          iteration_mode: string | null
          last_run_at: string | null
          last_run_status: string | null
          max_parallel: number | null
          name: string
          parameter_schema: Json | null
          priority: string | null
          project_id: string
          retry_failed_iterations: number | null
          setup: Json | null
          steps: Json
          stop_on_failure: boolean | null
          tags: string[] | null
          teardown: Json | null
          timeout_per_iteration_ms: number | null
          updated_at: string | null
        }
        Insert: {
          after_each?: Json | null
          assertions?: Json | null
          base_test_id?: string | null
          before_each?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_source_config?: Json
          data_source_type: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          iteration_mode?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          max_parallel?: number | null
          name: string
          parameter_schema?: Json | null
          priority?: string | null
          project_id: string
          retry_failed_iterations?: number | null
          setup?: Json | null
          steps?: Json
          stop_on_failure?: boolean | null
          tags?: string[] | null
          teardown?: Json | null
          timeout_per_iteration_ms?: number | null
          updated_at?: string | null
        }
        Update: {
          after_each?: Json | null
          assertions?: Json | null
          base_test_id?: string | null
          before_each?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_source_config?: Json
          data_source_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          iteration_mode?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          max_parallel?: number | null
          name?: string
          parameter_schema?: Json | null
          priority?: string | null
          project_id?: string
          retry_failed_iterations?: number | null
          setup?: Json | null
          steps?: Json
          stop_on_failure?: boolean | null
          tags?: string[] | null
          teardown?: Json | null
          timeout_per_iteration_ms?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parameterized_tests_base_test_id_fkey"
            columns: ["base_test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parameterized_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_changes: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          organization_id: string | null
          reason: string | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          reason?: string | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          reason?: string | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_changes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_events: {
        Row: {
          claude_code_version: string | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_name: string
          event_type: string
          file_paths: string[] | null
          git_branch: string | null
          git_commit: string | null
          git_repo: string | null
          id: string
          input_data: Json | null
          os_platform: string | null
          output_data: Json | null
          plugin_version: string | null
          project_id: string | null
          session_id: string
          started_at: string
          status: string
          updated_at: string | null
          user_id: string
          workspace_path: string | null
        }
        Insert: {
          claude_code_version?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_name: string
          event_type: string
          file_paths?: string[] | null
          git_branch?: string | null
          git_commit?: string | null
          git_repo?: string | null
          id?: string
          input_data?: Json | null
          os_platform?: string | null
          output_data?: Json | null
          plugin_version?: string | null
          project_id?: string | null
          session_id: string
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id: string
          workspace_path?: string | null
        }
        Update: {
          claude_code_version?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_name?: string
          event_type?: string
          file_paths?: string[] | null
          git_branch?: string | null
          git_commit?: string | null
          git_repo?: string | null
          id?: string
          input_data?: Json | null
          os_platform?: string | null
          output_data?: Json | null
          plugin_version?: string | null
          project_id?: string | null
          session_id?: string
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_metrics: {
        Row: {
          agent_count: number | null
          avg_duration_ms: number | null
          bucket_size: string
          command_count: number | null
          created_at: string | null
          error_count: number | null
          hook_count: number | null
          id: string
          mcp_call_count: number | null
          p50_duration_ms: number | null
          p95_duration_ms: number | null
          p99_duration_ms: number | null
          project_id: string | null
          session_count: number | null
          skill_count: number | null
          time_bucket: string
          top_agents: Json | null
          top_commands: Json | null
          top_skills: Json | null
          user_id: string | null
        }
        Insert: {
          agent_count?: number | null
          avg_duration_ms?: number | null
          bucket_size?: string
          command_count?: number | null
          created_at?: string | null
          error_count?: number | null
          hook_count?: number | null
          id?: string
          mcp_call_count?: number | null
          p50_duration_ms?: number | null
          p95_duration_ms?: number | null
          p99_duration_ms?: number | null
          project_id?: string | null
          session_count?: number | null
          skill_count?: number | null
          time_bucket: string
          top_agents?: Json | null
          top_commands?: Json | null
          top_skills?: Json | null
          user_id?: string | null
        }
        Update: {
          agent_count?: number | null
          avg_duration_ms?: number | null
          bucket_size?: string
          command_count?: number | null
          created_at?: string | null
          error_count?: number | null
          hook_count?: number | null
          id?: string
          mcp_call_count?: number | null
          p50_duration_ms?: number | null
          p95_duration_ms?: number | null
          p99_duration_ms?: number | null
          project_id?: string | null
          session_count?: number | null
          skill_count?: number | null
          time_bucket?: string
          top_agents?: Json | null
          top_commands?: Json | null
          top_skills?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_sessions: {
        Row: {
          agents_invoked: number | null
          claude_code_version: string | null
          commands_executed: number | null
          created_at: string | null
          duration_ms: number | null
          ended_at: string | null
          errors_count: number | null
          git_branch: string | null
          git_repo: string | null
          hooks_triggered: number | null
          id: string
          mcp_calls: number | null
          os_platform: string | null
          plugin_version: string | null
          project_id: string | null
          session_id: string
          skills_activated: number | null
          started_at: string
          total_events: number | null
          updated_at: string | null
          user_id: string
          workspace_path: string | null
        }
        Insert: {
          agents_invoked?: number | null
          claude_code_version?: string | null
          commands_executed?: number | null
          created_at?: string | null
          duration_ms?: number | null
          ended_at?: string | null
          errors_count?: number | null
          git_branch?: string | null
          git_repo?: string | null
          hooks_triggered?: number | null
          id?: string
          mcp_calls?: number | null
          os_platform?: string | null
          plugin_version?: string | null
          project_id?: string | null
          session_id: string
          skills_activated?: number | null
          started_at: string
          total_events?: number | null
          updated_at?: string | null
          user_id: string
          workspace_path?: string | null
        }
        Update: {
          agents_invoked?: number | null
          claude_code_version?: string | null
          commands_executed?: number | null
          created_at?: string | null
          duration_ms?: number | null
          ended_at?: string | null
          errors_count?: number | null
          git_branch?: string | null
          git_repo?: string | null
          hooks_triggered?: number | null
          id?: string
          mcp_calls?: number | null
          os_platform?: string | null
          plugin_version?: string | null
          project_id?: string | null
          session_id?: string
          skills_activated?: number | null
          started_at?: string
          total_events?: number | null
          updated_at?: string | null
          user_id?: string
          workspace_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      production_events: {
        Row: {
          affected_users: number | null
          ai_analysis: Json | null
          browser: string | null
          component: string | null
          created_at: string | null
          device_type: string | null
          event_type: string
          external_id: string
          external_url: string | null
          fingerprint: string | null
          first_seen_at: string | null
          id: string
          integration_id: string | null
          last_seen_at: string | null
          message: string | null
          metadata: Json | null
          occurrence_count: number | null
          os: string | null
          project_id: string
          raw_payload: Json | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause: string | null
          severity: string
          source: string
          stack_trace: string | null
          status: string | null
          suggested_fix: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
          user_action: string | null
        }
        Insert: {
          affected_users?: number | null
          ai_analysis?: Json | null
          browser?: string | null
          component?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type: string
          external_id: string
          external_url?: string | null
          fingerprint?: string | null
          first_seen_at?: string | null
          id?: string
          integration_id?: string | null
          last_seen_at?: string | null
          message?: string | null
          metadata?: Json | null
          occurrence_count?: number | null
          os?: string | null
          project_id: string
          raw_payload?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity: string
          source: string
          stack_trace?: string | null
          status?: string | null
          suggested_fix?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
          user_action?: string | null
        }
        Update: {
          affected_users?: number | null
          ai_analysis?: Json | null
          browser?: string | null
          component?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          external_id?: string
          external_url?: string | null
          fingerprint?: string | null
          first_seen_at?: string | null
          id?: string
          integration_id?: string | null
          last_seen_at?: string | null
          message?: string | null
          metadata?: Json | null
          occurrence_count?: number | null
          os?: string | null
          project_id?: string
          raw_payload?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity?: string
          source?: string
          stack_trace?: string | null
          status?: string | null
          suggested_fix?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          organization_member_id: string
          project_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_member_id: string
          project_id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_member_id?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
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
      project_stats: {
        Row: {
          avg_duration_ms: number | null
          avg_pass_rate: number | null
          id: string
          last_run_at: string | null
          last_run_status: string | null
          project_id: string
          total_failed: number | null
          total_passed: number | null
          total_runs: number | null
          total_tests: number | null
          updated_at: string | null
        }
        Insert: {
          avg_duration_ms?: number | null
          avg_pass_rate?: number | null
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          project_id: string
          total_failed?: number | null
          total_passed?: number | null
          total_runs?: number | null
          total_tests?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_duration_ms?: number | null
          avg_pass_rate?: number | null
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          project_id?: string
          total_failed?: number | null
          total_passed?: number | null
          total_runs?: number | null
          total_tests?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          app_url: string
          codebase_path: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          organization_id: string | null
          repository_url: string | null
          settings: Json | null
          slug: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          app_url: string
          codebase_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          organization_id?: string | null
          repository_url?: string | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          app_url?: string
          codebase_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          organization_id?: string | null
          repository_url?: string | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_audits: {
        Row: {
          accessibility_score: number | null
          best_practices_score: number | null
          cls: number | null
          completed_at: string | null
          created_at: string | null
          fcp_ms: number | null
          fid_ms: number | null
          id: string
          lcp_ms: number | null
          performance_score: number | null
          project_id: string
          seo_score: number | null
          started_at: string | null
          status: string | null
          triggered_by: string | null
          ttfb_ms: number | null
          tti_ms: number | null
          url: string
        }
        Insert: {
          accessibility_score?: number | null
          best_practices_score?: number | null
          cls?: number | null
          completed_at?: string | null
          created_at?: string | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          performance_score?: number | null
          project_id: string
          seo_score?: number | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
          ttfb_ms?: number | null
          tti_ms?: number | null
          url: string
        }
        Update: {
          accessibility_score?: number | null
          best_practices_score?: number | null
          cls?: number | null
          completed_at?: string | null
          created_at?: string | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          performance_score?: number | null
          project_id?: string
          seo_score?: number | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
          ttfb_ms?: number | null
          tti_ms?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_intelligence_stats: {
        Row: {
          active_integrations: number | null
          components_with_tests: number | null
          coverage_improvement_percent: number | null
          estimated_time_saved_hours: number | null
          events_last_24h: number | null
          events_last_30d: number | null
          events_last_7d: number | null
          high_risk_components: number | null
          id: string
          incidents_prevented: number | null
          last_event_received_at: string | null
          project_id: string
          tests_approved: number | null
          tests_deployed: number | null
          tests_generated: number | null
          total_production_events: number | null
          updated_at: string | null
        }
        Insert: {
          active_integrations?: number | null
          components_with_tests?: number | null
          coverage_improvement_percent?: number | null
          estimated_time_saved_hours?: number | null
          events_last_24h?: number | null
          events_last_30d?: number | null
          events_last_7d?: number | null
          high_risk_components?: number | null
          id?: string
          incidents_prevented?: number | null
          last_event_received_at?: string | null
          project_id: string
          tests_approved?: number | null
          tests_deployed?: number | null
          tests_generated?: number | null
          total_production_events?: number | null
          updated_at?: string | null
        }
        Update: {
          active_integrations?: number | null
          components_with_tests?: number | null
          coverage_improvement_percent?: number | null
          estimated_time_saved_hours?: number | null
          events_last_24h?: number | null
          events_last_30d?: number | null
          events_last_7d?: number | null
          high_risk_components?: number | null
          id?: string
          incidents_prevented?: number | null
          last_event_received_at?: string | null
          project_id?: string
          tests_approved?: number | null
          tests_deployed?: number | null
          tests_generated?: number | null
          total_production_events?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_intelligence_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_scores: {
        Row: {
          calculated_at: string | null
          ci_score: number | null
          ci_success_rate: number | null
          coverage_percent: number | null
          coverage_score: number | null
          created_at: string | null
          error_count: number | null
          error_count_24h: number | null
          error_score: number | null
          factors: Json | null
          flaky_score: number | null
          flaky_test_count: number | null
          id: string
          overall_score: number
          previous_score: number | null
          project_id: string
          trend: string | null
          updated_at: string | null
        }
        Insert: {
          calculated_at?: string | null
          ci_score?: number | null
          ci_success_rate?: number | null
          coverage_percent?: number | null
          coverage_score?: number | null
          created_at?: string | null
          error_count?: number | null
          error_count_24h?: number | null
          error_score?: number | null
          factors?: Json | null
          flaky_score?: number | null
          flaky_test_count?: number | null
          id?: string
          overall_score?: number
          previous_score?: number | null
          project_id: string
          trend?: string | null
          updated_at?: string | null
        }
        Update: {
          calculated_at?: string | null
          ci_score?: number | null
          ci_success_rate?: number | null
          coverage_percent?: number | null
          coverage_score?: number | null
          created_at?: string | null
          error_count?: number | null
          error_count_24h?: number | null
          error_score?: number | null
          factors?: Json | null
          flaky_score?: number | null
          flaky_test_count?: number | null
          id?: string
          overall_score?: number
          previous_score?: number | null
          project_id?: string
          trend?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_entries: {
        Row: {
          endpoint: string | null
          id: string
          key: string
          request_count: number | null
          window_end: string
          window_start: string | null
        }
        Insert: {
          endpoint?: string | null
          id?: string
          key: string
          request_count?: number | null
          window_end: string
          window_start?: string | null
        }
        Update: {
          endpoint?: string | null
          id?: string
          key?: string
          request_count?: number | null
          window_end?: string
          window_start?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          content: Json | null
          coverage_percentage: number | null
          created_at: string | null
          created_by: string | null
          date_from: string | null
          date_to: string | null
          description: string | null
          duration_ms: number | null
          expires_at: string | null
          failed_tests: number | null
          file_size_bytes: number | null
          file_url: string | null
          format: string
          generated_at: string | null
          id: string
          metrics: Json | null
          name: string
          organization_id: string
          passed_tests: number | null
          project_id: string
          report_type: string
          skipped_tests: number | null
          status: string
          summary: Json | null
          test_run_id: string | null
          total_tests: number | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          coverage_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          description?: string | null
          duration_ms?: number | null
          expires_at?: string | null
          failed_tests?: number | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          generated_at?: string | null
          id?: string
          metrics?: Json | null
          name: string
          organization_id: string
          passed_tests?: number | null
          project_id: string
          report_type?: string
          skipped_tests?: number | null
          status?: string
          summary?: Json | null
          test_run_id?: string | null
          total_tests?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          coverage_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          description?: string | null
          duration_ms?: number | null
          expires_at?: string | null
          failed_tests?: number | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          generated_at?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          organization_id?: string
          passed_tests?: number | null
          project_id?: string
          report_type?: string
          skipped_tests?: number | null
          status?: string
          summary?: Json | null
          test_run_id?: string | null
          total_tests?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      revoked_tokens: {
        Row: {
          expires_at: string
          jti: string
          reason: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          expires_at: string
          jti: string
          reason?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string
          jti?: string
          reason?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          affected_users: number | null
          calculated_at: string | null
          calculation_version: number | null
          change_frequency_score: number | null
          created_at: string | null
          entity_identifier: string
          entity_name: string | null
          entity_type: string
          error_count: number | null
          error_frequency_score: number | null
          error_severity_score: number | null
          factors: Json | null
          id: string
          last_calculated_at: string | null
          overall_risk_score: number
          overall_score: number
          previous_score: number | null
          priority_tests_needed: string[] | null
          project_id: string
          recommendations: Json | null
          score_trend: string | null
          test_coverage_score: number | null
          trend: string | null
          updated_at: string | null
          user_impact_score: number | null
        }
        Insert: {
          affected_users?: number | null
          calculated_at?: string | null
          calculation_version?: number | null
          change_frequency_score?: number | null
          created_at?: string | null
          entity_identifier: string
          entity_name?: string | null
          entity_type: string
          error_count?: number | null
          error_frequency_score?: number | null
          error_severity_score?: number | null
          factors?: Json | null
          id?: string
          last_calculated_at?: string | null
          overall_risk_score: number
          overall_score?: number
          previous_score?: number | null
          priority_tests_needed?: string[] | null
          project_id: string
          recommendations?: Json | null
          score_trend?: string | null
          test_coverage_score?: number | null
          trend?: string | null
          updated_at?: string | null
          user_impact_score?: number | null
        }
        Update: {
          affected_users?: number | null
          calculated_at?: string | null
          calculation_version?: number | null
          change_frequency_score?: number | null
          created_at?: string | null
          entity_identifier?: string
          entity_name?: string | null
          entity_type?: string
          error_count?: number | null
          error_frequency_score?: number | null
          error_severity_score?: number | null
          factors?: Json | null
          id?: string
          last_calculated_at?: string | null
          overall_risk_score?: number
          overall_score?: number
          previous_score?: number | null
          priority_tests_needed?: string[] | null
          project_id?: string
          recommendations?: Json | null
          score_trend?: string | null
          test_coverage_score?: number | null
          trend?: string | null
          updated_at?: string | null
          user_impact_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_runs: {
        Row: {
          ai_analysis: Json | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          failure_category: string | null
          failure_confidence: number | null
          flaky_score: number | null
          id: string
          is_flaky: boolean | null
          logs: Json | null
          metadata: Json | null
          schedule_id: string
          started_at: string | null
          status: string | null
          test_run_id: string | null
          tests_failed: number | null
          tests_passed: number | null
          tests_skipped: number | null
          tests_total: number | null
          trigger_type: string | null
          triggered_at: string | null
          triggered_by: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failure_category?: string | null
          failure_confidence?: number | null
          flaky_score?: number | null
          id?: string
          is_flaky?: boolean | null
          logs?: Json | null
          metadata?: Json | null
          schedule_id: string
          started_at?: string | null
          status?: string | null
          test_run_id?: string | null
          tests_failed?: number | null
          tests_passed?: number | null
          tests_skipped?: number | null
          tests_total?: number | null
          trigger_type?: string | null
          triggered_at?: string | null
          triggered_by?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failure_category?: string | null
          failure_confidence?: number | null
          flaky_score?: number | null
          id?: string
          is_flaky?: boolean | null
          logs?: Json | null
          metadata?: Json | null
          schedule_id?: string
          started_at?: string | null
          status?: string | null
          test_run_id?: string | null
          tests_failed?: number | null
          tests_passed?: number | null
          tests_skipped?: number | null
          tests_total?: number | null
          trigger_type?: string | null
          triggered_at?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_runs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "test_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_runs_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string
          details: Json | null
          id: string
          ip_address: unknown
          organization_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          api_key_id: string | null
          content_hash: string | null
          cost_usd: number | null
          created_at: string | null
          data_classification: string | null
          description: string | null
          duration_ms: number | null
          event_type: string
          id: string
          input_tokens: number | null
          ip_address: unknown
          is_sensitive: boolean | null
          metadata: Json | null
          method: string | null
          model: string | null
          organization_id: string | null
          outcome: string | null
          output_tokens: number | null
          path: string | null
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          retention_days: number | null
          session_id: string | null
          severity: string
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          api_key_id?: string | null
          content_hash?: string | null
          cost_usd?: number | null
          created_at?: string | null
          data_classification?: string | null
          description?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          input_tokens?: number | null
          ip_address?: unknown
          is_sensitive?: boolean | null
          metadata?: Json | null
          method?: string | null
          model?: string | null
          organization_id?: string | null
          outcome?: string | null
          output_tokens?: number | null
          path?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          retention_days?: number | null
          session_id?: string | null
          severity?: string
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          api_key_id?: string | null
          content_hash?: string | null
          cost_usd?: number | null
          created_at?: string | null
          data_classification?: string | null
          description?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          input_tokens?: number | null
          ip_address?: unknown
          is_sensitive?: boolean | null
          metadata?: Json | null
          method?: string | null
          model?: string | null
          organization_id?: string | null
          outcome?: string | null
          output_tokens?: number | null
          path?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          retention_days?: number | null
          session_id?: string | null
          severity?: string
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      selector_alternatives: {
        Row: {
          alternatives: Json
          created_at: string | null
          discovery_session_id: string | null
          element_label: string | null
          element_type: string | null
          fingerprint: string
          id: string
          page_url: string | null
          primary_selector: string
          project_id: string
          source: string | null
          stability_score: number | null
          success_count: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          alternatives?: Json
          created_at?: string | null
          discovery_session_id?: string | null
          element_label?: string | null
          element_type?: string | null
          fingerprint: string
          id?: string
          page_url?: string | null
          primary_selector: string
          project_id: string
          source?: string | null
          stability_score?: number | null
          success_count?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          alternatives?: Json
          created_at?: string | null
          discovery_session_id?: string | null
          element_label?: string | null
          element_type?: string | null
          fingerprint?: string
          id?: string
          page_url?: string | null
          primary_selector?: string
          project_id?: string
          source?: string | null
          stability_score?: number | null
          success_count?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "selector_alternatives_discovery_session_id_fkey"
            columns: ["discovery_session_id"]
            isOneToOne: false
            referencedRelation: "discovery_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selector_alternatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      self_healing_config: {
        Row: {
          approvers: string[] | null
          auto_apply: boolean | null
          auto_approve_after_hours: number | null
          created_at: string | null
          enabled: boolean | null
          heal_selectors: boolean | null
          heal_text_content: boolean | null
          heal_timeouts: boolean | null
          id: string
          learn_from_manual_fixes: boolean | null
          learn_from_success: boolean | null
          max_heals_per_hour: number | null
          max_heals_per_test: number | null
          max_selector_variations: number | null
          max_wait_time_ms: number | null
          min_confidence_auto: number | null
          min_confidence_suggest: number | null
          notification_channels: Json | null
          notify_on_heal: boolean | null
          notify_on_suggestion: boolean | null
          organization_id: string
          preferred_selector_strategies: string[] | null
          project_id: string | null
          require_approval: boolean | null
          share_patterns_across_projects: boolean | null
          text_similarity_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          approvers?: string[] | null
          auto_apply?: boolean | null
          auto_approve_after_hours?: number | null
          created_at?: string | null
          enabled?: boolean | null
          heal_selectors?: boolean | null
          heal_text_content?: boolean | null
          heal_timeouts?: boolean | null
          id?: string
          learn_from_manual_fixes?: boolean | null
          learn_from_success?: boolean | null
          max_heals_per_hour?: number | null
          max_heals_per_test?: number | null
          max_selector_variations?: number | null
          max_wait_time_ms?: number | null
          min_confidence_auto?: number | null
          min_confidence_suggest?: number | null
          notification_channels?: Json | null
          notify_on_heal?: boolean | null
          notify_on_suggestion?: boolean | null
          organization_id: string
          preferred_selector_strategies?: string[] | null
          project_id?: string | null
          require_approval?: boolean | null
          share_patterns_across_projects?: boolean | null
          text_similarity_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          approvers?: string[] | null
          auto_apply?: boolean | null
          auto_approve_after_hours?: number | null
          created_at?: string | null
          enabled?: boolean | null
          heal_selectors?: boolean | null
          heal_text_content?: boolean | null
          heal_timeouts?: boolean | null
          id?: string
          learn_from_manual_fixes?: boolean | null
          learn_from_success?: boolean | null
          max_heals_per_hour?: number | null
          max_heals_per_test?: number | null
          max_selector_variations?: number | null
          max_wait_time_ms?: number | null
          min_confidence_auto?: number | null
          min_confidence_suggest?: number | null
          notification_channels?: Json | null
          notify_on_heal?: boolean | null
          notify_on_suggestion?: boolean | null
          organization_id?: string
          preferred_selector_strategies?: string[] | null
          project_id?: string | null
          require_approval?: boolean | null
          share_patterns_across_projects?: boolean | null
          text_similarity_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "self_healing_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "self_healing_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_failure_patterns: {
        Row: {
          created_at: string | null
          embedding: string | null
          error_message: string
          error_type: string | null
          failure_count: number | null
          healed_selector: string | null
          healing_method: string | null
          id: string
          metadata: Json | null
          selector: string | null
          success_count: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          error_message: string
          error_type?: string | null
          failure_count?: number | null
          healed_selector?: string | null
          healing_method?: string | null
          id?: string
          metadata?: Json | null
          selector?: string | null
          success_count?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          error_message?: string
          error_type?: string | null
          failure_count?: number | null
          healed_selector?: string | null
          healing_method?: string | null
          id?: string
          metadata?: Json | null
          selector?: string | null
          success_count?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_test_failure_patterns_test_id"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_generation_jobs: {
        Row: {
          ai_model: string | null
          completed_at: string | null
          completion_tokens: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          production_event_id: string | null
          project_id: string
          prompt_tokens: number | null
          started_at: string | null
          status: string | null
          tests_approved: number | null
          tests_generated: number | null
          total_cost_cents: number | null
        }
        Insert: {
          ai_model?: string | null
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_type: string
          metadata?: Json | null
          production_event_id?: string | null
          project_id: string
          prompt_tokens?: number | null
          started_at?: string | null
          status?: string | null
          tests_approved?: number | null
          tests_generated?: number | null
          total_cost_cents?: number | null
        }
        Update: {
          ai_model?: string | null
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          production_event_id?: string | null
          project_id?: string
          prompt_tokens?: number | null
          started_at?: string | null
          status?: string | null
          tests_approved?: number | null
          tests_generated?: number | null
          total_cost_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_generation_jobs_production_event_id_fkey"
            columns: ["production_event_id"]
            isOneToOne: false
            referencedRelation: "production_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_generation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          name: string
          retry_count: number | null
          started_at: string | null
          status: string
          step_results: Json | null
          steps_completed: number | null
          steps_total: number | null
          test_id: string | null
          test_run_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          name: string
          retry_count?: number | null
          started_at?: string | null
          status: string
          step_results?: Json | null
          steps_completed?: number | null
          steps_total?: number | null
          test_id?: string | null
          test_run_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          name?: string
          retry_count?: number | null
          started_at?: string | null
          status?: string
          step_results?: Json | null
          steps_completed?: number | null
          steps_total?: number | null
          test_id?: string | null
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          app_url: string
          browser: string | null
          ci_metadata: Json | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          environment: string | null
          failed_tests: number | null
          id: string
          name: string | null
          passed_tests: number | null
          project_id: string
          skipped_tests: number | null
          started_at: string | null
          status: string | null
          total_tests: number | null
          trigger: string | null
          triggered_by: string | null
        }
        Insert: {
          app_url: string
          browser?: string | null
          ci_metadata?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          failed_tests?: number | null
          id?: string
          name?: string | null
          passed_tests?: number | null
          project_id: string
          skipped_tests?: number | null
          started_at?: string | null
          status?: string | null
          total_tests?: number | null
          trigger?: string | null
          triggered_by?: string | null
        }
        Update: {
          app_url?: string
          browser?: string | null
          ci_metadata?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          environment?: string | null
          failed_tests?: number | null
          id?: string
          name?: string | null
          passed_tests?: number | null
          project_id?: string
          skipped_tests?: number | null
          started_at?: string | null
          status?: string | null
          total_tests?: number | null
          trigger?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_schedules: {
        Row: {
          app_url_override: string | null
          auto_heal_confidence_threshold: number | null
          auto_heal_enabled: boolean | null
          browser: string | null
          created_at: string | null
          created_by: string | null
          cron_expression: string
          description: string | null
          enabled: boolean | null
          environment: string | null
          environment_variables: Json | null
          failure_count: number | null
          flaky_threshold: number | null
          id: string
          is_recurring: boolean | null
          last_run_at: string | null
          max_parallel_tests: number | null
          name: string
          next_run_at: string | null
          notification_config: Json | null
          organization_id: string | null
          project_id: string
          quarantine_flaky_tests: boolean | null
          retry_count: number | null
          retry_failed_tests: boolean | null
          run_count: number | null
          success_rate: number | null
          tags: string[] | null
          test_filter: Json | null
          test_ids: string[] | null
          timeout_ms: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          app_url_override?: string | null
          auto_heal_confidence_threshold?: number | null
          auto_heal_enabled?: boolean | null
          browser?: string | null
          created_at?: string | null
          created_by?: string | null
          cron_expression: string
          description?: string | null
          enabled?: boolean | null
          environment?: string | null
          environment_variables?: Json | null
          failure_count?: number | null
          flaky_threshold?: number | null
          id?: string
          is_recurring?: boolean | null
          last_run_at?: string | null
          max_parallel_tests?: number | null
          name: string
          next_run_at?: string | null
          notification_config?: Json | null
          organization_id?: string | null
          project_id: string
          quarantine_flaky_tests?: boolean | null
          retry_count?: number | null
          retry_failed_tests?: boolean | null
          run_count?: number | null
          success_rate?: number | null
          tags?: string[] | null
          test_filter?: Json | null
          test_ids?: string[] | null
          timeout_ms?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          app_url_override?: string | null
          auto_heal_confidence_threshold?: number | null
          auto_heal_enabled?: boolean | null
          browser?: string | null
          created_at?: string | null
          created_by?: string | null
          cron_expression?: string
          description?: string | null
          enabled?: boolean | null
          environment?: string | null
          environment_variables?: Json | null
          failure_count?: number | null
          flaky_threshold?: number | null
          id?: string
          is_recurring?: boolean | null
          last_run_at?: string | null
          max_parallel_tests?: number | null
          name?: string
          next_run_at?: string | null
          notification_config?: Json | null
          organization_id?: string | null
          project_id?: string
          quarantine_flaky_tests?: boolean | null
          retry_count?: number | null
          retry_failed_tests?: boolean | null
          run_count?: number | null
          success_rate?: number | null
          tags?: string[] | null
          test_filter?: Json | null
          test_ids?: string[] | null
          timeout_ms?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: string | null
          project_id: string
          source: string | null
          steps: Json
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: string | null
          project_id: string
          source?: string | null
          steps?: Json
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string | null
          project_id?: string
          source?: string | null
          steps?: Json
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_usage: {
        Row: {
          cost_usd: number
          created_at: string | null
          id: string
          input_tokens: number
          key_source: string
          message_id: string | null
          model: string
          organization_id: string | null
          output_tokens: number
          provider: string
          request_id: string | null
          task_type: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string | null
          id?: string
          input_tokens?: number
          key_source?: string
          message_id?: string | null
          model: string
          organization_id?: string | null
          output_tokens?: number
          provider: string
          request_id?: string | null
          task_type?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string | null
          id?: string
          input_tokens?: number
          key_source?: string
          message_id?: string | null
          model?: string
          organization_id?: string | null
          output_tokens?: number
          provider?: string
          request_id?: string | null
          task_type?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_ai_usage_daily: {
        Row: {
          byok_cost: number | null
          created_at: string | null
          date: string
          id: string
          platform_key_cost: number | null
          total_cost_usd: number
          total_input_tokens: number
          total_output_tokens: number
          total_requests: number
          updated_at: string | null
          usage_by_model: Json | null
          usage_by_provider: Json | null
          user_id: string
        }
        Insert: {
          byok_cost?: number | null
          created_at?: string | null
          date?: string
          id?: string
          platform_key_cost?: number | null
          total_cost_usd?: number
          total_input_tokens?: number
          total_output_tokens?: number
          total_requests?: number
          updated_at?: string | null
          usage_by_model?: Json | null
          usage_by_provider?: Json | null
          user_id: string
        }
        Update: {
          byok_cost?: number | null
          created_at?: string | null
          date?: string
          id?: string
          platform_key_cost?: number | null
          total_cost_usd?: number
          total_input_tokens?: number
          total_output_tokens?: number
          total_requests?: number
          updated_at?: string | null
          usage_by_model?: Json | null
          usage_by_provider?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_usage_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          ai_preferences: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          default_organization_id: string | null
          default_project_id: string | null
          discovery_preferences: Json | null
          display_name: string | null
          email: string | null
          id: string
          language: string | null
          last_active_at: string | null
          last_login_at: string | null
          login_count: number | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          test_defaults: Json | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          default_organization_id?: string | null
          default_project_id?: string | null
          discovery_preferences?: Json | null
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          login_count?: number | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          test_defaults?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          default_organization_id?: string | null
          default_project_id?: string | null
          discovery_preferences?: Json | null
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          login_count?: number | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          test_defaults?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_default_organization_id_fkey"
            columns: ["default_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_default_project_id_fkey"
            columns: ["default_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_provider_keys: {
        Row: {
          created_at: string | null
          dek_reference: string | null
          dek_version: number | null
          display_name: string | null
          encrypted_at: string | null
          encrypted_key: string
          encryption_method: string | null
          id: string
          is_valid: boolean | null
          key_prefix: string
          key_suffix: string | null
          last_validated_at: string | null
          provider: string
          updated_at: string | null
          user_id: string
          validation_error: string | null
        }
        Insert: {
          created_at?: string | null
          dek_reference?: string | null
          dek_version?: number | null
          display_name?: string | null
          encrypted_at?: string | null
          encrypted_key: string
          encryption_method?: string | null
          id?: string
          is_valid?: boolean | null
          key_prefix: string
          key_suffix?: string | null
          last_validated_at?: string | null
          provider: string
          updated_at?: string | null
          user_id: string
          validation_error?: string | null
        }
        Update: {
          created_at?: string | null
          dek_reference?: string | null
          dek_version?: number | null
          display_name?: string | null
          encrypted_at?: string | null
          encrypted_key?: string
          encryption_method?: string | null
          id?: string
          is_valid?: boolean | null
          key_prefix?: string
          key_suffix?: string | null
          last_validated_at?: string | null
          provider?: string
          updated_at?: string | null
          user_id?: string
          validation_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_provider_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string | null
          session_token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          session_token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          session_token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      viewport_presets: {
        Row: {
          created_at: string | null
          description: string | null
          device_category: string | null
          device_name: string | null
          device_scale_factor: number | null
          display_order: number | null
          has_touch: boolean | null
          height: number
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_landscape: boolean | null
          is_mobile: boolean | null
          is_system: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          os_name: string | null
          os_version: string | null
          project_id: string | null
          updated_at: string | null
          user_agent: string | null
          width: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          device_category?: string | null
          device_name?: string | null
          device_scale_factor?: number | null
          display_order?: number | null
          has_touch?: boolean | null
          height: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_landscape?: boolean | null
          is_mobile?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          os_name?: string | null
          os_version?: string | null
          project_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          width: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          device_category?: string | null
          device_name?: string | null
          device_scale_factor?: number | null
          display_order?: number | null
          has_touch?: boolean | null
          height?: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_landscape?: boolean | null
          is_mobile?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          os_name?: string | null
          os_version?: string | null
          project_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "viewport_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewport_presets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_baseline_history: {
        Row: {
          baseline_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          screenshot_path: string | null
          version: number
        }
        Insert: {
          baseline_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          screenshot_path?: string | null
          version: number
        }
        Update: {
          baseline_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          screenshot_path?: string | null
          version?: number
        }
        Relationships: []
      }
      visual_baselines: {
        Row: {
          accessibility_score: number | null
          browser: string | null
          captured_at: string | null
          category: string | null
          color_palette: string[] | null
          computed_styles: Json | null
          created_at: string | null
          created_by: string | null
          discovery_session_id: string | null
          dom_snapshot: string | null
          element_count: number | null
          id: string
          is_active: boolean | null
          layout_hash: string | null
          metadata: Json | null
          name: string
          page_url: string
          performance_metrics: Json | null
          project_id: string
          screenshot_hash: string | null
          screenshot_path: string | null
          screenshot_url: string
          selector: string | null
          source: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
          url: string | null
          version: number | null
          viewport: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          accessibility_score?: number | null
          browser?: string | null
          captured_at?: string | null
          category?: string | null
          color_palette?: string[] | null
          computed_styles?: Json | null
          created_at?: string | null
          created_by?: string | null
          discovery_session_id?: string | null
          dom_snapshot?: string | null
          element_count?: number | null
          id?: string
          is_active?: boolean | null
          layout_hash?: string | null
          metadata?: Json | null
          name: string
          page_url: string
          performance_metrics?: Json | null
          project_id: string
          screenshot_hash?: string | null
          screenshot_path?: string | null
          screenshot_url: string
          selector?: string | null
          source?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
          url?: string | null
          version?: number | null
          viewport?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          accessibility_score?: number | null
          browser?: string | null
          captured_at?: string | null
          category?: string | null
          color_palette?: string[] | null
          computed_styles?: Json | null
          created_at?: string | null
          created_by?: string | null
          discovery_session_id?: string | null
          dom_snapshot?: string | null
          element_count?: number | null
          id?: string
          is_active?: boolean | null
          layout_hash?: string | null
          metadata?: Json | null
          name?: string
          page_url?: string
          performance_metrics?: Json | null
          project_id?: string
          screenshot_hash?: string | null
          screenshot_path?: string | null
          screenshot_url?: string
          selector?: string | null
          source?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
          url?: string | null
          version?: number | null
          viewport?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_visual_baselines_test_id"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_baselines_discovery_session_id_fkey"
            columns: ["discovery_session_id"]
            isOneToOne: false
            referencedRelation: "discovery_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_changes: {
        Row: {
          baseline_value: string | null
          bounds_baseline: Json | null
          bounds_current: Json | null
          category: string
          change_group_id: string | null
          commit_author: string | null
          commit_date: string | null
          comparison_id: string
          confidence: number | null
          created_at: string | null
          current_value: string | null
          description: string
          element_class: string | null
          element_id: string | null
          element_selector: string | null
          element_tag: string | null
          element_xpath: string | null
          id: string
          impact_assessment: string | null
          intent: string | null
          metadata: Json | null
          property_name: string | null
          recommendation: string | null
          related_commit: string | null
          related_files: string[] | null
          root_cause: string | null
          severity: number
        }
        Insert: {
          baseline_value?: string | null
          bounds_baseline?: Json | null
          bounds_current?: Json | null
          category: string
          change_group_id?: string | null
          commit_author?: string | null
          commit_date?: string | null
          comparison_id: string
          confidence?: number | null
          created_at?: string | null
          current_value?: string | null
          description: string
          element_class?: string | null
          element_id?: string | null
          element_selector?: string | null
          element_tag?: string | null
          element_xpath?: string | null
          id?: string
          impact_assessment?: string | null
          intent?: string | null
          metadata?: Json | null
          property_name?: string | null
          recommendation?: string | null
          related_commit?: string | null
          related_files?: string[] | null
          root_cause?: string | null
          severity?: number
        }
        Update: {
          baseline_value?: string | null
          bounds_baseline?: Json | null
          bounds_current?: Json | null
          category?: string
          change_group_id?: string | null
          commit_author?: string | null
          commit_date?: string | null
          comparison_id?: string
          confidence?: number | null
          created_at?: string | null
          current_value?: string | null
          description?: string
          element_class?: string | null
          element_id?: string | null
          element_selector?: string | null
          element_tag?: string | null
          element_xpath?: string | null
          id?: string
          impact_assessment?: string | null
          intent?: string | null
          metadata?: Json | null
          property_name?: string | null
          recommendation?: string | null
          related_commit?: string | null
          related_files?: string[] | null
          root_cause?: string | null
          severity?: number
        }
        Relationships: [
          {
            foreignKeyName: "visual_changes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "visual_comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_comparisons: {
        Row: {
          ai_analysis: Json | null
          ai_explanation: Json | null
          algorithm: string | null
          approved_at: string | null
          approved_by: string | null
          approved_changes: string[] | null
          baseline_id: string | null
          baseline_url: string | null
          compared_at: string | null
          context: string | null
          cost_usd: number | null
          created_at: string | null
          current_snapshot_id: string | null
          current_url: string
          diff_image_url: string | null
          diff_percentage: number | null
          diff_pixel_count: number | null
          diff_url: string | null
          difference_count: number | null
          differences: Json | null
          has_regressions: boolean | null
          heatmap_url: string | null
          id: string
          match_percentage: number | null
          metadata: Json | null
          name: string
          performance_diff: Json | null
          project_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          snapshot_id: string | null
          status: string
          summary: string | null
          threshold: number | null
          threshold_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_explanation?: Json | null
          algorithm?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_changes?: string[] | null
          baseline_id?: string | null
          baseline_url?: string | null
          compared_at?: string | null
          context?: string | null
          cost_usd?: number | null
          created_at?: string | null
          current_snapshot_id?: string | null
          current_url: string
          diff_image_url?: string | null
          diff_percentage?: number | null
          diff_pixel_count?: number | null
          diff_url?: string | null
          difference_count?: number | null
          differences?: Json | null
          has_regressions?: boolean | null
          heatmap_url?: string | null
          id?: string
          match_percentage?: number | null
          metadata?: Json | null
          name: string
          performance_diff?: Json | null
          project_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_id?: string | null
          status: string
          summary?: string | null
          threshold?: number | null
          threshold_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_explanation?: Json | null
          algorithm?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_changes?: string[] | null
          baseline_id?: string | null
          baseline_url?: string | null
          compared_at?: string | null
          context?: string | null
          cost_usd?: number | null
          created_at?: string | null
          current_snapshot_id?: string | null
          current_url?: string
          diff_image_url?: string | null
          diff_percentage?: number | null
          diff_pixel_count?: number | null
          diff_url?: string | null
          difference_count?: number | null
          differences?: Json | null
          has_regressions?: boolean | null
          heatmap_url?: string | null
          id?: string
          match_percentage?: number | null
          metadata?: Json | null
          name?: string
          performance_diff?: Json | null
          project_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_id?: string | null
          status?: string
          summary?: string | null
          threshold?: number | null
          threshold_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_comparisons_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "visual_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_comparisons_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_comparisons_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "visual_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_snapshots: {
        Row: {
          baseline_id: string | null
          browser: string
          browser_version: string | null
          captured_at: string | null
          cls_score: number | null
          color_palette: string[] | null
          comparison_status: string | null
          created_at: string | null
          dom_snapshot_url: string | null
          element_count: number | null
          fcp_ms: number | null
          fid_ms: number | null
          git_author: string | null
          git_branch: string | null
          git_commit: string | null
          git_message: string | null
          har_url: string | null
          id: string
          layout_hash: string | null
          lcp_ms: number | null
          match_percentage: number | null
          metadata: Json | null
          name: string | null
          page_title: string | null
          page_url: string | null
          project_id: string
          screenshot_path: string | null
          screenshot_url: string
          test_run_id: string | null
          tti_ms: number | null
          url: string | null
          user_agent: string | null
          viewport: Json
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          baseline_id?: string | null
          browser?: string
          browser_version?: string | null
          captured_at?: string | null
          cls_score?: number | null
          color_palette?: string[] | null
          comparison_status?: string | null
          created_at?: string | null
          dom_snapshot_url?: string | null
          element_count?: number | null
          fcp_ms?: number | null
          fid_ms?: number | null
          git_author?: string | null
          git_branch?: string | null
          git_commit?: string | null
          git_message?: string | null
          har_url?: string | null
          id?: string
          layout_hash?: string | null
          lcp_ms?: number | null
          match_percentage?: number | null
          metadata?: Json | null
          name?: string | null
          page_title?: string | null
          page_url?: string | null
          project_id: string
          screenshot_path?: string | null
          screenshot_url: string
          test_run_id?: string | null
          tti_ms?: number | null
          url?: string | null
          user_agent?: string | null
          viewport?: Json
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          baseline_id?: string | null
          browser?: string
          browser_version?: string | null
          captured_at?: string | null
          cls_score?: number | null
          color_palette?: string[] | null
          comparison_status?: string | null
          created_at?: string | null
          dom_snapshot_url?: string | null
          element_count?: number | null
          fcp_ms?: number | null
          fid_ms?: number | null
          git_author?: string | null
          git_branch?: string | null
          git_commit?: string | null
          git_message?: string | null
          har_url?: string | null
          id?: string
          layout_hash?: string | null
          lcp_ms?: number | null
          match_percentage?: number | null
          metadata?: Json | null
          name?: string | null
          page_title?: string | null
          page_url?: string | null
          project_id?: string
          screenshot_path?: string | null
          screenshot_url?: string
          test_run_id?: string | null
          tti_ms?: number | null
          url?: string | null
          user_agent?: string | null
          viewport?: Json
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_visual_snapshots_test_run_id"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_snapshots_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "visual_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_test_history: {
        Row: {
          auto_approved: number
          avg_cls_score: number | null
          avg_lcp_ms: number | null
          avg_match_percentage: number | null
          avg_tti_ms: number | null
          baseline_id: string | null
          baseline_updates: number | null
          changes_by_category: Json | null
          changes_by_severity: Json | null
          comparisons_by_browser: Json | null
          comparisons_by_viewport: Json | null
          created_at: string | null
          date: string
          id: string
          manually_approved: number
          matches: number
          max_match_percentage: number | null
          metadata: Json | null
          min_match_percentage: number | null
          mismatches: number
          pending: number
          project_id: string
          rejected: number
          total_comparisons: number
          updated_at: string | null
        }
        Insert: {
          auto_approved?: number
          avg_cls_score?: number | null
          avg_lcp_ms?: number | null
          avg_match_percentage?: number | null
          avg_tti_ms?: number | null
          baseline_id?: string | null
          baseline_updates?: number | null
          changes_by_category?: Json | null
          changes_by_severity?: Json | null
          comparisons_by_browser?: Json | null
          comparisons_by_viewport?: Json | null
          created_at?: string | null
          date?: string
          id?: string
          manually_approved?: number
          matches?: number
          max_match_percentage?: number | null
          metadata?: Json | null
          min_match_percentage?: number | null
          mismatches?: number
          pending?: number
          project_id: string
          rejected?: number
          total_comparisons?: number
          updated_at?: string | null
        }
        Update: {
          auto_approved?: number
          avg_cls_score?: number | null
          avg_lcp_ms?: number | null
          avg_match_percentage?: number | null
          avg_tti_ms?: number | null
          baseline_id?: string | null
          baseline_updates?: number | null
          changes_by_category?: Json | null
          changes_by_severity?: Json | null
          comparisons_by_browser?: Json | null
          comparisons_by_viewport?: Json | null
          created_at?: string | null
          date?: string
          id?: string
          manually_approved?: number
          matches?: number
          max_match_percentage?: number | null
          metadata?: Json | null
          min_match_percentage?: number | null
          mismatches?: number
          pending?: number
          project_id?: string
          rejected?: number
          total_comparisons?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_test_history_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "visual_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_test_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          body: Json | null
          created_at: string | null
          error_message: string | null
          headers: Json | null
          id: string
          integration_id: string | null
          method: string | null
          processed_at: string | null
          processed_event_id: string | null
          processing_ms: number | null
          project_id: string | null
          received_at: string | null
          source: string
          status: string | null
        }
        Insert: {
          body?: Json | null
          created_at?: string | null
          error_message?: string | null
          headers?: Json | null
          id?: string
          integration_id?: string | null
          method?: string | null
          processed_at?: string | null
          processed_event_id?: string | null
          processing_ms?: number | null
          project_id?: string | null
          received_at?: string | null
          source: string
          status?: string | null
        }
        Update: {
          body?: Json | null
          created_at?: string | null
          error_message?: string | null
          headers?: Json | null
          id?: string
          integration_id?: string | null
          method?: string | null
          processed_at?: string | null
          processed_event_id?: string | null
          processing_ms?: number | null
          project_id?: string | null
          received_at?: string | null
          source?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_processed_event_id_fkey"
            columns: ["processed_event_id"]
            isOneToOne: false
            referencedRelation: "production_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      healing_analytics: {
        Row: {
          avg_confidence: number | null
          error_type: string | null
          healing_source: string | null
          pattern_count: number | null
          project_id: string | null
          total_failures: number | null
          total_successes: number | null
          unique_authors: number | null
          unique_components: number | null
        }
        Relationships: [
          {
            foreignKeyName: "healing_patterns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_active_mcp_connections: {
        Row: {
          client_name: string | null
          client_type: string | null
          connected_at: string | null
          connection_duration_seconds: number | null
          device_name: string | null
          id: string | null
          ip_address: unknown
          last_activity_at: string | null
          organization_id: string | null
          request_count: number | null
          scopes: string[] | null
          seconds_since_activity: number | null
          session_id: string | null
          tools_used: Json | null
          user_id: string | null
        }
        Insert: {
          client_name?: string | null
          client_type?: string | null
          connected_at?: string | null
          connection_duration_seconds?: never
          device_name?: string | null
          id?: string | null
          ip_address?: unknown
          last_activity_at?: string | null
          organization_id?: string | null
          request_count?: number | null
          scopes?: string[] | null
          seconds_since_activity?: never
          session_id?: string | null
          tools_used?: Json | null
          user_id?: string | null
        }
        Update: {
          client_name?: string | null
          client_type?: string | null
          connected_at?: string | null
          connection_duration_seconds?: never
          device_name?: string | null
          id?: string | null
          ip_address?: unknown
          last_activity_at?: string | null
          organization_id?: string | null
          request_count?: number | null
          scopes?: string[] | null
          seconds_since_activity?: never
          session_id?: string | null
          tools_used?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_mcp_connection_stats: {
        Row: {
          active_connections: number | null
          client_types: Json | null
          last_activity: string | null
          organization_id: string | null
          revoked_connections: number | null
          total_connections: number | null
          total_requests: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation_atomic: {
        Args: {
          p_invitation_id: string
          p_user_email: string
          p_user_id: string
        }
        Returns: Json
      }
      aggregate_visual_test_daily: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      approve_visual_comparison: {
        Args: {
          p_comparison_id: string
          p_notes?: string
          p_reviewed_by: string
          p_update_baseline?: boolean
        }
        Returns: undefined
      }
      calculate_quality_score: {
        Args: { p_project_id: string }
        Returns: number
      }
      check_ai_budget: {
        Args: { p_organization_id: string }
        Returns: {
          daily_remaining: number
          has_daily_budget: boolean
          has_monthly_budget: boolean
          monthly_remaining: number
        }[]
      }
      check_user_ai_budget: {
        Args: { p_user_id: string }
        Returns: {
          daily_limit: number
          daily_remaining: number
          daily_spent: number
          has_budget: boolean
          message_limit: number
        }[]
      }
      cleanup_expired_device_auth: { Args: never; Returns: number }
      cleanup_expired_oauth_states: { Args: never; Returns: number }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      cleanup_old_activity_logs: { Args: never; Returns: undefined }
      cleanup_old_notification_logs: {
        Args: { p_days?: number }
        Returns: number
      }
      cleanup_rate_limit_entries: { Args: never; Returns: undefined }
      cleanup_stale_sessions: { Args: never; Returns: undefined }
      create_audit_log: {
        Args: {
          p_action: string
          p_description: string
          p_error_message?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_organization_id: string
          p_resource_id: string
          p_resource_type: string
          p_status?: string
          p_user_agent?: string
          p_user_email: string
          p_user_id: string
        }
        Returns: string
      }
      create_discovery_snapshot: {
        Args: { p_project_id: string; p_session_id?: string }
        Returns: string
      }
      create_organization_atomic: {
        Args: {
          p_logo_url?: string
          p_name: string
          p_plan: string
          p_settings?: Json
          p_slug: string
          p_user_email: string
          p_user_id: string
        }
        Returns: Json
      }
      create_parameterized_run: {
        Args: {
          p_app_url?: string
          p_browser?: string
          p_environment?: string
          p_parameterized_test_id: string
          p_schedule_run_id?: string
          p_test_run_id?: string
          p_trigger_type?: string
          p_triggered_by?: string
        }
        Returns: string
      }
      create_schedule_run: {
        Args: {
          p_schedule_id: string
          p_trigger_type?: string
          p_triggered_by?: string
        }
        Returns: string
      }
      expire_old_recommendations: { Args: never; Returns: undefined }
      finalize_parameterized_run: {
        Args: { p_result_id: string }
        Returns: undefined
      }
      find_similar_healing_patterns: {
        Args: { p_limit?: number; p_project_id?: string; p_selector: string }
        Returns: {
          confidence: number
          git_commit_message: string
          git_commit_sha: string
          healed_selector: string
          healing_source: string
          id: string
          original_selector: string
          similarity: number
        }[]
      }
      generate_audit_compliance_report: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: Json
      }
      get_best_alternatives: {
        Args: { p_limit?: number; p_project_id: string; p_selector: string }
        Returns: {
          confidence: number
          selector: string
          strategy: string
          success_rate: number
          usage_count: number
        }[]
      }
      get_due_schedules: {
        Args: never
        Returns: {
          cron_expression: string
          project_id: string
          schedule_id: string
          schedule_name: string
          test_filter: Json
          test_ids: string[]
        }[]
      }
      get_executable_parameter_sets: {
        Args: { p_environment?: string; p_parameterized_test_id: string }
        Returns: {
          expected_outcome: string
          order_index: number
          param_values: Json
          set_id: string
          set_name: string
        }[]
      }
      get_org_member_counts: {
        Args: { org_ids: string[] }
        Returns: {
          count: number
          organization_id: string
        }[]
      }
      get_pending_notifications: {
        Args: { p_limit?: number }
        Returns: {
          channel_config: Json
          channel_id: string
          channel_type: string
          event_type: string
          log_id: string
          payload: Json
        }[]
      }
      get_plugin_activity_timeline: {
        Args: {
          limit_count?: number
          target_session_id?: string
          target_user_id: string
        }
        Returns: {
          duration_ms: number
          error_message: string
          event_id: string
          event_name: string
          event_type: string
          git_branch: string
          started_at: string
          status: string
        }[]
      }
      get_plugin_usage_summary: {
        Args: { days_back?: number; target_user_id: string }
        Returns: {
          avg_session_duration_ms: number
          most_used_command: string
          most_used_skill: string
          total_agents: number
          total_commands: number
          total_errors: number
          total_events: number
          total_sessions: number
          total_skills: number
        }[]
      }
      get_project_org_ids: {
        Args: { project_ids: string[] }
        Returns: {
          organization_id: string
          project_id: string
        }[]
      }
      get_project_test_counts: {
        Args: { project_ids: string[] }
        Returns: {
          count: number
          project_id: string
        }[]
      }
      get_user_daily_spend: { Args: { p_user_id: string }; Returns: number }
      get_visual_test_trends: {
        Args: { p_days?: number; p_project_id: string }
        Returns: {
          auto_approval_rate: number
          avg_match_percentage: number
          date: string
          match_rate: number
          total_comparisons: number
        }[]
      }
      import_parameter_sets: {
        Args: {
          p_data: Json
          p_parameterized_test_id: string
          p_source?: string
        }
        Returns: number
      }
      increment_plugin_session_counter: {
        Args: { p_field: string; p_session_id: string }
        Returns: undefined
      }
      insert_ai_audit_event: {
        Args: {
          p_action?: string
          p_content_hash?: string
          p_cost_usd?: number
          p_data_classification?: string
          p_description?: string
          p_duration_ms?: number
          p_event_type: string
          p_input_tokens?: number
          p_ip_address?: unknown
          p_metadata?: Json
          p_model?: string
          p_organization_id?: string
          p_outcome?: string
          p_output_tokens?: number
          p_resource_id?: string
          p_resource_type?: string
          p_retention_days?: number
          p_session_id?: string
          p_severity?: string
          p_user_id?: string
        }
        Returns: string
      }
      mark_notification_failed: {
        Args: {
          p_error_message: string
          p_log_id: string
          p_response_code?: number
        }
        Returns: undefined
      }
      mark_notification_sent: {
        Args: {
          p_log_id: string
          p_response_body?: string
          p_response_code?: number
        }
        Returns: undefined
      }
      query_ai_audit_events: {
        Args: {
          p_end_date?: string
          p_event_type?: string
          p_limit?: number
          p_model?: string
          p_organization_id?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          content_hash: string
          cost_usd: number
          created_at: string
          data_classification: string
          description: string
          duration_ms: number
          event_type: string
          id: string
          input_tokens: number
          metadata: Json
          model: string
          outcome: string
          output_tokens: number
          resource_id: string
          resource_type: string
          session_id: string
          severity: string
          user_id: string
        }[]
      }
      queue_notification: {
        Args: {
          p_channel_id: string
          p_event_id: string
          p_event_type: string
          p_payload: Json
          p_rule_id: string
        }
        Returns: string
      }
      record_ai_usage: {
        Args: {
          p_cached?: boolean
          p_cost_usd: number
          p_input_tokens: number
          p_latency_ms?: number
          p_metadata?: Json
          p_model: string
          p_organization_id: string
          p_output_tokens: number
          p_project_id: string
          p_provider: string
          p_request_id: string
          p_task_type: string
        }
        Returns: string
      }
      record_mcp_tool_usage: {
        Args: {
          p_connection_id: string
          p_duration_ms?: number
          p_error_message?: string
          p_metadata?: Json
          p_request_id?: string
          p_success?: boolean
          p_tool_name: string
        }
        Returns: string
      }
      record_user_ai_usage: {
        Args: {
          p_cost_usd: number
          p_input_tokens: number
          p_key_source?: string
          p_message_id?: string
          p_model: string
          p_organization_id: string
          p_output_tokens: number
          p_provider: string
          p_request_id?: string
          p_task_type?: string
          p_thread_id?: string
          p_user_id: string
        }
        Returns: string
      }
      record_visual_comparison: {
        Args: {
          p_algorithm?: string
          p_baseline_id: string
          p_diff_pixel_count?: number
          p_match_percentage: number
          p_project_id: string
          p_snapshot_id: string
          p_threshold?: number
        }
        Returns: string
      }
      reset_daily_ai_spend: { Args: never; Returns: undefined }
      reset_monthly_ai_spend: { Args: never; Returns: undefined }
      reset_notification_daily_counters: { Args: never; Returns: undefined }
      revoke_mcp_connection: {
        Args: {
          p_connection_id: string
          p_reason?: string
          p_revoked_by: string
        }
        Returns: boolean
      }
      search_memory_store: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          search_namespace: string[]
        }
        Returns: {
          id: string
          key: string
          similarity: number
          value: Json
        }[]
      }
      search_similar_discovery_patterns: {
        Args: {
          match_count?: number
          match_threshold?: number
          pattern_type_filter?: string
          query_embedding: string
        }
        Returns: {
          id: string
          pattern_data: Json
          pattern_name: string
          pattern_type: string
          similarity: number
          test_success_rate: number
          times_seen: number
        }[]
      }
      search_similar_failures: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          error_message: string
          healed_selector: string
          healing_method: string
          id: string
          similarity: number
          success_rate: number
        }[]
      }
      update_schedule_next_run: {
        Args: { p_schedule_id: string }
        Returns: string
      }
      upsert_mcp_connection: {
        Args: {
          p_client_id?: string
          p_client_name?: string
          p_client_type?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_organization_id: string
          p_scopes?: string[]
          p_session_id: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      infra_recommendation_priority: "critical" | "high" | "medium" | "low"
      infra_recommendation_status:
        | "pending"
        | "approved"
        | "rejected"
        | "auto_applied"
        | "expired"
      infra_recommendation_type:
        | "scale_down"
        | "scale_up"
        | "right_size"
        | "schedule_scaling"
        | "cleanup_sessions"
        | "cost_alert"
        | "anomaly"
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
      infra_recommendation_priority: ["critical", "high", "medium", "low"],
      infra_recommendation_status: [
        "pending",
        "approved",
        "rejected",
        "auto_applied",
        "expired",
      ],
      infra_recommendation_type: [
        "scale_down",
        "scale_up",
        "right_size",
        "schedule_scaling",
        "cleanup_sessions",
        "cost_alert",
        "anomaly",
      ],
    },
  },
} as const
