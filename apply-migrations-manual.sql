-- =====================================================
-- Script pour appliquer toutes les migrations manquantes
-- À exécuter dans Supabase Studio > SQL Editor
-- =====================================================

-- Migration: Add updated_by column to triggers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'triggers' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE triggers ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Migration: Add lead_type and source_channel columns to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lead_type'
  ) THEN
    ALTER TABLE leads
    ADD COLUMN lead_type TEXT NOT NULL DEFAULT 'outbound'
      CHECK (lead_type IN ('inbound', 'outbound'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'source_channel'
  ) THEN
    ALTER TABLE leads
    ADD COLUMN source_channel TEXT
      CHECK (source_channel IN ('cold_call', 'inbound_call', 'web_form', 'email_campaign', 'manual', 'other'));
  END IF;
END $$;

-- Fix: Rendre la contrainte user_id nullable et recréer avec CASCADE
ALTER TABLE leads ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Debug: Vérifier l'état actuel des triggers
SELECT * FROM triggers;

-- Si aucun trigger n'existe, en créer un
INSERT INTO triggers (id, start_calling, start_qualifying)
VALUES ('00000000-0000-0000-0000-000000000001', false, false)
ON CONFLICT (id) DO NOTHING;

-- Vérifier les politiques RLS sur triggers
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'triggers';

-- Vérification: afficher les colonnes ajoutées
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('triggers', 'leads')
  AND column_name IN ('updated_by', 'lead_type', 'source_channel')
ORDER BY table_name, column_name;
