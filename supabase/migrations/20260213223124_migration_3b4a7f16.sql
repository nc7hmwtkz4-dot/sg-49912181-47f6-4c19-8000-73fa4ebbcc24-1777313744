ALTER TABLE coins_reference 
RENAME COLUMN name TO coin_name;

ALTER TABLE coins_reference
ADD COLUMN obverse_image_url text,
ADD COLUMN reverse_image_url text;