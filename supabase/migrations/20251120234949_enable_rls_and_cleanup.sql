/*
  # Enable RLS and cleanup schema
  
  1. Changes
    - Enable RLS on leads table
    - Enable RLS on triggers table
    - Drop obsolete public.users table
    - Ensure all RLS policies are in place
  
  2. Security
    - All tables protected with RLS
    - Proper policies for user data isolation
*/

-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Enable RLS on triggers table
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for leads
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

-- Service role policy for webhook
DROP POLICY IF EXISTS "Service role can update all leads" ON leads;
CREATE POLICY "Service role can update all leads"
  ON leads FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Triggers table policies
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

DROP POLICY IF EXISTS "Authenticated users can insert triggers" ON triggers;
CREATE POLICY "Authenticated users can insert triggers"
  ON triggers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop obsolete public.users table if it exists
DROP TABLE IF EXISTS public.users CASCADE;