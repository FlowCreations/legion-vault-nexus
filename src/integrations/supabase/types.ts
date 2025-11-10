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
      email_campaigns: {
        Row: {
          ai_generated: boolean | null
          analytics: Json | null
          campaign_goal: string | null
          campaign_type: string | null
          created_at: string | null
          created_by: string | null
          email_body: string
          ethos_score: number | null
          id: string
          list_id: string | null
          love_first_validation: boolean | null
          manipulation_flags: number | null
          name: string
          preview_text: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          test_duration: number | null
          tone: string | null
          updated_at: string | null
          winner_criteria: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          analytics?: Json | null
          campaign_goal?: string | null
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          email_body: string
          ethos_score?: number | null
          id?: string
          list_id?: string | null
          love_first_validation?: boolean | null
          manipulation_flags?: number | null
          name: string
          preview_text?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          test_duration?: number | null
          tone?: string | null
          updated_at?: string | null
          winner_criteria?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          analytics?: Json | null
          campaign_goal?: string | null
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          email_body?: string
          ethos_score?: number | null
          id?: string
          list_id?: string | null
          love_first_validation?: boolean | null
          manipulation_flags?: number | null
          name?: string
          preview_text?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
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
          sent_at: string | null
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
          sent_at?: string | null
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
          sent_at?: string | null
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
          event_id: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          session_id: string | null
          total_watch_time: number | null
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id?: string | null
          total_watch_time?: number | null
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
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
          intro_answers: Json | null
          is_online: boolean | null
          is_public: boolean | null
          is_super_fan: boolean | null
          jrny_member_id: string | null
          last_active_at: string | null
          last_livestream_reaction: string | null
          last_login: string | null
          latitude: number | null
          listen_time: number | null
          livestream_claps_sent: number | null
          livestream_engagement_score: number | null
          livestream_hearts_sent: number | null
          livestream_reaction_count: number | null
          location: string | null
          longitude: number | null
          membership_tier: string | null
          mrr: number | null
          products_purchased: string[] | null
          ptp_current: number | null
          ptp_status: string | null
          purchase_history: Json | null
          real_name: string | null
          tier: string | null
          total_spend: number | null
          tunepipe_subscriber_id: string | null
          updated_at: string | null
          user_id: string | null
          watch_time: number | null
        }
        Insert: {
          avatar_url?: string | null
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
          intro_answers?: Json | null
          is_online?: boolean | null
          is_public?: boolean | null
          is_super_fan?: boolean | null
          jrny_member_id?: string | null
          last_active_at?: string | null
          last_livestream_reaction?: string | null
          last_login?: string | null
          latitude?: number | null
          listen_time?: number | null
          livestream_claps_sent?: number | null
          livestream_engagement_score?: number | null
          livestream_hearts_sent?: number | null
          livestream_reaction_count?: number | null
          location?: string | null
          longitude?: number | null
          membership_tier?: string | null
          mrr?: number | null
          products_purchased?: string[] | null
          ptp_current?: number | null
          ptp_status?: string | null
          purchase_history?: Json | null
          real_name?: string | null
          tier?: string | null
          total_spend?: number | null
          tunepipe_subscriber_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          watch_time?: number | null
        }
        Update: {
          avatar_url?: string | null
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
          intro_answers?: Json | null
          is_online?: boolean | null
          is_public?: boolean | null
          is_super_fan?: boolean | null
          jrny_member_id?: string | null
          last_active_at?: string | null
          last_livestream_reaction?: string | null
          last_login?: string | null
          latitude?: number | null
          listen_time?: number | null
          livestream_claps_sent?: number | null
          livestream_engagement_score?: number | null
          livestream_hearts_sent?: number | null
          livestream_reaction_count?: number | null
          location?: string | null
          longitude?: number | null
          membership_tier?: string | null
          mrr?: number | null
          products_purchased?: string[] | null
          ptp_current?: number | null
          ptp_status?: string | null
          purchase_history?: Json | null
          real_name?: string | null
          tier?: string | null
          total_spend?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_events: { Args: never; Returns: number }
      compute_community_analytics: { Args: never; Returns: undefined }
      current_tenant_id: { Args: never; Returns: string }
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
      recalculate_all_livestream_engagement: { Args: never; Returns: undefined }
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
