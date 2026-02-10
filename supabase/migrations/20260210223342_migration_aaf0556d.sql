-- ============================================
-- COINS REFERENCE TABLE (Shared Database)
-- ============================================
-- This table contains coin definitions that all users can reference
-- to speed up data entry

CREATE TABLE IF NOT EXISTS coins_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL,
  km_number TEXT NOT NULL,
  name TEXT,
  description TEXT,
  metal TEXT NOT NULL,
  purity NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  diameter NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE coins_reference ENABLE ROW LEVEL SECURITY;

-- Everyone can view reference coins
CREATE POLICY "Anyone can view reference coins"
ON coins_reference FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert reference coins
CREATE POLICY "Authenticated users can insert reference coins"
ON coins_reference FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own reference coins
CREATE POLICY "Users can update their own reference coins"
ON coins_reference FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Users can delete their own reference coins
CREATE POLICY "Users can delete their own reference coins"
ON coins_reference FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Create index for faster SKU lookups
CREATE INDEX idx_coins_reference_sku ON coins_reference(sku);
CREATE INDEX idx_coins_reference_country ON coins_reference(country_code);

-- ============================================
-- USER COINS TABLE (Private Collections)
-- ============================================
-- This table contains individual coin instances in user collections

CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_coin_id UUID REFERENCES coins_reference(id) ON DELETE SET NULL,
  
  -- Coin identification
  sku TEXT NOT NULL,
  country_code TEXT NOT NULL,
  km_number TEXT NOT NULL,
  
  -- Coin details
  year INTEGER NOT NULL,
  mintmark TEXT,
  metal TEXT NOT NULL,
  purity NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  grade TEXT NOT NULL,
  
  -- Financial data
  purchase_price NUMERIC NOT NULL,
  purchase_date DATE NOT NULL,
  notes TEXT,
  
  -- Status
  is_sold BOOLEAN DEFAULT FALSE,
  
  -- Media
  image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;

-- Users can only view their own coins
CREATE POLICY "Users can view their own coins"
ON user_coins FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own coins
CREATE POLICY "Users can insert their own coins"
ON user_coins FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own coins
CREATE POLICY "Users can update their own coins"
ON user_coins FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own coins
CREATE POLICY "Users can delete their own coins"
ON user_coins FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_user_coins_user_id ON user_coins(user_id);
CREATE INDEX idx_user_coins_sku ON user_coins(sku);
CREATE INDEX idx_user_coins_is_sold ON user_coins(is_sold);
CREATE INDEX idx_user_coins_reference ON user_coins(reference_coin_id);

-- ============================================
-- USER SALES TABLE (Private Sales Records)
-- ============================================
-- This table tracks sales of coins from user collections

CREATE TABLE IF NOT EXISTS user_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id UUID NOT NULL REFERENCES user_coins(id) ON DELETE CASCADE,
  
  -- Sale details
  sale_date DATE NOT NULL,
  sale_price NUMERIC NOT NULL,
  buyer_info TEXT,
  notes TEXT,
  
  -- Calculated fields (denormalized for performance)
  purchase_price NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  markup_percentage NUMERIC NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_sales ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sales
CREATE POLICY "Users can view their own sales"
ON user_sales FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sales
CREATE POLICY "Users can insert their own sales"
ON user_sales FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sales
CREATE POLICY "Users can update their own sales"
ON user_sales FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own sales
CREATE POLICY "Users can delete their own sales"
ON user_sales FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_sales_user_id ON user_sales(user_id);
CREATE INDEX idx_user_sales_coin_id ON user_sales(coin_id);
CREATE INDEX idx_user_sales_date ON user_sales(sale_date);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coins_reference_updated_at BEFORE UPDATE ON coins_reference
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_coins_updated_at BEFORE UPDATE ON user_coins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sales_updated_at BEFORE UPDATE ON user_sales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();