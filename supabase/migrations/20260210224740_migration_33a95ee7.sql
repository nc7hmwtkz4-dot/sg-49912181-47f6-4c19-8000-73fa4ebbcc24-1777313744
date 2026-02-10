-- Add missing columns to user_coins to match application logic
ALTER TABLE user_coins 
ADD COLUMN IF NOT EXISTS coin_name text,
ADD COLUMN IF NOT EXISTS obverse_image_url text,
ADD COLUMN IF NOT EXISTS reverse_image_url text;

-- Rename grade column if needed or just accept 'grade'
-- The app uses 'sheldon_grade' in types but 'grade' in DB. I will map it in the service.