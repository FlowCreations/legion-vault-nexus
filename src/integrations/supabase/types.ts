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
      ab_test_assignments: {
        Row: {
          assigned_at: string | null
          campaign_id: string | null
          id: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          campaign_id?: string | null
          id?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          campaign_id?: string | null
          id?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ab_test_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_results: {
        Row: {
          avg_order_value: number | null
          conversion_rate: number | null
          conversions: number | null
          id: string
          last_updated: string | null
          step_number: number
          total_revenue: number | null
          variant_name: string
          views: number | null
        }
        Insert: {
          avg_order_value?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          id?: string
          last_updated?: string | null
          step_number: number
          total_revenue?: number | null
          variant_name: string
          views?: number | null
        }
        Update: {
          avg_order_value?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          id?: string
          last_updated?: string | null
          step_number?: number
          total_revenue?: number | null
          variant_name?: string
          views?: number | null
        }
        Relationships: []
      }
      ab_test_variants: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email_body: string | null
          id: string
          is_winner: boolean | null
          subject_line: string | null
          traffic_percentage: number | null
          variant_name: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email_body?: string | null
          id?: string
          is_winner?: boolean | null
          subject_line?: string | null
          traffic_percentage?: number | null
          variant_name: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email_body?: string | null
          id?: string
          is_winner?: boolean | null
          subject_line?: string | null
          traffic_percentage?: number | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      abandoned_cart_settings: {
        Row: {
          code_validity_days: number
          created_at: string | null
          delay_days: number
          discount_percentage: number
          id: string
          min_cart_value: number
          updated_at: string | null
        }
        Insert: {
          code_validity_days?: number
          created_at?: string | null
          delay_days?: number
          discount_percentage?: number
          id?: string
          min_cart_value?: number
          updated_at?: string | null
        }
        Update: {
          code_validity_days?: number
          created_at?: string | null
          delay_days?: number
          discount_percentage?: number
          id?: string
          min_cart_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      abandoned_carts: {
        Row: {
          cart_items: Json
          cart_value: number | null
          created_at: string | null
          discount_code: string | null
          discount_percentage: number | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          recovered_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          cart_items: Json
          cart_value?: number | null
          created_at?: string | null
          discount_code?: string | null
          discount_percentage?: number | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          recovered_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          cart_items?: Json
          cart_value?: number | null
          created_at?: string | null
          discount_code?: string | null
          discount_percentage?: number | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          recovered_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      adaptive_sequences: {
        Row: {
          created_at: string | null
          decision_tree: Json
          fatigue_rules: Json | null
          goal_id: string | null
          id: string
          is_active: boolean | null
          performance_metrics: Json | null
          sequence_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decision_tree?: Json
          fatigue_rules?: Json | null
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          sequence_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decision_tree?: Json
          fatigue_rules?: Json | null
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          sequence_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adaptive_sequences_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "marketing_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_content: {
        Row: {
          affiliate_id: string | null
          album_name: string | null
          artist_name: string | null
          click_count: number | null
          content_type: string | null
          content_url: string | null
          created_at: string
          description: string | null
          duration_ms: number | null
          id: string
          last_clicked_at: string | null
          release_date: string | null
          spotify_album_id: string | null
          spotify_artist_id: string | null
          spotify_track_id: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          affiliate_id?: string | null
          album_name?: string | null
          artist_name?: string | null
          click_count?: number | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          id?: string
          last_clicked_at?: string | null
          release_date?: string | null
          spotify_album_id?: string | null
          spotify_artist_id?: string | null
          spotify_track_id?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          affiliate_id?: string | null
          album_name?: string | null
          artist_name?: string | null
          click_count?: number | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          id?: string
          last_clicked_at?: string | null
          release_date?: string | null
          spotify_album_id?: string | null
          spotify_artist_id?: string | null
          spotify_track_id?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_content_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_content_clicks: {
        Row: {
          clicked_at: string | null
          content_id: string | null
          created_at: string | null
          id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_content_clicks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "affiliate_content"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referral_clicks: {
        Row: {
          affiliate_id: string
          converted: boolean
          converted_at: string | null
          created_at: string
          id: string
          landing_page: string | null
          link_type: string
          referrer_url: string | null
          source_platform: string | null
          user_agent: string | null
          visitor_jrny_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          affiliate_id: string
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          landing_page?: string | null
          link_type: string
          referrer_url?: string | null
          source_platform?: string | null
          user_agent?: string | null
          visitor_jrny_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          affiliate_id?: string
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          landing_page?: string | null
          link_type?: string
          referrer_url?: string | null
          source_platform?: string | null
          user_agent?: string | null
          visitor_jrny_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referral_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "fan_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_rewards: {
        Row: {
          affiliate_id: string
          created_at: string
          discount_code: string
          discount_percentage: number
          expires_at: string
          id: string
          reward_type: string
          shopify_price_rule_id: string | null
          trigger_type: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          discount_code: string
          discount_percentage: number
          expires_at: string
          id?: string
          reward_type?: string
          shopify_price_rule_id?: string | null
          trigger_type: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          discount_code?: string
          discount_percentage?: number
          expires_at?: string
          id?: string
          reward_type?: string
          shopify_price_rule_id?: string | null
          trigger_type?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_rewards_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "fan_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          analytics: Json | null
          artist_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          ethos: string | null
          id: string
          name: string
          non_negotiables: string[] | null
          social_links: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          analytics?: Json | null
          artist_id: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          ethos?: string | null
          id?: string
          name: string
          non_negotiables?: string[] | null
          social_links?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          analytics?: Json | null
          artist_id?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          ethos?: string | null
          id?: string
          name?: string
          non_negotiables?: string[] | null
          social_links?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agent_interactions: {
        Row: {
          agent_response: string
          behavior_context: Json | null
          conversion_event_id: string | null
          conversion_resulted: boolean | null
          conversion_value: number | null
          created_at: string | null
          emotional_state: string | null
          engagement_level: string | null
          id: string
          interaction_outcome: string | null
          response_delay_minutes: number | null
          sent_at: string | null
          trigger_type: string
          user_clicked_cta: boolean | null
          user_dismissed: boolean | null
          user_id: string | null
          user_message: string | null
        }
        Insert: {
          agent_response: string
          behavior_context?: Json | null
          conversion_event_id?: string | null
          conversion_resulted?: boolean | null
          conversion_value?: number | null
          created_at?: string | null
          emotional_state?: string | null
          engagement_level?: string | null
          id?: string
          interaction_outcome?: string | null
          response_delay_minutes?: number | null
          sent_at?: string | null
          trigger_type: string
          user_clicked_cta?: boolean | null
          user_dismissed?: boolean | null
          user_id?: string | null
          user_message?: string | null
        }
        Update: {
          agent_response?: string
          behavior_context?: Json | null
          conversion_event_id?: string | null
          conversion_resulted?: boolean | null
          conversion_value?: number | null
          created_at?: string | null
          emotional_state?: string | null
          engagement_level?: string | null
          id?: string
          interaction_outcome?: string | null
          response_delay_minutes?: number | null
          sent_at?: string | null
          trigger_type?: string
          user_clicked_cta?: boolean | null
          user_dismissed?: boolean | null
          user_id?: string | null
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_interactions_conversion_event_id_fkey"
            columns: ["conversion_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_email_insights: {
        Row: {
          actionable_steps: Json | null
          applied_at: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          insight_data: Json | null
          insight_description: string
          insight_title: string
          insight_type: string
          result_metrics: Json | null
        }
        Insert: {
          actionable_steps?: Json | null
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_data?: Json | null
          insight_description: string
          insight_title: string
          insight_type: string
          result_metrics?: Json | null
        }
        Update: {
          actionable_steps?: Json | null
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_data?: Json | null
          insight_description?: string
          insight_title?: string
          insight_type?: string
          result_metrics?: Json | null
        }
        Relationships: []
      }
      api_sync_logs: {
        Row: {
          api_name: string
          completed_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string | null
          status: string
          sync_type: string
        }
        Insert: {
          api_name: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status: string
          sync_type: string
        }
        Update: {
          api_name?: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      artist_partnerships: {
        Row: {
          approved_at: string | null
          artist_id: string
          created_at: string | null
          id: string
          partner_artist_id: string
          partnership_type: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          artist_id: string
          created_at?: string | null
          id?: string
          partner_artist_id: string
          partnership_type?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          artist_id?: string
          created_at?: string | null
          id?: string
          partner_artist_id?: string
          partnership_type?: string | null
          status?: string | null
        }
        Relationships: []
      }
      artist_personality: {
        Row: {
          artist_id: string
          avoid_topics: string[] | null
          created_at: string | null
          emoji_patterns: Json | null
          emotional_triggers: Json | null
          greeting_style: string | null
          id: string
          sentence_style: string | null
          signoff_style: string | null
          tone_style: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          avoid_topics?: string[] | null
          created_at?: string | null
          emoji_patterns?: Json | null
          emotional_triggers?: Json | null
          greeting_style?: string | null
          id?: string
          sentence_style?: string | null
          signoff_style?: string | null
          tone_style?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          avoid_topics?: string[] | null
          created_at?: string | null
          emoji_patterns?: Json | null
          emotional_triggers?: Json | null
          greeting_style?: string | null
          id?: string
          sentence_style?: string | null
          signoff_style?: string | null
          tone_style?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_enrollments: {
        Row: {
          automation_id: string | null
          completed_at: string | null
          current_step_index: number | null
          enrolled_at: string | null
          exit_reason: string | null
          id: string
          metadata: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          automation_id?: string | null
          completed_at?: string | null
          current_step_index?: number | null
          enrolled_at?: string | null
          exit_reason?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          automation_id?: string | null
          completed_at?: string | null
          current_step_index?: number | null
          enrolled_at?: string | null
          exit_reason?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_enrollments_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automation_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      automation_rule_executions: {
        Row: {
          clicked_at: string | null
          conversion_value: number | null
          converted_at: string | null
          executed_at: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          rule_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          rule_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          rule_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          cooldown_hours: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_sends_per_user: number | null
          name: string
          priority: number | null
          trigger_conditions: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json
          action_type: string
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_sends_per_user?: number | null
          name: string
          priority?: number | null
          trigger_conditions?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_sends_per_user?: number | null
          name?: string
          priority?: number | null
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_sequences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          trigger_rules: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps?: Json
          trigger_rules?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          trigger_rules?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_step_executions: {
        Row: {
          created_at: string | null
          enrollment_id: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          result: Json | null
          scheduled_for: string
          status: string | null
          step_index: number
          step_type: string
        }
        Insert: {
          created_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          result?: Json | null
          scheduled_for: string
          status?: string | null
          step_index: number
          step_type: string
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          result?: Json | null
          scheduled_for?: string
          status?: string | null
          step_index?: number
          step_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_step_executions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "automation_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_archetypes: {
        Row: {
          avatar_name: string
          behavioral_patterns: Json | null
          confidence_score: number | null
          conversion_predictions: Json | null
          core_demographic: Json | null
          created_at: string | null
          cultural_symbolic_affinities: Json | null
          description: string | null
          emotional_energy_profile: Json | null
          experiential_aspirational: Json | null
          id: string
          member_count: number | null
          predictive_signals: Json | null
          psychographic_personality: Json | null
          socioeconomic_context: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_name: string
          behavioral_patterns?: Json | null
          confidence_score?: number | null
          conversion_predictions?: Json | null
          core_demographic?: Json | null
          created_at?: string | null
          cultural_symbolic_affinities?: Json | null
          description?: string | null
          emotional_energy_profile?: Json | null
          experiential_aspirational?: Json | null
          id?: string
          member_count?: number | null
          predictive_signals?: Json | null
          psychographic_personality?: Json | null
          socioeconomic_context?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_name?: string
          behavioral_patterns?: Json | null
          confidence_score?: number | null
          conversion_predictions?: Json | null
          core_demographic?: Json | null
          created_at?: string | null
          cultural_symbolic_affinities?: Json | null
          description?: string | null
          emotional_energy_profile?: Json | null
          experiential_aspirational?: Json | null
          id?: string
          member_count?: number | null
          predictive_signals?: Json | null
          psychographic_personality?: Json | null
          socioeconomic_context?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      behavioral_data_snapshots: {
        Row: {
          avg_content_consumed_minutes: number | null
          avg_era_score: number | null
          avg_ptp_score: number | null
          avg_session_duration_sec: number | null
          cart_abandonments: number | null
          cart_additions: number | null
          created_at: string | null
          discover_count: number | null
          engage_count: number | null
          era_calculation_details: Json | null
          high_ptp_count: number | null
          id: string
          invest_count: number | null
          journey_transitions: Json | null
          loyal_count: number | null
          ptp_calculation_details: Json | null
          purchases: number | null
          snapshot_date: string
          top_discussed_topics: Json | null
          top_search_terms: Json | null
          total_comments: number | null
          total_messages: number | null
          total_searches: number | null
          total_shares: number | null
          updated_at: string | null
        }
        Insert: {
          avg_content_consumed_minutes?: number | null
          avg_era_score?: number | null
          avg_ptp_score?: number | null
          avg_session_duration_sec?: number | null
          cart_abandonments?: number | null
          cart_additions?: number | null
          created_at?: string | null
          discover_count?: number | null
          engage_count?: number | null
          era_calculation_details?: Json | null
          high_ptp_count?: number | null
          id?: string
          invest_count?: number | null
          journey_transitions?: Json | null
          loyal_count?: number | null
          ptp_calculation_details?: Json | null
          purchases?: number | null
          snapshot_date?: string
          top_discussed_topics?: Json | null
          top_search_terms?: Json | null
          total_comments?: number | null
          total_messages?: number | null
          total_searches?: number | null
          total_shares?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_content_consumed_minutes?: number | null
          avg_era_score?: number | null
          avg_ptp_score?: number | null
          avg_session_duration_sec?: number | null
          cart_abandonments?: number | null
          cart_additions?: number | null
          created_at?: string | null
          discover_count?: number | null
          engage_count?: number | null
          era_calculation_details?: Json | null
          high_ptp_count?: number | null
          id?: string
          invest_count?: number | null
          journey_transitions?: Json | null
          loyal_count?: number | null
          ptp_calculation_details?: Json | null
          purchases?: number | null
          snapshot_date?: string
          top_discussed_topics?: Json | null
          top_search_terms?: Json | null
          total_comments?: number | null
          total_messages?: number | null
          total_searches?: number | null
          total_shares?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brand_partnerships: {
        Row: {
          artist_id: string
          brand_name: string
          content: Json | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          status: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          artist_id: string
          brand_name: string
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          status?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          artist_id?: string
          brand_name?: string
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          status?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cameo_notifications: {
        Row: {
          cameo_id: string | null
          created_at: string | null
          email_enabled: boolean | null
          id: string
          notification_type: string | null
          read_at: string | null
          recipient_user_id: string | null
          sent_at: string | null
        }
        Insert: {
          cameo_id?: string | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_type?: string | null
          read_at?: string | null
          recipient_user_id?: string | null
          sent_at?: string | null
        }
        Update: {
          cameo_id?: string | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notification_type?: string | null
          read_at?: string | null
          recipient_user_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cameo_notifications_cameo_id_fkey"
            columns: ["cameo_id"]
            isOneToOne: false
            referencedRelation: "cameos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cameo_notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cameo_requests: {
        Row: {
          completed_cameo_id: string | null
          created_at: string | null
          fulfillment_status: string
          id: string
          occasion_type: string
          payment_status: string
          price_paid: number
          recipient_name: string
          requested_delivery_date: string | null
          requester_email: string
          requester_user_id: string | null
          special_instructions: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_cameo_id?: string | null
          created_at?: string | null
          fulfillment_status?: string
          id?: string
          occasion_type: string
          payment_status?: string
          price_paid?: number
          recipient_name: string
          requested_delivery_date?: string | null
          requester_email: string
          requester_user_id?: string | null
          special_instructions?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_cameo_id?: string | null
          created_at?: string | null
          fulfillment_status?: string
          id?: string
          occasion_type?: string
          payment_status?: string
          price_paid?: number
          recipient_name?: string
          requested_delivery_date?: string | null
          requester_email?: string
          requester_user_id?: string | null
          special_instructions?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cameo_requests_completed_cameo_id_fkey"
            columns: ["completed_cameo_id"]
            isOneToOne: false
            referencedRelation: "cameos"
            referencedColumns: ["id"]
          },
        ]
      }
      cameos: {
        Row: {
          created_at: string | null
          display_duration: string
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          merchant_id: string
          message_text: string | null
          message_type: string
          recipient_manual_name: string | null
          recipient_user_id: string | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
          video_thumbnail_url: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          display_duration: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          merchant_id: string
          message_text?: string | null
          message_type: string
          recipient_manual_name?: string | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          display_duration?: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          merchant_id?: string
          message_text?: string | null
          message_type?: string
          recipient_manual_name?: string | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cameos_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      campaign_message_log: {
        Row: {
          campaign_id: string
          channel: string
          created_at: string | null
          error_message: string | null
          id: string
          message_content: Json
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          channel: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_content: Json
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: Json
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_message_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_performance: {
        Row: {
          campaign_id: string | null
          conversion_rate: number | null
          id: string
          location_breakdown: Json | null
          revenue_generated: number | null
          total_clicked: number | null
          total_converted: number | null
          total_opened: number | null
          total_sent: number | null
          total_targeted: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          conversion_rate?: number | null
          id?: string
          location_breakdown?: Json | null
          revenue_generated?: number | null
          total_clicked?: number | null
          total_converted?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_targeted?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          conversion_rate?: number | null
          id?: string
          location_breakdown?: Json | null
          revenue_generated?: number | null
          total_clicked?: number | null
          total_converted?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_targeted?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_performance_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "smart_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_targets: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          converted_at: string | null
          created_at: string | null
          engagement_score: number | null
          id: string
          opened_at: string | null
          predicted_conversion_probability: number | null
          sent_at: string | null
          targeting_reasons: Json
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          opened_at?: string | null
          predicted_conversion_probability?: number | null
          sent_at?: string | null
          targeting_reasons: Json
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          opened_at?: string | null
          predicted_conversion_probability?: number | null
          sent_at?: string | null
          targeting_reasons?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "smart_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_targets_v2: {
        Row: {
          campaign_id: string
          converted_at: string | null
          created_at: string | null
          id: string
          message_clicked_at: string | null
          message_opened_at: string | null
          message_sent_at: string | null
          personalization_data: Json | null
          ptp_score: number
          ptp_status: string
          revenue_generated: number | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          converted_at?: string | null
          created_at?: string | null
          id?: string
          message_clicked_at?: string | null
          message_opened_at?: string | null
          message_sent_at?: string | null
          personalization_data?: Json | null
          ptp_score: number
          ptp_status: string
          revenue_generated?: number | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          converted_at?: string | null
          created_at?: string | null
          id?: string
          message_clicked_at?: string | null
          message_opened_at?: string | null
          message_sent_at?: string | null
          personalization_data?: Json | null
          ptp_score?: number
          ptp_status?: string
          revenue_generated?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_targets_v2_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_sessions: {
        Row: {
          cart_items: Json
          cart_value: number | null
          created_at: string | null
          id: string
          last_updated: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          cart_items: Json
          cart_value?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          cart_items?: Json
          cart_value?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      catalyst_campaigns: {
        Row: {
          campaign_type: string
          created_at: string | null
          id: string
          max_sends_per_user: number | null
          message_template: string
          offer_type: string | null
          offer_value: Json | null
          priority: number | null
          status: string | null
          target_segment: string
          trigger_conditions: Json
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          created_at?: string | null
          id?: string
          max_sends_per_user?: number | null
          message_template: string
          offer_type?: string | null
          offer_value?: Json | null
          priority?: number | null
          status?: string | null
          target_segment: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          id?: string
          max_sends_per_user?: number | null
          message_template?: string
          offer_type?: string | null
          offer_value?: Json | null
          priority?: number | null
          status?: string | null
          target_segment?: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      catalyst_executions: {
        Row: {
          campaign_id: string | null
          channel: string
          clicked_at: string | null
          conversion_value: number | null
          converted_at: string | null
          created_at: string | null
          era_score: number | null
          id: string
          message_sent: string | null
          metadata: Json | null
          opened_at: string | null
          ptp_score: number | null
          scheduled_for: string | null
          segment: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          clicked_at?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          era_score?: number | null
          id?: string
          message_sent?: string | null
          metadata?: Json | null
          opened_at?: string | null
          ptp_score?: number | null
          scheduled_for?: string | null
          segment?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          era_score?: number | null
          id?: string
          message_sent?: string | null
          metadata?: Json | null
          opened_at?: string | null
          ptp_score?: number | null
          scheduled_for?: string | null
          segment?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalyst_executions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "catalyst_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      catalyst_performance: {
        Row: {
          avg_conversion_value: number | null
          campaign_id: string | null
          click_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          id: string
          open_rate: number | null
          total_clicked: number | null
          total_converted: number | null
          total_opened: number | null
          total_revenue: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          avg_conversion_value?: number | null
          campaign_id?: string | null
          click_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          open_rate?: number | null
          total_clicked?: number | null
          total_converted?: number | null
          total_opened?: number | null
          total_revenue?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_conversion_value?: number | null
          campaign_id?: string | null
          click_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          open_rate?: number | null
          total_clicked?: number | null
          total_converted?: number | null
          total_opened?: number | null
          total_revenue?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalyst_performance_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "catalyst_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_templates: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          interval_minutes: number | null
          link_text: string | null
          link_url: string | null
          message: string
          slot_number: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interval_minutes?: number | null
          link_text?: string | null
          link_url?: string | null
          message: string
          slot_number?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interval_minutes?: number | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          slot_number?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cohort_members: {
        Row: {
          cohort_id: string
          id: string
          joined_at: string | null
          member_id: string
        }
        Insert: {
          cohort_id: string
          id?: string
          joined_at?: string | null
          member_id: string
        }
        Update: {
          cohort_id?: string
          id?: string
          joined_at?: string | null
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string | null
          created_by: string | null
          definition: Json
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          definition: Json
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          definition?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      community_analytics: {
        Row: {
          active_members_30d: number
          active_members_7d: number
          avg_ltv: number
          computed_at: string
          countries_count: number
          id: string
          new_members_today: number
          tier_free: number
          tier_legionnaire: number
          tier_outlaw: number
          tier_rebel: number
          top_country: string | null
          top_region: string | null
          total_members: number
          total_mrr: number
          updated_at: string
        }
        Insert: {
          active_members_30d?: number
          active_members_7d?: number
          avg_ltv?: number
          computed_at?: string
          countries_count?: number
          id?: string
          new_members_today?: number
          tier_free?: number
          tier_legionnaire?: number
          tier_outlaw?: number
          tier_rebel?: number
          top_country?: string | null
          top_region?: string | null
          total_members?: number
          total_mrr?: number
          updated_at?: string
        }
        Update: {
          active_members_30d?: number
          active_members_7d?: number
          avg_ltv?: number
          computed_at?: string
          countries_count?: number
          id?: string
          new_members_today?: number
          tier_free?: number
          tier_legionnaire?: number
          tier_outlaw?: number
          tier_rebel?: number
          top_country?: string | null
          top_region?: string | null
          total_members?: number
          total_mrr?: number
          updated_at?: string
        }
        Relationships: []
      }
      community_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          link_url: string | null
          media_url: string | null
          post_type: string | null
          tagged_all: boolean | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          post_type?: string | null
          tagged_all?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          post_type?: string | null
          tagged_all?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      content_analyses: {
        Row: {
          created_at: string | null
          frame_analysis: Json | null
          hook_score: number | null
          id: string
          merchant_id: string
          overall_score: number | null
          pacing_score: number | null
          predicted_dropoff_points: Json | null
          recommendations: Json | null
          video_duration: number | null
          video_title: string
          video_url: string
          visual_score: number | null
        }
        Insert: {
          created_at?: string | null
          frame_analysis?: Json | null
          hook_score?: number | null
          id?: string
          merchant_id: string
          overall_score?: number | null
          pacing_score?: number | null
          predicted_dropoff_points?: Json | null
          recommendations?: Json | null
          video_duration?: number | null
          video_title: string
          video_url: string
          visual_score?: number | null
        }
        Update: {
          created_at?: string | null
          frame_analysis?: Json | null
          hook_score?: number | null
          id?: string
          merchant_id?: string
          overall_score?: number | null
          pacing_score?: number | null
          predicted_dropoff_points?: Json | null
          recommendations?: Json | null
          video_duration?: number | null
          video_title?: string
          video_url?: string
          visual_score?: number | null
        }
        Relationships: []
      }
      distributor_integrations: {
        Row: {
          api_credentials: Json | null
          created_at: string | null
          distributor_name: string
          id: string
          last_sync: string | null
          merchant_id: string
          updated_at: string | null
        }
        Insert: {
          api_credentials?: Json | null
          created_at?: string | null
          distributor_name: string
          id?: string
          last_sync?: string | null
          merchant_id: string
          updated_at?: string | null
        }
        Update: {
          api_credentials?: Json | null
          created_at?: string | null
          distributor_name?: string
          id?: string
          last_sync?: string | null
          merchant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_assets: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          height: number | null
          id: string
          updated_at: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          height?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          height?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      email_campaign_engagement_tracking: {
        Row: {
          action_metadata: Json | null
          action_type: string
          campaign_id: string | null
          channel: string | null
          id: string
          tracked_at: string | null
          user_id: string | null
        }
        Insert: {
          action_metadata?: Json | null
          action_type: string
          campaign_id?: string | null
          channel?: string | null
          id?: string
          tracked_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_metadata?: Json | null
          action_type?: string
          campaign_id?: string | null
          channel?: string | null
          id?: string
          tracked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_engagement_tracking_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_sequences: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email_body: string
          id: string
          scheduled_for: string | null
          sent_at: string | null
          sequence_number: number
          status: string | null
          subject_line: string
          target_segment: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email_body: string
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_number: number
          status?: string | null
          subject_line: string
          target_segment: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email_body?: string
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_number?: number
          status?: string | null
          subject_line?: string
          target_segment?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_suppressions: {
        Row: {
          campaign_id: string | null
          id: string
          reason: string
          suppressed_at: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          reason: string
          suppressed_at?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          reason?: string
          suppressed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_suppressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          ai_generated: boolean | null
          analytics: Json | null
          campaign_duration_days: number | null
          campaign_goal: string | null
          campaign_type: string | null
          channel_type: string | null
          conversion_goal_type: string | null
          conversion_tracked: boolean | null
          created_at: string | null
          created_by: string | null
          email_body: string
          ethos_score: number | null
          id: string
          list_id: string | null
          love_first_validation: boolean | null
          manipulation_flags: number | null
          max_sends_per_user: number | null
          name: string
          objective: string | null
          preview_text: string | null
          scheduled_for: string | null
          send_immediately: boolean | null
          sent_at: string | null
          sms_body: string | null
          sms_enabled: boolean | null
          status: string | null
          subject: string
          target_segment: Json | null
          test_duration: number | null
          tone: string | null
          updated_at: string | null
          winner_criteria: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          analytics?: Json | null
          campaign_duration_days?: number | null
          campaign_goal?: string | null
          campaign_type?: string | null
          channel_type?: string | null
          conversion_goal_type?: string | null
          conversion_tracked?: boolean | null
          created_at?: string | null
          created_by?: string | null
          email_body: string
          ethos_score?: number | null
          id?: string
          list_id?: string | null
          love_first_validation?: boolean | null
          manipulation_flags?: number | null
          max_sends_per_user?: number | null
          name: string
          objective?: string | null
          preview_text?: string | null
          scheduled_for?: string | null
          send_immediately?: boolean | null
          sent_at?: string | null
          sms_body?: string | null
          sms_enabled?: boolean | null
          status?: string | null
          subject: string
          target_segment?: Json | null
          test_duration?: number | null
          tone?: string | null
          updated_at?: string | null
          winner_criteria?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          analytics?: Json | null
          campaign_duration_days?: number | null
          campaign_goal?: string | null
          campaign_type?: string | null
          channel_type?: string | null
          conversion_goal_type?: string | null
          conversion_tracked?: boolean | null
          created_at?: string | null
          created_by?: string | null
          email_body?: string
          ethos_score?: number | null
          id?: string
          list_id?: string | null
          love_first_validation?: boolean | null
          manipulation_flags?: number | null
          max_sends_per_user?: number | null
          name?: string
          objective?: string | null
          preview_text?: string | null
          scheduled_for?: string | null
          send_immediately?: boolean | null
          sent_at?: string | null
          sms_body?: string | null
          sms_enabled?: boolean | null
          status?: string | null
          subject?: string
          target_segment?: Json | null
          test_duration?: number | null
          tone?: string | null
          updated_at?: string | null
          winner_criteria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_lists: {
        Row: {
          created_at: string | null
          description: string | null
          filter_rules: Json
          id: string
          member_count: number | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          filter_rules?: Json
          id?: string
          member_count?: number | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          filter_rules?: Json
          id?: string
          member_count?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_recommendations: {
        Row: {
          behavioral_triggers: Json | null
          confidence_score: number | null
          created_at: string | null
          description: string
          era_label: string | null
          expires_at: string | null
          id: string
          ptp_score: number | null
          recommendation_type: string
          status: string | null
          suggested_action: Json
          title: string
          user_id: string | null
        }
        Insert: {
          behavioral_triggers?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description: string
          era_label?: string | null
          expires_at?: string | null
          id?: string
          ptp_score?: number | null
          recommendation_type: string
          status?: string | null
          suggested_action?: Json
          title: string
          user_id?: string | null
        }
        Update: {
          behavioral_triggers?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          era_label?: string | null
          expires_at?: string | null
          id?: string
          ptp_score?: number | null
          recommendation_type?: string
          status?: string | null
          suggested_action?: Json
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          bounce_reason: string | null
          bounced: boolean | null
          campaign_id: string | null
          clicked_at: string | null
          email_address: string
          id: string
          metadata: Json | null
          opened_at: string | null
          purchased_at: string | null
          send_sequence_number: number | null
          sent_at: string | null
          spam_reported_at: string | null
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced?: boolean | null
          campaign_id?: string | null
          clicked_at?: string | null
          email_address: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          purchased_at?: string | null
          send_sequence_number?: number | null
          sent_at?: string | null
          spam_reported_at?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced?: boolean | null
          campaign_id?: string | null
          clicked_at?: string | null
          email_address?: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          purchased_at?: string | null
          send_sequence_number?: number | null
          sent_at?: string | null
          spam_reported_at?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_custom: boolean | null
          name: string
          subject: string
          template_code: string
          thumbnail_url: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          subject: string
          template_code: string
          thumbnail_url?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          subject?: string
          template_code?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      era_ptp_scores_daily: {
        Row: {
          created_at: string | null
          date: string
          era: number | null
          era_components: Json | null
          flags: Json | null
          id: string
          member_id: string
          ptp: number | null
          ptp_components: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          era?: number | null
          era_components?: Json | null
          flags?: Json | null
          id?: string
          member_id: string
          ptp?: number | null
          ptp_components?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          era?: number | null
          era_components?: Json | null
          flags?: Json | null
          id?: string
          member_id?: string
          ptp?: number | null
          ptp_components?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ethos_performance_tracking: {
        Row: {
          campaign_id: string | null
          click_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          empowerment_language: boolean | null
          ethos_score: number
          id: string
          love_first: boolean | null
          open_rate: number | null
          truth_based: boolean | null
        }
        Insert: {
          campaign_id?: string | null
          click_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          empowerment_language?: boolean | null
          ethos_score: number
          id?: string
          love_first?: boolean | null
          open_rate?: number | null
          truth_based?: boolean | null
        }
        Update: {
          campaign_id?: string | null
          click_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          empowerment_language?: boolean | null
          ethos_score?: number
          id?: string
          love_first?: boolean | null
          open_rate?: number | null
          truth_based?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ethos_performance_tracking_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ethos_requests: {
        Row: {
          created_at: string
          ethos: string
          from_artist_id: string
          id: string
          non_negotiables: string[] | null
          responded_at: string | null
          status: string | null
          to_artist_id: string
        }
        Insert: {
          created_at?: string
          ethos: string
          from_artist_id: string
          id?: string
          non_negotiables?: string[] | null
          responded_at?: string | null
          status?: string | null
          to_artist_id: string
        }
        Update: {
          created_at?: string
          ethos?: string
          from_artist_id?: string
          id?: string
          non_negotiables?: string[] | null
          responded_at?: string | null
          status?: string | null
          to_artist_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          click_latency_ms: number | null
          content_id: string | null
          created_at: string | null
          duration_sec: number | null
          id: string
          member_id: string | null
          meta: Json | null
          sentiment: number | null
          ts: string
          type: Database["public"]["Enums"]["event_type"]
          value: number | null
        }
        Insert: {
          click_latency_ms?: number | null
          content_id?: string | null
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          member_id?: string | null
          meta?: Json | null
          sentiment?: number | null
          ts?: string
          type: Database["public"]["Enums"]["event_type"]
          value?: number | null
        }
        Update: {
          click_latency_ms?: number | null
          content_id?: string | null
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          member_id?: string | null
          meta?: Json | null
          sentiment?: number | null
          ts?: string
          type?: Database["public"]["Enums"]["event_type"]
          value?: number | null
        }
        Relationships: []
      }
      events_archive: {
        Row: {
          archived_at: string | null
          click_latency_ms: number | null
          content_id: string | null
          created_at: string | null
          duration_sec: number | null
          id: string
          member_id: string | null
          meta: Json | null
          sentiment: number | null
          ts: string
          type: Database["public"]["Enums"]["event_type"]
          value: number | null
        }
        Insert: {
          archived_at?: string | null
          click_latency_ms?: number | null
          content_id?: string | null
          created_at?: string | null
          duration_sec?: number | null
          id: string
          member_id?: string | null
          meta?: Json | null
          sentiment?: number | null
          ts: string
          type: Database["public"]["Enums"]["event_type"]
          value?: number | null
        }
        Update: {
          archived_at?: string | null
          click_latency_ms?: number | null
          content_id?: string | null
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          member_id?: string | null
          meta?: Json | null
          sentiment?: number | null
          ts?: string
          type?: Database["public"]["Enums"]["event_type"]
          value?: number | null
        }
        Relationships: []
      }
      fan_affiliates: {
        Row: {
          affiliate_code: string
          created_at: string
          digital_purchases: number
          discount_codes_earned: number
          id: string
          merch_purchases: number
          portal_signups: number
          shopify_discount_code: string | null
          shopify_price_rule_id: string | null
          status: string
          total_clicks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          created_at?: string
          digital_purchases?: number
          discount_codes_earned?: number
          id?: string
          merch_purchases?: number
          portal_signups?: number
          shopify_discount_code?: string | null
          shopify_price_rule_id?: string | null
          status?: string
          total_clicks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          created_at?: string
          digital_purchases?: number
          discount_codes_earned?: number
          id?: string
          merch_purchases?: number
          portal_signups?: number
          shopify_discount_code?: string | null
          shopify_price_rule_id?: string | null
          status?: string
          total_clicks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fan_journey_milestones: {
        Row: {
          achieved_at: string
          created_at: string
          id: string
          metadata: Json | null
          milestone_key: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_key: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_key?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          flag_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          flag_name: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          flag_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      funnel_conversions: {
        Row: {
          amount: number | null
          conversion_type: string
          id: string
          meta: Json | null
          occurred_at: string | null
          product_id: string | null
          session_id: string | null
          step_number: number
          user_id: string | null
          variant_name: string
        }
        Insert: {
          amount?: number | null
          conversion_type: string
          id?: string
          meta?: Json | null
          occurred_at?: string | null
          product_id?: string | null
          session_id?: string | null
          step_number: number
          user_id?: string | null
          variant_name: string
        }
        Update: {
          amount?: number | null
          conversion_type?: string
          id?: string
          meta?: Json | null
          occurred_at?: string | null
          product_id?: string | null
          session_id?: string | null
          step_number?: number
          user_id?: string | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_conversions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "funnel_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_conversions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      funnel_pages: {
        Row: {
          background_image_url: string | null
          body_copy: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          headline: string | null
          id: string
          is_active: boolean | null
          meta: Json | null
          page_type: string
          price: number | null
          product_id: string | null
          step_number: number
          subheadline: string | null
          updated_at: string | null
          variant_name: string
        }
        Insert: {
          background_image_url?: string | null
          body_copy?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          meta?: Json | null
          page_type: string
          price?: number | null
          product_id?: string | null
          step_number: number
          subheadline?: string | null
          updated_at?: string | null
          variant_name: string
        }
        Update: {
          background_image_url?: string | null
          body_copy?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          meta?: Json | null
          page_type?: string
          price?: number | null
          product_id?: string | null
          step_number?: number
          subheadline?: string | null
          updated_at?: string | null
          variant_name?: string
        }
        Relationships: []
      }
      funnel_sessions: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          completed_steps: number[] | null
          conversion_step: number | null
          current_step: number | null
          entry_step: number | null
          id: string
          meta: Json | null
          session_id: string
          started_at: string | null
          total_revenue: number | null
          user_id: string | null
          variant_assignments: Json | null
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          completed_steps?: number[] | null
          conversion_step?: number | null
          current_step?: number | null
          entry_step?: number | null
          id?: string
          meta?: Json | null
          session_id: string
          started_at?: string | null
          total_revenue?: number | null
          user_id?: string | null
          variant_assignments?: Json | null
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          completed_steps?: number[] | null
          conversion_step?: number | null
          current_step?: number | null
          entry_step?: number | null
          id?: string
          meta?: Json | null
          session_id?: string
          started_at?: string | null
          total_revenue?: number | null
          user_id?: string | null
          variant_assignments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          created_at: string | null
          from_name: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          replied: boolean | null
          replied_at: string | null
          sequence_execution_id: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          replied?: boolean | null
          replied_at?: string | null
          sequence_execution_id?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          replied?: boolean | null
          replied_at?: string | null
          sequence_execution_id?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_sequence_execution_id_fkey"
            columns: ["sequence_execution_id"]
            isOneToOne: false
            referencedRelation: "sequence_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      jrny_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          jrny_id: string
          page_url: string | null
          session_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          jrny_id: string
          page_url?: string | null
          session_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          jrny_id?: string
          page_url?: string | null
          session_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jrny_events_jrny_id_fkey"
            columns: ["jrny_id"]
            isOneToOne: false
            referencedRelation: "jrny_visitors"
            referencedColumns: ["jrny_id"]
          },
          {
            foreignKeyName: "jrny_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      jrny_fingerprint_map: {
        Row: {
          confidence: number | null
          created_at: string | null
          fingerprint_hash: string
          id: string
          jrny_id: string
          last_matched_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          fingerprint_hash: string
          id?: string
          jrny_id: string
          last_matched_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          fingerprint_hash?: string
          id?: string
          jrny_id?: string
          last_matched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jrny_fingerprint_map_jrny_id_fkey"
            columns: ["jrny_id"]
            isOneToOne: false
            referencedRelation: "jrny_visitors"
            referencedColumns: ["jrny_id"]
          },
        ]
      }
      jrny_portal_visits: {
        Row: {
          add_to_cart: boolean | null
          created_at: string | null
          ended_at: string | null
          id: string
          jrny_id: string
          landing_page: string | null
          merch_views: number | null
          music_plays: number | null
          page_views: number | null
          pages_viewed: string[] | null
          purchase_made: boolean | null
          referrer_url: string | null
          scroll_depth_max: number | null
          session_id: string
          started_at: string | null
          tenant_id: string | null
          time_on_site_seconds: number | null
          video_watches: number | null
        }
        Insert: {
          add_to_cart?: boolean | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          jrny_id: string
          landing_page?: string | null
          merch_views?: number | null
          music_plays?: number | null
          page_views?: number | null
          pages_viewed?: string[] | null
          purchase_made?: boolean | null
          referrer_url?: string | null
          scroll_depth_max?: number | null
          session_id: string
          started_at?: string | null
          tenant_id?: string | null
          time_on_site_seconds?: number | null
          video_watches?: number | null
        }
        Update: {
          add_to_cart?: boolean | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          jrny_id?: string
          landing_page?: string | null
          merch_views?: number | null
          music_plays?: number | null
          page_views?: number | null
          pages_viewed?: string[] | null
          purchase_made?: boolean | null
          referrer_url?: string | null
          scroll_depth_max?: number | null
          session_id?: string
          started_at?: string | null
          tenant_id?: string | null
          time_on_site_seconds?: number | null
          video_watches?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jrny_portal_visits_jrny_id_fkey"
            columns: ["jrny_id"]
            isOneToOne: false
            referencedRelation: "jrny_visitors"
            referencedColumns: ["jrny_id"]
          },
          {
            foreignKeyName: "jrny_portal_visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      jrny_visitors: {
        Row: {
          browser: string | null
          converted_user_id: string | null
          created_at: string | null
          device_fingerprint: string | null
          device_type: string | null
          email: string | null
          engagement_score: number | null
          first_landing_page: string | null
          first_referrer: string | null
          first_seen_at: string | null
          first_tenant_id: string | null
          heat_level: string | null
          id: string
          identity_revealed_at: string | null
          jrny_id: string
          language: string | null
          last_seen_at: string | null
          os: string | null
          portals_visited: string[] | null
          screen_resolution: string | null
          timezone: string | null
          total_page_views: number | null
          total_sessions: number | null
          total_time_seconds: number | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          converted_user_id?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          email?: string | null
          engagement_score?: number | null
          first_landing_page?: string | null
          first_referrer?: string | null
          first_seen_at?: string | null
          first_tenant_id?: string | null
          heat_level?: string | null
          id?: string
          identity_revealed_at?: string | null
          jrny_id: string
          language?: string | null
          last_seen_at?: string | null
          os?: string | null
          portals_visited?: string[] | null
          screen_resolution?: string | null
          timezone?: string | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          converted_user_id?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          email?: string | null
          engagement_score?: number | null
          first_landing_page?: string | null
          first_referrer?: string | null
          first_seen_at?: string | null
          first_tenant_id?: string | null
          heat_level?: string | null
          id?: string
          identity_revealed_at?: string | null
          jrny_id?: string
          language?: string | null
          last_seen_at?: string | null
          os?: string | null
          portals_visited?: string[] | null
          screen_resolution?: string | null
          timezone?: string | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jrny_visitors_first_tenant_id_fkey"
            columns: ["first_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string | null
          document_type: string | null
          effective_date: string | null
          id: string
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_type?: string | null
          effective_date?: string | null
          id?: string
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_type?: string | null
          effective_date?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      livestream_chat: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_bot: boolean | null
          is_deleted: boolean | null
          is_pinned: boolean | null
          message: string
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_bot?: boolean | null
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          message: string
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_bot?: boolean | null
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          message?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestream_chat_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "livestream_events"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_events: {
        Row: {
          access_type: string | null
          actual_end: string | null
          actual_start: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          recording_url: string | null
          scheduled_end: string | null
          scheduled_start: string
          status: string | null
          stream_key: string | null
          stream_start_time: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          access_type?: string | null
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          recording_url?: string | null
          scheduled_end?: string | null
          scheduled_start: string
          status?: string | null
          stream_key?: string | null
          stream_start_time?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          access_type?: string | null
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          recording_url?: string | null
          scheduled_end?: string | null
          scheduled_start?: string
          status?: string | null
          stream_key?: string | null
          stream_start_time?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: []
      }
      livestream_highlights: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          end_time_seconds: number
          event_id: string
          id: string
          start_time_seconds: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          end_time_seconds: number
          event_id: string
          id?: string
          start_time_seconds: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          end_time_seconds?: number
          event_id?: string
          id?: string
          start_time_seconds?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "livestream_highlights_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "livestream_events"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_reactions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reaction_type: string
          session_id: string | null
          timestamp_seconds: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reaction_type: string
          session_id?: string | null
          timestamp_seconds: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reaction_type?: string
          session_id?: string | null
          timestamp_seconds?: number
          user_id?: string | null
        }
        Relationships: []
      }
      livestream_signals: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          peer_id: string
          peer_type: string
          signal_data: Json
          signal_type: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          peer_id: string
          peer_type: string
          signal_data: Json
          signal_type: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          peer_id?: string
          peer_type?: string
          signal_data?: Json
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestream_signals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "livestream_events"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_tips: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          event_id: string | null
          id: string
          message: string | null
          payment_intent_id: string | null
          tipper_name: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          payment_intent_id?: string | null
          tipper_name?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          payment_intent_id?: string | null
          tipper_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livestream_tips_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "livestream_events"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_viewers: {
        Row: {
          avatar_url: string | null
          event_id: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          participant_id: string
          participant_name: string
          session_id: string | null
          total_watch_time: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          event_id?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          participant_id?: string
          participant_name?: string
          session_id?: string | null
          total_watch_time?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          event_id?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          participant_id?: string
          participant_name?: string
          session_id?: string | null
          total_watch_time?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livestream_viewers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "livestream_events"
            referencedColumns: ["id"]
          },
        ]
      }
      livestream_vods: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          event_id: string
          file_size_bytes: number | null
          id: string
          processing_status: string
          stream_ended_at: string | null
          stream_started_at: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          event_id: string
          file_size_bytes?: number | null
          id?: string
          processing_status?: string
          stream_ended_at?: string | null
          stream_started_at: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          event_id?: string
          file_size_bytes?: number | null
          id?: string
          processing_status?: string
          stream_ended_at?: string | null
          stream_started_at?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "livestream_vods_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "livestream_events"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget_tier: string
          created_at: string | null
          enabled_channels: Json
          end_date: string
          goal: string
          id: string
          merchant_id: string
          performance_metrics: Json | null
          start_date: string
          start_time: string
          status: string
          target_criteria: Json
          updated_at: string | null
        }
        Insert: {
          budget_tier?: string
          created_at?: string | null
          enabled_channels?: Json
          end_date: string
          goal: string
          id?: string
          merchant_id: string
          performance_metrics?: Json | null
          start_date: string
          start_time: string
          status?: string
          target_criteria?: Json
          updated_at?: string | null
        }
        Update: {
          budget_tier?: string
          created_at?: string | null
          enabled_channels?: Json
          end_date?: string
          goal?: string
          id?: string
          merchant_id?: string
          performance_metrics?: Json | null
          start_date?: string
          start_time?: string
          status?: string
          target_criteria?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_goals: {
        Row: {
          created_at: string | null
          desired_conversion: string
          goal_name: string
          goal_type: string
          id: string
          merchant_id: string
          status: string | null
          target_audience_filter: Json | null
          total_converted: number | null
          total_enrolled: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          desired_conversion: string
          goal_name: string
          goal_type: string
          id?: string
          merchant_id: string
          status?: string | null
          target_audience_filter?: Json | null
          total_converted?: number | null
          total_enrolled?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          desired_conversion?: string
          goal_name?: string
          goal_type?: string
          id?: string
          merchant_id?: string
          status?: string | null
          target_audience_filter?: Json | null
          total_converted?: number | null
          total_enrolled?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_interactions: {
        Row: {
          campaign_id: string | null
          channel_type: string
          created_at: string | null
          goal_id: string | null
          id: string
          interaction_timestamp: string
          interaction_type: string
          metadata: Json | null
          sequence_id: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel_type: string
          created_at?: string | null
          goal_id?: string | null
          id?: string
          interaction_timestamp?: string
          interaction_type: string
          metadata?: Json | null
          sequence_id?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel_type?: string
          created_at?: string | null
          goal_id?: string | null
          id?: string
          interaction_timestamp?: string
          interaction_type?: string
          metadata?: Json | null
          sequence_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      match_matrix_scores: {
        Row: {
          behavioral_score: number | null
          epiphany_score: number | null
          id: string
          last_updated: string | null
          oracle_score: number | null
          recommended_actions: Json | null
          segment: string | null
          total_match_score: number | null
          user_id: string | null
        }
        Insert: {
          behavioral_score?: number | null
          epiphany_score?: number | null
          id?: string
          last_updated?: string | null
          oracle_score?: number | null
          recommended_actions?: Json | null
          segment?: string | null
          total_match_score?: number | null
          user_id?: string | null
        }
        Update: {
          behavioral_score?: number | null
          epiphany_score?: number | null
          id?: string
          last_updated?: string | null
          oracle_score?: number | null
          recommended_actions?: Json | null
          segment?: string | null
          total_match_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      merchant_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
        }
        Relationships: []
      }
      messenger_interactions: {
        Row: {
          conversation_id: string | null
          id: string
          link_url: string | null
          message_type: string | null
          occurred_at: string | null
          synced_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          link_url?: string | null
          message_type?: string | null
          occurred_at?: string | null
          synced_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          link_url?: string | null
          message_type?: string | null
          occurred_at?: string | null
          synced_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      meta_pixel_insights: {
        Row: {
          clicks: number | null
          conversions: number | null
          created_at: string | null
          ctr: number | null
          date: string
          event_counts: Json
          fetched_at: string | null
          id: string
          impressions: number | null
          pixel_id: string
          revenue: number | null
          unique_users: number | null
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          event_counts?: Json
          fetched_at?: string | null
          id?: string
          impressions?: number | null
          pixel_id: string
          revenue?: number | null
          unique_users?: number | null
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          event_counts?: Json
          fetched_at?: string | null
          id?: string
          impressions?: number | null
          pixel_id?: string
          revenue?: number | null
          unique_users?: number | null
        }
        Relationships: []
      }
      milestone_progress: {
        Row: {
          current_badge: string | null
          last_updated: string | null
          next_milestone_minutes: number | null
          total_minutes: number | null
          user_id: string
        }
        Insert: {
          current_badge?: string | null
          last_updated?: string | null
          next_milestone_minutes?: number | null
          total_minutes?: number | null
          user_id: string
        }
        Update: {
          current_badge?: string | null
          last_updated?: string | null
          next_milestone_minutes?: number | null
          total_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      music_streaming_data: {
        Row: {
          artist_name: string | null
          id: string
          last_played_at: string | null
          platform: string
          play_count: number | null
          repeat_count: number | null
          skip_count: number | null
          synced_at: string | null
          total_play_time_seconds: number | null
          track_id: string | null
          track_name: string | null
          user_id: string | null
        }
        Insert: {
          artist_name?: string | null
          id?: string
          last_played_at?: string | null
          platform: string
          play_count?: number | null
          repeat_count?: number | null
          skip_count?: number | null
          synced_at?: string | null
          total_play_time_seconds?: number | null
          track_id?: string | null
          track_name?: string | null
          user_id?: string | null
        }
        Update: {
          artist_name?: string | null
          id?: string
          last_played_at?: string | null
          platform?: string
          play_count?: number | null
          repeat_count?: number | null
          skip_count?: number | null
          synced_at?: string | null
          total_play_time_seconds?: number | null
          track_id?: string | null
          track_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      music_tracks: {
        Row: {
          album: string | null
          artist: string | null
          category: string
          created_at: string | null
          display_order: number | null
          duration: string | null
          id: string
          image_url: string | null
          lyrics: string | null
          public_url: string
          storage_path: string
          title: string
          track_number: number | null
          updated_at: string | null
          uploaded_by: string | null
          year: string | null
        }
        Insert: {
          album?: string | null
          artist?: string | null
          category: string
          created_at?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          image_url?: string | null
          lyrics?: string | null
          public_url: string
          storage_path: string
          title: string
          track_number?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          year?: string | null
        }
        Update: {
          album?: string | null
          artist?: string | null
          category?: string
          created_at?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          image_url?: string | null
          lyrics?: string | null
          public_url?: string
          storage_path?: string
          title?: string
          track_number?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          year?: string | null
        }
        Relationships: []
      }
      next_best_actions: {
        Row: {
          action_type: string
          channel: string
          created_at: string | null
          id: string
          message_recipe: Json
          offer_id: string | null
          personality_match: Json | null
          predicted_conversion_rate: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          channel: string
          created_at?: string | null
          id?: string
          message_recipe?: Json
          offer_id?: string | null
          personality_match?: Json | null
          predicted_conversion_rate?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          channel?: string
          created_at?: string | null
          id?: string
          message_recipe?: Json
          offer_id?: string | null
          personality_match?: Json | null
          predicted_conversion_rate?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          custom_image_url: string | null
          id: string
          order_id: string | null
          price: number
          product_id: string | null
          quantity: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_image_url?: string | null
          id?: string
          order_id?: string | null
          price: number
          product_id?: string | null
          quantity: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_image_url?: string | null
          id?: string
          order_id?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          shipping_address: Json | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          shipping_address?: Json | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          shipping_address?: Json | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      page_tracking: {
        Row: {
          created_at: string | null
          id: string
          page_url: string
          session_id: string
          time_spent: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_url: string
          session_id: string
          time_spent?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_url?: string
          session_id?: string
          time_spent?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      personality_features: {
        Row: {
          computed_at: string | null
          feature_name: string
          id: string
          time_window: string
          user_id: string
          value: number
        }
        Insert: {
          computed_at?: string | null
          feature_name: string
          id?: string
          time_window: string
          user_id: string
          value: number
        }
        Update: {
          computed_at?: string | null
          feature_name?: string
          id?: string
          time_window?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      personality_profiles: {
        Row: {
          assertiveness: number | null
          confidence_score: number | null
          created_at: string | null
          feature_vector: Json | null
          id: string
          last_computed: string | null
          mbti_type: string | null
          p_e: number
          p_f: number
          p_i: number
          p_j: number
          p_n: number
          p_p: number
          p_s: number
          p_t: number
          survey_responses: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assertiveness?: number | null
          confidence_score?: number | null
          created_at?: string | null
          feature_vector?: Json | null
          id?: string
          last_computed?: string | null
          mbti_type?: string | null
          p_e?: number
          p_f?: number
          p_i?: number
          p_j?: number
          p_n?: number
          p_p?: number
          p_s?: number
          p_t?: number
          survey_responses?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assertiveness?: number | null
          confidence_score?: number | null
          created_at?: string | null
          feature_vector?: Json | null
          id?: string
          last_computed?: string | null
          mbti_type?: string | null
          p_e?: number
          p_f?: number
          p_i?: number
          p_j?: number
          p_n?: number
          p_p?: number
          p_s?: number
          p_t?: number
          survey_responses?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_analytics: {
        Row: {
          active_tenants: number | null
          api_calls: number | null
          created_at: string | null
          date: string
          id: string
          platform_fee_revenue: number | null
          storage_used_gb: number | null
          total_revenue: number | null
          total_tenants: number | null
          total_users: number | null
        }
        Insert: {
          active_tenants?: number | null
          api_calls?: number | null
          created_at?: string | null
          date: string
          id?: string
          platform_fee_revenue?: number | null
          storage_used_gb?: number | null
          total_revenue?: number | null
          total_tenants?: number | null
          total_users?: number | null
        }
        Update: {
          active_tenants?: number | null
          api_calls?: number | null
          created_at?: string | null
          date?: string
          id?: string
          platform_fee_revenue?: number | null
          storage_used_gb?: number | null
          total_revenue?: number | null
          total_tenants?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      popup_displays: {
        Row: {
          action_taken: string | null
          action_timestamp: string | null
          content: Json
          id: string
          metadata: Json | null
          popup_type: string
          sequence_execution_id: string | null
          shown_at: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          action_timestamp?: string | null
          content: Json
          id?: string
          metadata?: Json | null
          popup_type: string
          sequence_execution_id?: string | null
          shown_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          action_timestamp?: string | null
          content?: Json
          id?: string
          metadata?: Json | null
          popup_type?: string
          sequence_execution_id?: string | null
          shown_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popup_displays_sequence_execution_id_fkey"
            columns: ["sequence_execution_id"]
            isOneToOne: false
            referencedRelation: "sequence_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_connections: {
        Row: {
          analytics: Json | null
          created_at: string
          disconnected_at: string | null
          host_artist_id: string
          id: string
          offer_duration_days: number | null
          partner_artist_id: string
          partner_avatar_url: string | null
          partner_bio: string | null
          partner_name: string
          special_offer: string | null
          status: string
        }
        Insert: {
          analytics?: Json | null
          created_at?: string
          disconnected_at?: string | null
          host_artist_id: string
          id?: string
          offer_duration_days?: number | null
          partner_artist_id: string
          partner_avatar_url?: string | null
          partner_bio?: string | null
          partner_name: string
          special_offer?: string | null
          status?: string
        }
        Update: {
          analytics?: Json | null
          created_at?: string
          disconnected_at?: string | null
          host_artist_id?: string
          id?: string
          offer_duration_days?: number | null
          partner_artist_id?: string
          partner_avatar_url?: string | null
          partner_bio?: string | null
          partner_name?: string
          special_offer?: string | null
          status?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price_modifier: number | null
          product_id: string | null
          stock: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price_modifier?: number | null
          product_id?: string | null
          stock?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price_modifier?: number | null
          product_id?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean | null
          base_price: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          base_price: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          base_price?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ptp_behavior_log: {
        Row: {
          behavior_key: string
          created_at: string | null
          id: string
          metadata: Json | null
          points_awarded: number
          user_id: string | null
        }
        Insert: {
          behavior_key: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_awarded: number
          user_id?: string | null
        }
        Update: {
          behavior_key?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_awarded?: number
          user_id?: string | null
        }
        Relationships: []
      }
      ptp_behavior_weights: {
        Row: {
          behavior_key: string
          behavior_name: string
          created_at: string | null
          description: string | null
          id: string
          tier: string
          weight: number
          zone: string
        }
        Insert: {
          behavior_key: string
          behavior_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          tier: string
          weight: number
          zone: string
        }
        Update: {
          behavior_key?: string
          behavior_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          tier?: string
          weight?: number
          zone?: string
        }
        Relationships: []
      }
      ptp_score_history: {
        Row: {
          calculated_at: string | null
          contributing_factors: Json | null
          id: string
          score: number
          status: string
          user_id: string
        }
        Insert: {
          calculated_at?: string | null
          contributing_factors?: Json | null
          id?: string
          score: number
          status: string
          user_id: string
        }
        Update: {
          calculated_at?: string | null
          contributing_factors?: Json | null
          id?: string
          score?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_total: number
          created_at: string | null
          currency: string | null
          customer_name: string | null
          email: string
          id: string
          metadata: Json | null
          product_id: string | null
          product_name: string
          product_type: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_total: number
          created_at?: string | null
          currency?: string | null
          customer_name?: string | null
          email: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_name: string
          product_type: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_total?: number
          created_at?: string | null
          currency?: string | null
          customer_name?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_name?: string
          product_type?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      response_queue: {
        Row: {
          actual_send_time: string | null
          created_at: string | null
          id: string
          message_content: string
          priority: string | null
          response_category: string | null
          scheduled_send_time: string
          status: string | null
          trigger_event_id: string | null
          user_id: string | null
        }
        Insert: {
          actual_send_time?: string | null
          created_at?: string | null
          id?: string
          message_content: string
          priority?: string | null
          response_category?: string | null
          scheduled_send_time: string
          status?: string | null
          trigger_event_id?: string | null
          user_id?: string | null
        }
        Update: {
          actual_send_time?: string | null
          created_at?: string | null
          id?: string
          message_content?: string
          priority?: string | null
          response_category?: string | null
          scheduled_send_time?: string
          status?: string | null
          trigger_event_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      response_templates: {
        Row: {
          artist_id: string
          category: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          max_delay_minutes: number | null
          min_delay_minutes: number | null
          template_text: string
          use_count: number | null
        }
        Insert: {
          artist_id: string
          category: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          max_delay_minutes?: number | null
          min_delay_minutes?: number | null
          template_text: string
          use_count?: number | null
        }
        Update: {
          artist_id?: string
          category?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          max_delay_minutes?: number | null
          min_delay_minutes?: number | null
          template_text?: string
          use_count?: number | null
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          created_at: string | null
          email_data: Json
          email_type: string
          id: string
          scheduled_for: string
          sent: boolean | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_data: Json
          email_type: string
          id?: string
          scheduled_for: string
          sent?: boolean | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_data?: Json
          email_type?: string
          id?: string
          scheduled_for?: string
          sent?: boolean | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          clicked_result_id: string | null
          created_at: string | null
          id: string
          query_text: string
          result_clicked: boolean | null
          results_count: number | null
          search_context: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          created_at?: string | null
          id?: string
          query_text: string
          result_clicked?: boolean | null
          results_count?: number | null
          search_context?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          created_at?: string | null
          id?: string
          query_text?: string
          result_clicked?: boolean | null
          results_count?: number | null
          search_context?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sequence_executions: {
        Row: {
          completed_at: string | null
          current_decision_node: string | null
          decision_history: Json | null
          goal_id: string | null
          id: string
          metadata: Json | null
          next_action_config: Json | null
          next_action_scheduled_for: string | null
          next_action_type: string | null
          sequence_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          current_decision_node?: string | null
          decision_history?: Json | null
          goal_id?: string | null
          id?: string
          metadata?: Json | null
          next_action_config?: Json | null
          next_action_scheduled_for?: string | null
          next_action_type?: string | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          current_decision_node?: string | null
          decision_history?: Json | null
          goal_id?: string | null
          id?: string
          metadata?: Json | null
          next_action_config?: Json | null
          next_action_scheduled_for?: string | null
          next_action_type?: string | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_executions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "marketing_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_executions_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "adaptive_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      session_analytics: {
        Row: {
          abandoned_cart: boolean | null
          bounce_rate: number | null
          conversion_funnel_stage: string | null
          id: string
          occurred_at: string | null
          page_views: number | null
          session_id: string | null
          synced_at: string | null
          time_on_site: number | null
          user_id: string | null
        }
        Insert: {
          abandoned_cart?: boolean | null
          bounce_rate?: number | null
          conversion_funnel_stage?: string | null
          id?: string
          occurred_at?: string | null
          page_views?: number | null
          session_id?: string | null
          synced_at?: string | null
          time_on_site?: number | null
          user_id?: string | null
        }
        Update: {
          abandoned_cart?: boolean | null
          bounce_rate?: number | null
          conversion_funnel_stage?: string | null
          id?: string
          occurred_at?: string | null
          page_views?: number | null
          session_id?: string | null
          synced_at?: string | null
          time_on_site?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      shopify_discount_codes: {
        Row: {
          abandoned_cart_id: string | null
          code: string
          created_at: string | null
          discount_percentage: number
          id: string
          shopify_discount_id: string | null
          shopify_price_rule_id: string | null
          used_at: string | null
          valid_until: string | null
        }
        Insert: {
          abandoned_cart_id?: string | null
          code: string
          created_at?: string | null
          discount_percentage: number
          id?: string
          shopify_discount_id?: string | null
          shopify_price_rule_id?: string | null
          used_at?: string | null
          valid_until?: string | null
        }
        Update: {
          abandoned_cart_id?: string | null
          code?: string
          created_at?: string | null
          discount_percentage?: number
          id?: string
          shopify_discount_id?: string | null
          shopify_price_rule_id?: string | null
          used_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_discount_codes_abandoned_cart_id_fkey"
            columns: ["abandoned_cart_id"]
            isOneToOne: false
            referencedRelation: "abandoned_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_campaigns: {
        Row: {
          ai_analysis: Json | null
          campaign_type: string
          created_at: string | null
          created_by: string | null
          event_date: string | null
          event_location: Json | null
          goal: string
          id: string
          min_loyalty_score: number | null
          ptp_max: number | null
          ptp_min: number | null
          status: string | null
          target_count: number | null
          target_radius_miles: number | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          event_location?: Json | null
          goal: string
          id?: string
          min_loyalty_score?: number | null
          ptp_max?: number | null
          ptp_min?: number | null
          status?: string | null
          target_count?: number | null
          target_radius_miles?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          event_location?: Json | null
          goal?: string
          id?: string
          min_loyalty_score?: number | null
          ptp_max?: number | null
          ptp_min?: number | null
          status?: string | null
          target_count?: number | null
          target_radius_miles?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_sends: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message_body: string
          phone_number: string
          purchased_at: string | null
          send_sequence_number: number | null
          status: string | null
          twilio_message_sid: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_body: string
          phone_number: string
          purchased_at?: string | null
          send_sequence_number?: number | null
          status?: string | null
          twilio_message_sid?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string
          phone_number?: string
          purchased_at?: string | null
          send_sequence_number?: number | null
          status?: string | null
          twilio_message_sid?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      social_credentials: {
        Row: {
          browser_events_enabled: boolean | null
          created_at: string
          credential_metadata: Json | null
          credential_type: string
          id: string
          is_configured: boolean
          last_verified_at: string | null
          platform: string
          status: string
          tracking_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_events_enabled?: boolean | null
          created_at?: string
          credential_metadata?: Json | null
          credential_type: string
          id?: string
          is_configured?: boolean
          last_verified_at?: string | null
          platform: string
          status?: string
          tracking_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_events_enabled?: boolean | null
          created_at?: string
          credential_metadata?: Json | null
          credential_type?: string
          id?: string
          is_configured?: boolean
          last_verified_at?: string | null
          platform?: string
          status?: string
          tracking_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_engagement_data: {
        Row: {
          engagement_type: string | null
          engagement_value: Json | null
          id: string
          occurred_at: string | null
          platform: string
          post_id: string | null
          synced_at: string | null
          user_id: string | null
        }
        Insert: {
          engagement_type?: string | null
          engagement_value?: Json | null
          id?: string
          occurred_at?: string | null
          platform: string
          post_id?: string | null
          synced_at?: string | null
          user_id?: string | null
        }
        Update: {
          engagement_type?: string | null
          engagement_value?: Json | null
          id?: string
          occurred_at?: string | null
          platform?: string
          post_id?: string | null
          synced_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      streaming_stats: {
        Row: {
          created_at: string | null
          estimated_revenue: number | null
          id: string
          merchant_id: string
          period_end: string
          period_start: string
          platform: string
          streams: number | null
        }
        Insert: {
          created_at?: string | null
          estimated_revenue?: number | null
          id?: string
          merchant_id: string
          period_end: string
          period_start: string
          platform: string
          streams?: number | null
        }
        Update: {
          created_at?: string | null
          estimated_revenue?: number | null
          id?: string
          merchant_id?: string
          period_end?: string
          period_start?: string
          platform?: string
          streams?: number | null
        }
        Relationships: []
      }
      survey_discount_codes: {
        Row: {
          created_at: string
          discount_code: string
          discount_percentage: number
          expires_at: string | null
          id: string
          is_used: boolean | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_code: string
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_code?: string
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tenant_admins: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_by: string | null
          permissions: Json | null
          role: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_by?: string | null
          permissions?: Json | null
          role?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_by?: string | null
          permissions?: Json | null
          role?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_admins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          features_enabled: Json | null
          id: string
          plan_type: string
          status: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string | null
          usage_limits: Json | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          features_enabled?: Json | null
          id?: string
          plan_type: string
          status?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          features_enabled?: Json | null
          id?: string
          plan_type?: string
          status?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          about_text: string | null
          accent_color: string | null
          created_at: string | null
          custom_domain: string | null
          favicon_url: string | null
          hero_video_url: string | null
          id: string
          logo_url: string | null
          name: string
          plan_tier: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          shopify_store_domain: string | null
          shopify_storefront_token: string | null
          slug: string
          social_links: Json | null
          status: string | null
          stripe_account_id: string | null
          subdomain: string
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          about_text?: string | null
          accent_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          hero_video_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan_tier?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          shopify_store_domain?: string | null
          shopify_storefront_token?: string | null
          slug: string
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          subdomain: string
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          about_text?: string | null
          accent_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          hero_video_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan_tier?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          shopify_store_domain?: string | null
          shopify_storefront_token?: string | null
          slug?: string
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          subdomain?: string
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_merch_bundles: {
        Row: {
          available_sizes: Json | null
          bundle_price: number
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          items: Json
          name: string
          original_price: number
          savings_percentage: number | null
        }
        Insert: {
          available_sizes?: Json | null
          bundle_price: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          items?: Json
          name: string
          original_price: number
          savings_percentage?: number | null
        }
        Update: {
          available_sizes?: Json | null
          bundle_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          items?: Json
          name?: string
          original_price?: number
          savings_percentage?: number | null
        }
        Relationships: []
      }
      ticket_orders: {
        Row: {
          bundles: Json | null
          confirmation_sent_at: string | null
          created_at: string | null
          customer_email: string
          customer_name: string | null
          id: string
          order_number: string
          payment_intent_id: string | null
          portal_convenience_fee: number | null
          show_id: string | null
          status: string | null
          stripe_session_id: string | null
          subtotal: number
          ticketmaster_fees: number | null
          tickets: Json
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bundles?: Json | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          customer_email: string
          customer_name?: string | null
          id?: string
          order_number: string
          payment_intent_id?: string | null
          portal_convenience_fee?: number | null
          show_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          ticketmaster_fees?: number | null
          tickets?: Json
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bundles?: Json | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string | null
          id?: string
          order_number?: string
          payment_intent_id?: string | null
          portal_convenience_fee?: number | null
          show_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          ticketmaster_fees?: number | null
          tickets?: Json
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "tour_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          available_quantity: number | null
          created_at: string | null
          description: string | null
          id: string
          max_per_order: number | null
          name: string
          perks: Json | null
          price: number
          show_id: string | null
          tier_order: number | null
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_per_order?: number | null
          name: string
          perks?: Json | null
          price: number
          show_id?: string | null
          tier_order?: number | null
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_per_order?: number | null
          name?: string
          perks?: Json | null
          price?: number
          show_id?: string | null
          tier_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "tour_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_shows: {
        Row: {
          city: string
          country: string | null
          created_at: string | null
          date: string
          id: string
          special_guests: string | null
          state: string | null
          status: string | null
          ticket_link: string | null
          updated_at: string | null
          venue: string
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string | null
          date: string
          id?: string
          special_guests?: string | null
          state?: string | null
          status?: string | null
          ticket_link?: string | null
          updated_at?: string | null
          venue: string
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string | null
          date?: string
          id?: string
          special_guests?: string | null
          state?: string | null
          status?: string | null
          ticket_link?: string | null
          updated_at?: string | null
          venue?: string
        }
        Relationships: []
      }
      tracking_pixels: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          name: string
          pixel_id: string
          platform: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          pixel_id: string
          platform: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          pixel_id?: string
          platform?: string
        }
        Relationships: []
      }
      trial_email_logs: {
        Row: {
          created_at: string
          email_type: string
          id: string
          plan_type: string
          sent_at: string
          subscription_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          plan_type: string
          sent_at?: string
          subscription_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          plan_type?: string
          sent_at?: string
          subscription_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_email_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          ai_insights: Json | null
          created_at: string | null
          engagement_score: number | null
          favorite_pages: string[] | null
          id: string
          is_super_fan: boolean | null
          last_activity: string | null
          location_city: string | null
          location_country: string | null
          total_purchases: number | null
          total_spent: number | null
          total_visits: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_insights?: Json | null
          created_at?: string | null
          engagement_score?: number | null
          favorite_pages?: string[] | null
          id?: string
          is_super_fan?: boolean | null
          last_activity?: string | null
          location_city?: string | null
          location_country?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_insights?: Json | null
          created_at?: string | null
          engagement_score?: number | null
          favorite_pages?: string[] | null
          id?: string
          is_super_fan?: boolean | null
          last_activity?: string | null
          location_city?: string | null
          location_country?: string | null
          total_purchases?: number | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_behavior_profiles: {
        Row: {
          behavioral_segments: string[] | null
          created_at: string | null
          engagement_score: number | null
          favorite_content_types: Json | null
          favorite_products: string[] | null
          favorite_tracks: string[] | null
          id: string
          last_visit_at: string | null
          music_taste_profile: Json | null
          purchase_history_summary: Json | null
          total_session_time_seconds: number | null
          total_visits: number | null
          updated_at: string | null
          user_id: string
          visit_frequency: string | null
        }
        Insert: {
          behavioral_segments?: string[] | null
          created_at?: string | null
          engagement_score?: number | null
          favorite_content_types?: Json | null
          favorite_products?: string[] | null
          favorite_tracks?: string[] | null
          id?: string
          last_visit_at?: string | null
          music_taste_profile?: Json | null
          purchase_history_summary?: Json | null
          total_session_time_seconds?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id: string
          visit_frequency?: string | null
        }
        Update: {
          behavioral_segments?: string[] | null
          created_at?: string | null
          engagement_score?: number | null
          favorite_content_types?: Json | null
          favorite_products?: string[] | null
          favorite_tracks?: string[] | null
          id?: string
          last_visit_at?: string | null
          music_taste_profile?: Json | null
          purchase_history_summary?: Json | null
          total_session_time_seconds?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string
          visit_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_behavior_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_engagement_state: {
        Row: {
          channel_preference: string | null
          consecutive_no_opens: number | null
          consecutive_popup_dismissals: number | null
          consecutive_sms_interactions: number | null
          email_engagement_level: string | null
          global_cooldown_until: string | null
          inbox_engagement_level: string | null
          last_conversion: string | null
          last_email_sent: string | null
          last_inbox_sent: string | null
          last_popup_shown: string | null
          last_sms_sent: string | null
          popup_cooldown_until: string | null
          popup_engagement_level: string | null
          sms_engagement_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_preference?: string | null
          consecutive_no_opens?: number | null
          consecutive_popup_dismissals?: number | null
          consecutive_sms_interactions?: number | null
          email_engagement_level?: string | null
          global_cooldown_until?: string | null
          inbox_engagement_level?: string | null
          last_conversion?: string | null
          last_email_sent?: string | null
          last_inbox_sent?: string | null
          last_popup_shown?: string | null
          last_sms_sent?: string | null
          popup_cooldown_until?: string | null
          popup_engagement_level?: string | null
          sms_engagement_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_preference?: string | null
          consecutive_no_opens?: number | null
          consecutive_popup_dismissals?: number | null
          consecutive_sms_interactions?: number | null
          email_engagement_level?: string | null
          global_cooldown_until?: string | null
          inbox_engagement_level?: string | null
          last_conversion?: string | null
          last_email_sent?: string | null
          last_inbox_sent?: string | null
          last_popup_shown?: string | null
          last_sms_sent?: string | null
          popup_cooldown_until?: string | null
          popup_engagement_level?: string | null
          sms_engagement_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          location_data: Json | null
          page_url: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          page_url?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          page_url?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          insight_data: Json
          insight_type: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data: Json
          insight_type: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          achieved_at: string
          created_at: string | null
          id: string
          milestone_type: string
          reward_claimed: boolean | null
          reward_claimed_at: string | null
          shipping_address: Json | null
          total_minutes_at_achievement: number
          user_id: string
        }
        Insert: {
          achieved_at?: string
          created_at?: string | null
          id?: string
          milestone_type: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          shipping_address?: Json | null
          total_minutes_at_achievement: number
          user_id: string
        }
        Update: {
          achieved_at?: string
          created_at?: string | null
          id?: string
          milestone_type?: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          shipping_address?: Json | null
          total_minutes_at_achievement?: number
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          agent_enabled: boolean | null
          agent_message_count: number | null
          agent_messages_dismissed_count: number | null
          created_at: string | null
          do_not_disturb_until: string | null
          id: string
          last_agent_message_at: string | null
          preferred_communication_style: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_enabled?: boolean | null
          agent_message_count?: number | null
          agent_messages_dismissed_count?: number | null
          created_at?: string | null
          do_not_disturb_until?: string | null
          id?: string
          last_agent_message_at?: string | null
          preferred_communication_style?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_enabled?: boolean | null
          agent_message_count?: number | null
          agent_messages_dismissed_count?: number | null
          created_at?: string | null
          do_not_disturb_until?: string | null
          id?: string
          last_agent_message_at?: string | null
          preferred_communication_style?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle_anchor: string | null
          bio: string | null
          birthdate: string | null
          community_engagement_score: number | null
          created_at: string | null
          display_name: string | null
          email: string | null
          era_current: number | null
          era_label: string | null
          external_ids: Json | null
          full_name: string | null
          gender: string | null
          heartbeat_member_id: string | null
          id: string
          inactive_days: number | null
          intro_answers: Json | null
          is_online: boolean | null
          is_public: boolean | null
          is_super_fan: boolean | null
          jrny_member_id: string | null
          last_active_at: string | null
          last_livestream_reaction: string | null
          last_login: string | null
          last_login_date: string | null
          last_payday_analysis: string | null
          last_ptp_calculation: string | null
          latitude: number | null
          likely_payday_dates: number[] | null
          listen_time: number | null
          livestream_claps_sent: number | null
          livestream_engagement_score: number | null
          livestream_hearts_sent: number | null
          livestream_reaction_count: number | null
          location: string | null
          login_streak: number | null
          longitude: number | null
          membership_tier: string | null
          mrr: number | null
          payday_confidence_score: number | null
          payday_pattern: Json | null
          payroll_cycle_type: string | null
          phone_number: string | null
          products_purchased: string[] | null
          ptp_current: number | null
          ptp_score: number | null
          ptp_status: string | null
          purchase_history: Json | null
          real_name: string | null
          sms_opt_in: boolean | null
          sms_opted_out_at: string | null
          stripe_customer_id: string | null
          subscription_current_period_end: string | null
          subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          tier: string | null
          total_sessions: number | null
          total_spend: number | null
          trial_end_date: string | null
          tunepipe_subscriber_id: string | null
          updated_at: string | null
          user_id: string | null
          watch_time: number | null
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle_anchor?: string | null
          bio?: string | null
          birthdate?: string | null
          community_engagement_score?: number | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          era_current?: number | null
          era_label?: string | null
          external_ids?: Json | null
          full_name?: string | null
          gender?: string | null
          heartbeat_member_id?: string | null
          id?: string
          inactive_days?: number | null
          intro_answers?: Json | null
          is_online?: boolean | null
          is_public?: boolean | null
          is_super_fan?: boolean | null
          jrny_member_id?: string | null
          last_active_at?: string | null
          last_livestream_reaction?: string | null
          last_login?: string | null
          last_login_date?: string | null
          last_payday_analysis?: string | null
          last_ptp_calculation?: string | null
          latitude?: number | null
          likely_payday_dates?: number[] | null
          listen_time?: number | null
          livestream_claps_sent?: number | null
          livestream_engagement_score?: number | null
          livestream_hearts_sent?: number | null
          livestream_reaction_count?: number | null
          location?: string | null
          login_streak?: number | null
          longitude?: number | null
          membership_tier?: string | null
          mrr?: number | null
          payday_confidence_score?: number | null
          payday_pattern?: Json | null
          payroll_cycle_type?: string | null
          phone_number?: string | null
          products_purchased?: string[] | null
          ptp_current?: number | null
          ptp_score?: number | null
          ptp_status?: string | null
          purchase_history?: Json | null
          real_name?: string | null
          sms_opt_in?: boolean | null
          sms_opted_out_at?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tier?: string | null
          total_sessions?: number | null
          total_spend?: number | null
          trial_end_date?: string | null
          tunepipe_subscriber_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          watch_time?: number | null
        }
        Update: {
          avatar_url?: string | null
          billing_cycle_anchor?: string | null
          bio?: string | null
          birthdate?: string | null
          community_engagement_score?: number | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          era_current?: number | null
          era_label?: string | null
          external_ids?: Json | null
          full_name?: string | null
          gender?: string | null
          heartbeat_member_id?: string | null
          id?: string
          inactive_days?: number | null
          intro_answers?: Json | null
          is_online?: boolean | null
          is_public?: boolean | null
          is_super_fan?: boolean | null
          jrny_member_id?: string | null
          last_active_at?: string | null
          last_livestream_reaction?: string | null
          last_login?: string | null
          last_login_date?: string | null
          last_payday_analysis?: string | null
          last_ptp_calculation?: string | null
          latitude?: number | null
          likely_payday_dates?: number[] | null
          listen_time?: number | null
          livestream_claps_sent?: number | null
          livestream_engagement_score?: number | null
          livestream_hearts_sent?: number | null
          livestream_reaction_count?: number | null
          location?: string | null
          login_streak?: number | null
          longitude?: number | null
          membership_tier?: string | null
          mrr?: number | null
          payday_confidence_score?: number | null
          payday_pattern?: Json | null
          payroll_cycle_type?: string | null
          phone_number?: string | null
          products_purchased?: string[] | null
          ptp_current?: number | null
          ptp_score?: number | null
          ptp_status?: string | null
          purchase_history?: Json | null
          real_name?: string | null
          sms_opt_in?: boolean | null
          sms_opted_out_at?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tier?: string | null
          total_sessions?: number | null
          total_spend?: number | null
          trial_end_date?: string | null
          tunepipe_subscriber_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          watch_time?: number | null
        }
        Relationships: []
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
      user_send_preferences: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          last_calculated_at: string | null
          open_pattern: Json | null
          optimal_send_day: string | null
          optimal_send_hour: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          open_pattern?: Json | null
          optimal_send_day?: string | null
          optimal_send_hour?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          open_pattern?: Json | null
          optimal_send_day?: string | null
          optimal_send_hour?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_send_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      venue_sections: {
        Row: {
          available: number | null
          capacity: number | null
          created_at: string | null
          id: string
          price_modifier: number | null
          row_end: number | null
          row_start: number | null
          section_name: string
          section_type: string | null
          show_id: string | null
        }
        Insert: {
          available?: number | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          price_modifier?: number | null
          row_end?: number | null
          row_start?: number | null
          section_name: string
          section_type?: string | null
          show_id?: string | null
        }
        Update: {
          available?: number | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          price_modifier?: number | null
          row_end?: number | null
          row_start?: number | null
          section_name?: string
          section_type?: string | null
          show_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_sections_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "tour_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      viberate_metrics: {
        Row: {
          artist_id: string
          artist_name: string
          created_at: string | null
          data: Json
          id: string
          synced_at: string | null
        }
        Insert: {
          artist_id: string
          artist_name: string
          created_at?: string | null
          data: Json
          id?: string
          synced_at?: string | null
        }
        Update: {
          artist_id?: string
          artist_name?: string
          created_at?: string | null
          data?: Json
          id?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          parent_comment_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_favorites: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_video_favorites_video"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_premium: boolean | null
          metatags: string[] | null
          storage_path: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_premium?: boolean | null
          metatags?: string[] | null
          storage_path: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_premium?: boolean | null
          metatags?: string[] | null
          storage_path?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      vod_views: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          session_id: string
          updated_at: string
          user_id: string | null
          vod_id: string
          watch_duration_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          session_id: string
          updated_at?: string
          user_id?: string | null
          vod_id: string
          watch_duration_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
          vod_id?: string
          watch_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vod_views_vod_id_fkey"
            columns: ["vod_id"]
            isOneToOne: false
            referencedRelation: "livestream_vods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cron_job_status: {
        Row: {
          active: boolean | null
          end_time: string | null
          job_pid: number | null
          jobname: string | null
          return_message: string | null
          runid: number | null
          schedule: string | null
          start_time: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_events: { Args: never; Returns: number }
      calculate_distance_miles: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_jrny_engagement: {
        Args: { p_jrny_id: string }
        Returns: {
          heat: string
          score: number
        }[]
      }
      compute_community_analytics: { Args: never; Returns: undefined }
      current_tenant_id: { Args: never; Returns: string }
      generate_affiliate_code: {
        Args: { display_name: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listen_time: {
        Args: { p_duration: number; p_user_id: string }
        Returns: undefined
      }
      increment_watch_time: {
        Args: { p_duration: number; p_user_id: string }
        Returns: undefined
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      link_jrny_visitor_to_user: {
        Args: { p_email?: string; p_jrny_id: string; p_user_id: string }
        Returns: undefined
      }
      recalculate_all_livestream_engagement: { Args: never; Returns: undefined }
      record_journey_milestone: {
        Args: { p_metadata?: Json; p_milestone_key: string; p_user_id: string }
        Returns: boolean
      }
      set_tenant_context: { Args: { _tenant_id: string }; Returns: undefined }
      track_affiliate_content_click: {
        Args: {
          p_content_id: string
          p_referrer?: string
          p_session_id?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      update_user_coordinates: {
        Args: { p_latitude: number; p_longitude: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "merchant" | "user"
      event_type:
        | "watch_start"
        | "watch_complete"
        | "listen_start"
        | "listen_complete"
        | "page_view"
        | "series_step"
        | "reaction"
        | "comment"
        | "add_to_cart"
        | "purchase"
        | "reward_claim"
        | "agent_interaction"
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
      app_role: ["admin", "merchant", "user"],
      event_type: [
        "watch_start",
        "watch_complete",
        "listen_start",
        "listen_complete",
        "page_view",
        "series_step",
        "reaction",
        "comment",
        "add_to_cart",
        "purchase",
        "reward_claim",
        "agent_interaction",
      ],
    },
  },
} as const
