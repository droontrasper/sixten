-- Migration: Lägg till image_data-kolumn för bilduppladdningar
-- Iteration 4

ALTER TABLE links ADD COLUMN IF NOT EXISTS image_data TEXT;

COMMENT ON COLUMN links.image_data IS 'Base64-encoded bilddata för uppladdade bilder';
