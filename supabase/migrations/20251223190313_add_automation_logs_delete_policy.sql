/*
  # Add DELETE policy for automation_logs

  1. Changes
    - Add DELETE policy for automation_logs table
    - Users can delete their own automation logs
  
  2. Security
    - Users can only delete logs where user_id matches their auth.uid()
*/

-- Add DELETE policy for automation_logs
DROP POLICY IF EXISTS "Users can delete own automation logs" ON automation_logs;
CREATE POLICY "Users can delete own automation logs"
  ON automation_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
