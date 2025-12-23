/*
  # Fix foreign key constraint on leads table
  
  1. Changes
    - Drop incorrect foreign key pointing to public.users
    - Add correct foreign key pointing to auth.users
  
  2. Security
    - Maintain all existing RLS policies
*/

-- Drop the incorrect foreign key constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey;

-- Add the correct foreign key constraint pointing to auth.users
ALTER TABLE leads 
  ADD CONSTRAINT leads_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;