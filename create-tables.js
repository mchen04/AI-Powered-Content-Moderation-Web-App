require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Read Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserSettingsTable() {
  console.log('Creating user_settings table...');
  
  try {
    // Create user_settings table
    const { error } = await supabase.rpc('create_user_settings_table', {});
    
    if (error) {
      console.error('Error creating user_settings table:', error);
      return false;
    }
    
    console.log('user_settings table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating user_settings table:', error);
    return false;
  }
}

async function createModerationLogsTable() {
  console.log('Creating moderation_logs table...');
  
  try {
    // Create moderation_logs table
    const { error } = await supabase.rpc('create_moderation_logs_table', {});
    
    if (error) {
      console.error('Error creating moderation_logs table:', error);
      return false;
    }
    
    console.log('moderation_logs table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating moderation_logs table:', error);
    return false;
  }
}

async function createApiKeysTable() {
  console.log('Creating api_keys table...');
  
  try {
    // Create api_keys table
    const { error } = await supabase.rpc('create_api_keys_table', {});
    
    if (error) {
      console.error('Error creating api_keys table:', error);
      return false;
    }
    
    console.log('api_keys table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating api_keys table:', error);
    return false;
  }
}

// Create the stored procedures first
async function createStoredProcedures() {
  console.log('Creating stored procedures...');
  
  const createUserSettingsTableSQL = `
  CREATE OR REPLACE FUNCTION create_user_settings_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS user_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
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
    
    -- Enable RLS
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
    CREATE POLICY "Users can view their own settings" 
      ON user_settings 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
    CREATE POLICY "Users can update their own settings" 
      ON user_settings 
      FOR UPDATE 
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
    CREATE POLICY "Users can insert their own settings" 
      ON user_settings 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  const createModerationLogsTableSQL = `
  CREATE OR REPLACE FUNCTION create_moderation_logs_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS moderation_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
      content TEXT,
      moderation_results JSONB,
      logo_detection JSONB,
      flagged BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view their own logs" ON moderation_logs;
    CREATE POLICY "Users can view their own logs" 
      ON moderation_logs 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own logs" ON moderation_logs;
    CREATE POLICY "Users can insert their own logs" 
      ON moderation_logs 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_id ON moderation_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_type ON moderation_logs(content_type);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_flagged ON moderation_logs(flagged);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at);
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  const createApiKeysTableSQL = `
  CREATE OR REPLACE FUNCTION create_api_keys_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      key TEXT NOT NULL UNIQUE,
      name TEXT,
      rate_limit INTEGER DEFAULT 60,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_used_at TIMESTAMPTZ
    );
    
    -- Enable RLS
    ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
    CREATE POLICY "Users can view their own API keys" 
      ON api_keys 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
    CREATE POLICY "Users can insert their own API keys" 
      ON api_keys 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
    CREATE POLICY "Users can update their own API keys" 
      ON api_keys 
      FOR UPDATE 
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
    CREATE POLICY "Users can delete their own API keys" 
      ON api_keys 
      FOR DELETE 
      USING (auth.uid() = user_id);
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  try {
    // We need to use the REST API directly to execute these SQL statements
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: createUserSettingsTableSQL + createModerationLogsTableSQL + createApiKeysTableSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating stored procedures:', errorText);
      return false;
    }
    
    console.log('Stored procedures created successfully');
    return true;
  } catch (error) {
    console.error('Error creating stored procedures:', error);
    return false;
  }
}

async function setupDatabase() {
  console.log('Setting up database...');
  
  // First, create the stored procedures
  const proceduresCreated = await createStoredProcedures();
  
  if (!proceduresCreated) {
    console.log('\nUnable to create stored procedures. Please run the SQL script manually:');
    console.log('1. Go to https://app.supabase.io');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Copy and paste the contents of formatted-supabase-schema.sql');
    console.log('5. Run the SQL script');
    return;
  }
  
  // Now create the tables
  const userSettingsCreated = await createUserSettingsTable();
  const moderationLogsCreated = await createModerationLogsTable();
  const apiKeysCreated = await createApiKeysTable();
  
  if (userSettingsCreated && moderationLogsCreated && apiKeysCreated) {
    console.log('\nAll tables created successfully!');
  } else {
    console.log('\nSome tables could not be created. Please run the SQL script manually:');
    console.log('1. Go to https://app.supabase.io');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Copy and paste the contents of formatted-supabase-schema.sql');
    console.log('5. Run the SQL script');
  }
}

// Check if node-fetch is installed
try {
  require.resolve('node-fetch');
  // Run the setup
  setupDatabase().catch(console.error);
} catch (e) {
  console.log('node-fetch is not installed. Installing it now...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('node-fetch installed. Please run this script again.');
}