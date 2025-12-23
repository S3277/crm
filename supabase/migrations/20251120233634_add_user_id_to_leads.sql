/*
  # Add user_id column to leads table
  
  1. Changes
    - Add user_id column to leads table as foreign key to auth.users
    - Add index on user_id for performance
    - Update RLS policies to use user_id
  
  2. Security
    - Maintain RLS policies filtering by user_id
    - Ensure all leads are owned by a user
*/

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Drop and recreate RLS policies to ensure they use user_id correctly
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

-- Allow service role to update leads (for webhook)
DROP POLICY IF EXISTS "Service role can update all leads" ON leads;
CREATE POLICY "Service role can update all leads"
  ON leads FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);