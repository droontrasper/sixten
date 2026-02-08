-- Migration 008: Normalisera taggar till gemener
-- Alla taggar sparas som lowercase, visas med CSS capitalize i UI

-- Steg 1: Ta bort dubbletter som uppstår vid normalisering
-- Behåll den äldsta taggen per (link_id, lowercase tag_name)
DELETE FROM link_tags
WHERE id NOT IN (
  SELECT DISTINCT ON (link_id, LOWER(tag_name)) id
  FROM link_tags
  ORDER BY link_id, LOWER(tag_name), created_at ASC
);

-- Steg 2: Normalisera alla kvarvarande taggar
UPDATE link_tags SET tag_name = LOWER(tag_name);

-- Steg 3: Normalisera favorittaggar - ta bort dubbletter först
DELETE FROM favorite_tags
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, LOWER(tag_name)) id
  FROM favorite_tags
  ORDER BY user_id, LOWER(tag_name), created_at ASC
);

-- Steg 4: Normalisera kvarvarande favorittaggar
UPDATE favorite_tags SET tag_name = LOWER(tag_name);
