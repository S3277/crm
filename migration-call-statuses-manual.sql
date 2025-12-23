-- =====================================================
-- Script de migration MANUEL pour Supabase Studio
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- =====================================================

-- ÉTAPE 1 : Supprimer l'ancienne contrainte CHECK
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- ÉTAPE 2 : Ajouter la nouvelle contrainte avec tous les statuts
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

-- ÉTAPE 3 : Ajouter colonnes de tracking (optionnel mais utile pour Make.com)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_called_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_texted_at TIMESTAMPTZ;

-- ÉTAPE 4 : Ajouter une colonne metadata si elle n'existe pas (pour stocker called/texted flags)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ÉTAPE 5 : Vérifier que tout fonctionne
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
  AND conname = 'leads_status_check';

-- Test : Essayer d'insérer un lead avec status 'called'
-- INSERT INTO leads (name, phone, status, lead_type) 
-- VALUES ('Test Lead', '+33612345678', 'called', 'outbound');

-- Si ça marche, tu verras le lead avec status 'called' ✅
