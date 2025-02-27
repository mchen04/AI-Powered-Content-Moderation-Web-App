-- Fix RLS policies for user_settings table
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (true);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (true);
CREATE POLICY "Users can insert their own settings" ON user_settings FOR INSERT WITH CHECK (true);

-- Fix RLS policies for moderation_logs table
DROP POLICY IF EXISTS "Users can view their own logs" ON moderation_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON moderation_logs;

CREATE POLICY "Users can view their own logs" ON moderation_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert their own logs" ON moderation_logs FOR INSERT WITH CHECK (true);

-- Fix RLS policies for api_keys table
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;

CREATE POLICY "Users can view their own API keys" ON api_keys FOR SELECT USING (true);
CREATE POLICY "Users can insert their own API keys" ON api_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own API keys" ON api_keys FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own API keys" ON api_keys FOR DELETE USING (true);