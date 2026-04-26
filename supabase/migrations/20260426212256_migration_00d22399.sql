-- MIGRATION NUMIVAULT V2 - ÉTAPE 4/5
-- Améliorer user_sales : Ajouter shipping_cost et platform_fees
-- Pour calculer le profit NET réel (avec déduction de tous les frais)

-- 1. Ajouter les colonnes de frais
ALTER TABLE user_sales ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE user_sales ADD COLUMN IF NOT EXISTS platform_fees DECIMAL(10, 2) DEFAULT 0;

-- 2. Ajouter une colonne net_profit calculée automatiquement
ALTER TABLE user_sales ADD COLUMN IF NOT EXISTS net_profit DECIMAL(15, 2) 
  GENERATED ALWAYS AS (sale_price - purchase_price - shipping_cost - platform_fees) STORED;

-- 3. Documenter ces nouvelles colonnes
COMMENT ON COLUMN user_sales.shipping_cost IS 'Frais d''expédition (poste, recommandé, etc.)';
COMMENT ON COLUMN user_sales.platform_fees IS 'Frais de plateforme (commission Ricardo, eBay, etc.)';
COMMENT ON COLUMN user_sales.net_profit IS 'Profit NET réel = Prix vente - Prix achat - Frais port - Frais plateforme (calculé automatiquement)';

-- Afficher le résultat
SELECT 
  'Colonnes shipping_cost et platform_fees ajoutées à user_sales' as status,
  'net_profit calculé automatiquement pour le CRM' as feature,
  (SELECT COUNT(*) FROM user_sales) as total_ventes;