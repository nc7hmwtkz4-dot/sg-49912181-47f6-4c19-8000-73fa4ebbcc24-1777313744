-- Add metal prices columns to profiles table for manual price management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gold_price_chf_per_gram DECIMAL(10,2) DEFAULT 85.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS silver_price_chf_per_gram DECIMAL(10,2) DEFAULT 0.95;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platinum_price_chf_per_gram DECIMAL(10,2) DEFAULT 28.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prices_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();