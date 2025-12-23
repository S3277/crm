/*
  # Add updated_by column to triggers table
  
  1. Changes
    - Add updated_by column as nullable foreign key to auth.users
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add updated_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'triggers' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE triggers ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;