/*
  # Add Phone Number E.164 Format Constraint

  1. Changes
    - Add CHECK constraint to ensure all phone numbers are in E.164 format (start with +)
    - Add trigger to auto-format phone numbers before insert/update
    - Update any existing non-formatted numbers
  
  2. Security
    - Ensures VAPI compatibility by enforcing E.164 format
*/

-- First, ensure all existing numbers are formatted correctly
UPDATE leads 
SET phone = CASE 
  WHEN phone IS NULL THEN NULL
  WHEN phone LIKE '+%' THEN phone
  WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 10 THEN '+1' || REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
  WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 11 AND LEFT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1) = '1' THEN '+' || REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
  ELSE phone
END
WHERE phone IS NOT NULL;

-- Create function to format phone numbers to E.164
CREATE OR REPLACE FUNCTION format_phone_e164()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if phone is not null and doesn't already start with +
  IF NEW.phone IS NOT NULL AND NEW.phone NOT LIKE '+%' THEN
    -- Remove all non-digit characters
    DECLARE
      digits_only TEXT;
    BEGIN
      digits_only := REGEXP_REPLACE(NEW.phone, '[^0-9]', '', 'g');
      
      -- If 10 digits, assume US and add +1
      IF LENGTH(digits_only) = 10 THEN
        NEW.phone := '+1' || digits_only;
      -- If 11 digits starting with 1, add + prefix
      ELSIF LENGTH(digits_only) = 11 AND LEFT(digits_only, 1) = '1' THEN
        NEW.phone := '+' || digits_only;
      -- Otherwise, add +1 prefix (default to US)
      ELSE
        NEW.phone := '+1' || digits_only;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS format_phone_before_insert_or_update ON leads;

-- Create trigger to auto-format phone numbers
CREATE TRIGGER format_phone_before_insert_or_update
  BEFORE INSERT OR UPDATE OF phone ON leads
  FOR EACH ROW
  EXECUTE FUNCTION format_phone_e164();

-- Add check constraint to ensure E.164 format (starts with +)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_phone_e164_format'
  ) THEN
    ALTER TABLE leads 
    ADD CONSTRAINT leads_phone_e164_format 
    CHECK (phone IS NULL OR phone LIKE '+%');
  END IF;
END $$;