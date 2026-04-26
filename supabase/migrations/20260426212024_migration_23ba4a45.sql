-- MIGRATION NUMIVAULT V2 - ÉTAPE 1/5
-- Enrichissement de coins_reference (Master Catalog)

-- Ajouter numista_id pour synchronisation API Numista
ALTER TABLE coins_reference 
ADD COLUMN IF NOT EXISTS numista_id INTEGER UNIQUE;

-- Ajouter year_issued pour l'année d'émission du modèle
ALTER TABLE coins_reference 
ADD COLUMN IF NOT EXISTS year_issued INTEGER;

-- Ajouter weight_net (poids de métal fin) calculé automatiquement
-- Note: PostgreSQL nécessite de recréer la colonne si elle existe déjà sans GENERATED
ALTER TABLE coins_reference 
ADD COLUMN IF NOT EXISTS weight_net NUMERIC GENERATED ALWAYS AS (weight * purity) STORED;

-- Créer un index sur numista_id pour les futures recherches API
CREATE INDEX IF NOT EXISTS idx_coins_reference_numista_id ON coins_reference(numista_id);

-- Commentaires pour documentation
COMMENT ON COLUMN coins_reference.numista_id IS 'ID de référence Numista pour synchronisation API (max 2000 requêtes/mois)';
COMMENT ON COLUMN coins_reference.weight_net IS 'Poids de métal fin en grammes (weight × purity) - Calculé automatiquement';
COMMENT ON COLUMN coins_reference.year_issued IS 'Année d''émission du modèle de pièce';