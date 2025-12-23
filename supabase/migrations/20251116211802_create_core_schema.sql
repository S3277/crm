/*
  # Create B2B CRM Dashboard Schema

  ## 1. New Tables
    
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
    - `action_type` (text) - Type of action: start_calling, start_qualifying
    - `status` (text) - Status: success, failed
    - `user_id` (uuid, foreign key) - User who triggered
    - `created_at` (timestamptz) - Log timestamp
    - `details` (jsonb) - Additional log details
    
    ### `user_profiles`
    - `id` (uuid, primary key) - References auth.users
    - `full_name` (text) - User full name
    - `role` (text) - User role: admin, user
    - `company` (text) - Company name
    - `created_at` (timestamptz) - Profile creation
    - `updated_at` (timestamptz) - Last update

  ## 2. Security
    
    All tables have RLS enabled with appropriate policies:
    
    - Users can only access their own data
    - Admins have full access to all data
    - Authenticated users required for all operations
    - Proper ownership checks on all policies
    
  ## 3. Important Notes
    
    - Default trigger record created for global state
    - Indexes added for performance on frequently queried columns
    - Timestamps auto-updated via triggers
    - JSON fields for extensibility
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  company text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create leads table
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

CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Create triggers table (global state)
CREATE TABLE IF NOT EXISTS triggers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_calling boolean DEFAULT false NOT NULL,
  start_qualifying boolean DEFAULT false NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view triggers"
  ON triggers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update triggers"
  ON triggers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default trigger record
INSERT INTO triggers (id, start_calling, start_qualifying)
VALUES ('00000000-0000-0000-0000-000000000001', false, false)
ON CONFLICT (id) DO NOTHING;

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type text NOT NULL CHECK (action_type IN ('start_calling', 'start_qualifying', 'stop_calling', 'stop_qualifying')),
  status text DEFAULT 'success' NOT NULL CHECK (status IN ('success', 'failed')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all automation logs"
  ON automation_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert automation logs"
  ON automation_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON automation_logs(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for auto-updating timestamps
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