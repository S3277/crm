/*
  # Fix Leads RLS Policies

  1. Changes
    - Add INSERT policy for leads table
    - Add UPDATE policy for leads table
    - Add DELETE policy for leads table
    - Keep existing SELECT policy
  
  2. Security
    - Users can only insert leads with their own user_id
    - Users can only update their own leads
    - Users can only delete their own leads
    - Service role can still update all leads (for webhooks)
*/

-- Add INSERT policy
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure service role can update leads (for webhooks)
DROP POLICY IF EXISTS "Service role can update all leads" ON leads;
CREATE POLICY "Service role can update all leads"
  ON leads FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure service role can insert leads (for webhooks)
DROP POLICY IF EXISTS "Service role can insert leads" ON leads;
CREATE POLICY "Service role can insert leads"
  ON leads FOR INSERT
  TO service_role
  WITH CHECK (true);
