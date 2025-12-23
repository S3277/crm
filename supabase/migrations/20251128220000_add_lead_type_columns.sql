-- Add lead_type and source_channel columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'outbound'
  CHECK (lead_type IN ('inbound', 'outbound'));

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source_channel TEXT
  CHECK (source_channel IN ('cold_call', 'inbound_call', 'web_form', 'email_campaign', 'manual', 'other'));
