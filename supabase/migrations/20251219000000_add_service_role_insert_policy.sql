/*
  # Add service role INSERT policy for leads
  
  Allows Make.com and other service role operations to insert new leads
  without RLS restrictions. This enables external workflows to create leads
  that are properly associated with a user_id.
*/

-- Service role policy for INSERT operations (for Make.com and webhooks)
DROP POLICY IF EXISTS "Service role can insert leads" ON leads;
CREATE POLICY "Service role can insert leads"
  ON leads FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role policy for DELETE operations (for Make.com cleanup)
DROP POLICY IF EXISTS "Service role can delete leads" ON leads;
CREATE POLICY "Service role can delete leads"
  ON leads FOR DELETE
  TO service_role
  USING (true);
