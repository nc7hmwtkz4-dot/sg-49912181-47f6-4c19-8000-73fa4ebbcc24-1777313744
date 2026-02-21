-- Create spot prices cache table
CREATE TABLE IF NOT EXISTS spot_prices_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gold DECIMAL(10, 2) NOT NULL,
  silver DECIMAL(10, 2) NOT NULL,
  platinum DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_spot_prices_cache_timestamp ON spot_prices_cache(timestamp DESC);

-- Enable RLS
ALTER TABLE spot_prices_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached prices
CREATE POLICY "Anyone can view cached spot prices" ON spot_prices_cache FOR SELECT USING (true);

-- Only allow API to insert new prices (no auth check for server-side API)
CREATE POLICY "API can insert spot prices" ON spot_prices_cache FOR INSERT WITH CHECK (true);