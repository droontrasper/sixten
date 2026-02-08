-- Migration 007: Skapa favorite_tags-tabell för återanvändbara favorittaggar

CREATE TABLE favorite_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_favorite_tag UNIQUE(user_id, tag_name)
);

CREATE INDEX idx_favorite_tags_user ON favorite_tags(user_id);
