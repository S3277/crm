-- =====================================================
-- Migration: Ajouter les statuts d'appel (called, interested, not_interested)
-- =====================================================

-- 1. Supprimer l'ancienne contrainte CHECK sur status
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 2. Ajouter la nouvelle contrainte CHECK avec tous les statuts
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN (
    'hot', 
    'warm', 
    'cold', 
    'uninterested', 
    'qualified', 
    'not_qualified',
    'called',
    'interested',
    'not_interested',
    'texted'
  ));

-- 3. Ajouter une colonne pour stocker la date du dernier appel (optionnel mais recommandé)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called_at TIMESTAMPTZ;

-- 4. Ajouter une colonne pour stocker la date du dernier SMS (optionnel)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_texted_at TIMESTAMPTZ;

-- Vérification : Afficher la nouvelle contrainte
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
  AND conname = 'leads_status_check';
