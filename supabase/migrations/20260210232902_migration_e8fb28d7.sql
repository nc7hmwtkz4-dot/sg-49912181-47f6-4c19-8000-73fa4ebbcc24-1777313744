-- Add sku and coin_name to user_sales for better historical tracking
ALTER TABLE user_sales
ADD COLUMN sku text,
ADD COLUMN coin_name text;