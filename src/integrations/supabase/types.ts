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
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          created_at: string | null
          display_name: string | null
          era_current: number | null
          era_label: string | null
          gender: string | null
          id: string
          intro_answers: Json | null
          is_online: boolean | null
          is_public: boolean | null
          last_active_at: string | null
          last_login: string | null
          latitude: number | null
          listen_time: number | null
          location: string | null
          longitude: number | null
          mrr: number | null
          products_purchased: string[] | null
          ptp_current: number | null
          ptp_status: string | null
          real_name: string | null
          tier: string | null
          total_spend: number | null
          updated_at: string | null
          user_id: string
          watch_time: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string | null
          display_name?: string | null
          era_current?: number | null
          era_label?: string | null
          gender?: string | null
          id?: string
          intro_answers?: Json | null
          is_online?: boolean | null
          is_public?: boolean | null
          last_active_at?: string | null
          last_login?: string | null
          latitude?: number | null
          listen_time?: number | null
          location?: string | null
          longitude?: number | null
          mrr?: number | null
          products_purchased?: string[] | null
          ptp_current?: number | null
          ptp_status?: string | null
          real_name?: string | null
          tier?: string | null
          total_spend?: number | null
          updated_at?: string | null
          user_id: string
          watch_time?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string | null
          display_name?: string | null
          era_current?: number | null
          era_label?: string | null
          gender?: string | null
          id?: string
          intro_answers?: Json | null
          is_online?: boolean | null
          is_public?: boolean | null
          last_active_at?: string | null
          last_login?: string | null
          latitude?: number | null
          listen_time?: number | null
          location?: string | null
          longitude?: number | null
          mrr?: number | null
          products_purchased?: string[] | null
          ptp_current?: number | null
          ptp_status?: string | null
          real_name?: string | null
          tier?: string | null
          total_spend?: number | null
          updated_at?: string | null
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      ],
    },
  },
} as const
