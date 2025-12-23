/*
  # Final Complete B2B CRM Schema

  ## 1. New Tables
    
    ### `user_profiles`
    - `id` (uuid, primary key) - References auth.users
    - `full_name` (text) - User full name
    - `role` (text) - User role: admin, user
    - `company` (text) - Company name
    - `created_at` (timestamptz) - Profile creation
    - `updated_at` (timestamptz) - Last update

    ### `leads`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, foreign key) - Reference to auth.users
    - `name` (text, required) - Lead full name
    - `email` (text) - Lead email address
    - `phone` (text) - Lead phone number
    - `status` (text, required) - Lead status: hot, warm, cold, uninterested
    - `transcript` (text) - Call transcript or notes
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `metadata` (jsonb) - Additional flexible data
    
    ### `triggers`
    - `id` (uuid, primary key) - Unique identifier
    - `start_calling` (boolean) - Automation flag for calling
    - `start_qualifying` (boolean) - Automation flag for qualifying
    - `updated_at` (timestamptz) - Last update timestamp
    - `updated_by` (uuid, foreign key) - User who triggered action
    
    ### `automation_logs`
    - `id` (uuid, primary key) - Unique identifier
    - `action_type` (text) - Type of action
    - `status` (text) - Status: success, failed
    - `user_id` (uuid, foreign key) - User who triggered
    - `created_at` (timestamptz) - Log timestamp
    - `details` (jsonb) - Additional log details

  ## 2. Security
    
    All tables have RLS enabled with proper policies
    
  ## 3. Important Notes
    
    - Default trigger record created
    - Indexes for performance
    - Timestamps auto-updated
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  company text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  status text DEFAULT 'cold' NOT NULL CHECK (status IN ('hot', 'warm', 'cold', 'uninterested')),
  transcript text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own leads" ON leads;
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own leads" ON leads;
CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Triggers table
CREATE TABLE IF NOT EXISTS triggers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_calling boolean DEFAULT false NOT NULL,
  start_qualifying boolean DEFAULT false NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view triggers" ON triggers;
CREATE POLICY "Authenticated users can view triggers"
  ON triggers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update triggers" ON triggers;
CREATE POLICY "Authenticated users can update triggers"
  ON triggers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO triggers (id, start_calling, start_qualifying)
VALUES ('00000000-0000-0000-0000-000000000001', false, false)
ON CONFLICT (id) DO NOTHING;

-- Automation logs (already exists, just ensure RLS)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'automation_logs') THEN
    ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view all automation logs" ON automation_logs;
    CREATE POLICY "Users can view all automation logs"
      ON automation_logs FOR SELECT
      TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "Users can insert automation logs" ON automation_logs;
    CREATE POLICY "Users can insert automation logs"
      ON automation_logs FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own automation logs" ON automation_logs;
    CREATE POLICY "Users can delete own automation logs"
      ON automation_logs FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamps
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_triggers_updated_at ON triggers;
CREATE TRIGGER update_triggers_updated_at
  BEFORE UPDATE ON triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();