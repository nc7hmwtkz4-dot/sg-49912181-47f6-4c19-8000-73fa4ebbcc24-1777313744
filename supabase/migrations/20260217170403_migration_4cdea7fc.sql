-- Create listings table
CREATE TABLE IF NOT EXISTS user_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id UUID NOT NULL REFERENCES user_coins(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  coin_name TEXT,
  listing_date DATE NOT NULL,
  platform TEXT NOT NULL,
  starting_price NUMERIC NOT NULL,
  reserve_price NUMERIC,
  current_bid NUMERIC,
  expected_end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_listings_user_id ON user_listings(user_id);
CREATE INDEX idx_user_listings_coin_id ON user_listings(coin_id);
CREATE INDEX idx_user_listings_active ON user_listings(is_active);

-- Enable RLS
ALTER TABLE user_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own listings"
  ON user_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings"
  ON user_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON user_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON user_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Add listing_id to user_coins to track active listings
ALTER TABLE user_coins ADD COLUMN listing_id UUID REFERENCES user_listings(id) ON DELETE SET NULL;
CREATE INDEX idx_user_coins_listing_id ON user_coins(listing_id);