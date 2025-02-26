-- Supabase Schema for AI-Powered Content Moderation Web App

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create tables with RLS enabled

-- User Settings Table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  toxicity_threshold FLOAT DEFAULT 0.7,
  bias_threshold FLOAT DEFAULT 0.7,
  misinformation_threshold FLOAT DEFAULT 0.7,
  adult_threshold TEXT DEFAULT 'POSSIBLE',
  violence_threshold TEXT DEFAULT 'POSSIBLE',
  medical_threshold TEXT DEFAULT 'LIKELY',
  spoof_threshold TEXT DEFAULT 'LIKELY',
  check_copyright BOOLEAN DEFAULT TRUE,
  enabled_categories TEXT[] DEFAULT ARRAY['toxicity', 'bias', 'misinformation', 'adult', 'violence'],
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings" 
  ON user_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON user_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON user_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Moderation Logs Table
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
  content TEXT,
  moderation_results JSONB,
  logo_detection JSONB,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on moderation_logs
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for moderation_logs
CREATE POLICY "Users can view their own logs" 
  ON moderation_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" 
  ON moderation_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- API Keys Table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  name TEXT,
  rate_limit INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for api_keys
CREATE POLICY "Users can view their own API keys" 
  ON api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
  ON api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
  ON api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
  ON api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for moderated images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moderated-images', 'moderated-images', false);

-- Set up storage policies
CREATE POLICY "Users can upload their own images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'moderated-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own images" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'moderated-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create functions and triggers

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to update the last_used_at timestamp for API keys
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api_keys
  SET last_used_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_moderation_logs_user_id ON moderation_logs(user_id);
CREATE INDEX idx_moderation_logs_content_type ON moderation_logs(content_type);
CREATE INDEX idx_moderation_logs_flagged ON moderation_logs(flagged);
CREATE INDEX idx_moderation_logs_created_at ON moderation_logs(created_at);
CREATE INDEX idx_api_keys_key ON api_keys(key);