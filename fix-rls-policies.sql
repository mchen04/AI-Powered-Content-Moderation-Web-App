-- Fix RLS policies to allow service role to bypass RLS

-- For user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

-- Create new policies with service role bypass
CREATE POLICY "Users can view their own settings" 
  ON user_settings 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own settings" 
  ON user_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own settings" 
  ON user_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- For moderation_logs table
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own logs" ON moderation_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON moderation_logs;

-- Create new policies with service role bypass
CREATE POLICY "Users can view their own logs" 
  ON moderation_logs 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own logs" 
  ON moderation_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- For api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;

-- Create new policies with service role bypass
CREATE POLICY "Users can view their own API keys" 
  ON api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own API keys" 
  ON api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own API keys" 
  ON api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own API keys" 
  ON api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');