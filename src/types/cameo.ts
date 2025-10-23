export type MessageType = 'text' | 'video' | 'scheduled';
export type DisplayDuration = 'permanent' | 'auto_expire' | 'show_once';
export type CameoStatus = 'active' | 'expired' | 'viewed' | 'scheduled';

export interface Cameo {
  id: string;
  merchant_id: string;
  recipient_user_id?: string;
  recipient_manual_name?: string;
  message_type: MessageType;
  message_text?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  display_duration: DisplayDuration;
  expires_at?: string;
  scheduled_for?: string;
  status: CameoStatus;
  view_count: number;
  last_viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CameoWithProfile extends Cameo {
  recipient_profile?: {
    display_name: string;
    avatar_url?: string;
    tier?: string;
  };
}
