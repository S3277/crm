/*
  # Make Triggers User-Specific

  1. Changes
    - Add `user_id` column to `triggers` table
    - Update RLS policies to be user-specific
    - Remove global trigger record
    - Create triggers per user automatically

  2. Security
    - Users can only view and update their own triggers
    - No more shared global trigger state
*/

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'triggers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE triggers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Delete the old global trigger
DELETE FROM triggers WHERE id = '00000000-0000-0000-0000-000000000001';

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view triggers" ON triggers;
DROP POLICY IF EXISTS "Authenticated users can update triggers" ON triggers;

-- Create new user-specific policies
CREATE POLICY "Users can view own triggers"
  ON triggers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own triggers"
  ON triggers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own triggers"
  ON triggers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own triggers"
  ON triggers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_triggers_user_id ON triggers(user_id);

-- Function to create trigger for new users
CREATE OR REPLACE FUNCTION create_user_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO triggers (user_id, start_calling, start_qualifying)
  VALUES (NEW.id, false, false)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create triggers for new users
DROP TRIGGER IF EXISTS on_user_created_create_trigger ON auth.users;
CREATE TRIGGER on_user_created_create_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_trigger();

-- Create triggers for existing users
INSERT INTO triggers (user_id, start_calling, start_qualifying)
SELECT id, false, false
FROM auth.users
ON CONFLICT DO NOTHING;
