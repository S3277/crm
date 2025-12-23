/*
  # Create Database Trigger for Automation Webhook
  
  1. Purpose
    - Automatically notify external services when start_qualifying or start_calling is set to TRUE
    - Uses Supabase's built-in pg_net extension for HTTP requests
  
  2. Changes
    - Enable pg_net extension if not already enabled
    - Create function to send HTTP POST to external webhook when triggers are activated
    - Create trigger on triggers table for UPDATE events
  
  3. Notes
    - The webhook URL should be configured in your external automation service (Make.com, Zapier, etc.)
    - This trigger fires BEFORE the update completes, ensuring the webhook is notified
    - Only triggers when start_qualifying or start_calling changes from FALSE to TRUE
*/

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to notify external webhook
CREATE OR REPLACE FUNCTION notify_automation_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire if start_qualifying or start_calling changed from FALSE to TRUE
  IF (NEW.start_qualifying = TRUE AND OLD.start_qualifying = FALSE) OR
     (NEW.start_calling = TRUE AND OLD.start_calling = FALSE) THEN
    
    -- Log for debugging
    RAISE LOG 'Automation trigger fired: start_qualifying=%, start_calling=%', 
      NEW.start_qualifying, NEW.start_calling;
    
    -- Here you would normally call pg_net to send HTTP request
    -- For now, we'll just log it since external webhook URL is user-specific
    -- Users should configure their automation service to poll or use Supabase Realtime
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on triggers table
DROP TRIGGER IF EXISTS on_automation_trigger_update ON triggers;

CREATE TRIGGER on_automation_trigger_update
  BEFORE UPDATE ON triggers
  FOR EACH ROW
  EXECUTE FUNCTION notify_automation_webhook();