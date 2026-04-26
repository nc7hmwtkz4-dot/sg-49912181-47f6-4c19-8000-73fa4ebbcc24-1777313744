-- MIGRATION NUMIVAULT V2 - ÉTAPE 3/5
-- Alléger user_coins : Supprimer les colonnes redondantes
-- Ces données viennent maintenant de coins_reference via reference_coin_id

-- 1. Supprimer les colonnes qui dupliquent les données du master catalog
ALTER TABLE user_coins DROP COLUMN IF EXISTS metal;
ALTER TABLE user_coins DROP COLUMN IF EXISTS purity;
ALTER TABLE user_coins DROP COLUMN IF EXISTS weight;
ALTER TABLE user_coins DROP COLUMN IF EXISTS km_number;

-- 2. Renforcer la contrainte sur reference_coin_id (obligatoire)
ALTER TABLE user_coins ALTER COLUMN reference_coin_id SET NOT NULL;

-- 3. Ajouter un commentaire pour documenter la nouvelle architecture
COMMENT ON COLUMN user_coins.reference_coin_id IS 'Lien obligatoire vers coins_reference (Master Catalog). Toutes les données immuables (métal, poids, pureté) viennent de cette référence.';

-- Afficher le résultat
SELECT 
  'Colonnes redondantes supprimées de user_coins' as status,
  'reference_coin_id maintenant obligatoire (NOT NULL)' as contrainte,
  (SELECT COUNT(*) FROM user_coins) as total_pieces_inventaire;