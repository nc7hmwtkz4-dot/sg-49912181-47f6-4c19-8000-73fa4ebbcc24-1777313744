-- Create buyers table
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  postcode TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own buyers" ON buyers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own buyers" ON buyers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own buyers" ON buyers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own buyers" ON buyers FOR DELETE USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_buyers_name ON buyers(last_name, first_name);

-- Add buyer_id column to user_sales
ALTER TABLE user_sales ADD COLUMN buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL;

-- Add index for buyer_id
CREATE INDEX idx_user_sales_buyer_id ON user_sales(buyer_id);