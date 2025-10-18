-- Create community posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'link', 'image', 'video')),
  media_url TEXT,
  link_url TEXT,
  tagged_all BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'feed' CHECK (category IN ('feed', 'announcements', 'intros', 'legion_speaks', 'events')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create post reactions table
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create messages/DMs table
CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user profiles table with intro questionnaire
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  intro_answers JSONB,
  tier TEXT,
  total_spend NUMERIC DEFAULT 0,
  mrr NUMERIC DEFAULT 0,
  watch_time INTEGER DEFAULT 0,
  listen_time INTEGER DEFAULT 0,
  products_purchased TEXT[],
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create page tracking table
CREATE TABLE IF NOT EXISTS public.page_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  time_spent INTEGER DEFAULT 0,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tracking pixels table
CREATE TABLE IF NOT EXISTS public.tracking_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  pixel_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create legal documents table
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('privacy', 'terms', 'dpa')),
  version TEXT,
  effective_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reactions" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON public.community_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.community_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their received messages" ON public.community_messages FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for page tracking
CREATE POLICY "Users can insert their own tracking" ON public.page_tracking FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can view all tracking" ON public.page_tracking FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for tracking pixels
CREATE POLICY "Admins can manage pixels" ON public.tracking_pixels FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view enabled pixels" ON public.tracking_pixels FOR SELECT USING (enabled = true);

-- RLS Policies for legal documents
CREATE POLICY "Legal documents are viewable by everyone" ON public.legal_documents FOR SELECT USING (true);
CREATE POLICY "Admins can manage legal documents" ON public.legal_documents FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for posts
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_category ON public.community_posts(category);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_community_messages_sender ON public.community_messages(sender_id);
CREATE INDEX idx_community_messages_recipient ON public.community_messages(recipient_id);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);