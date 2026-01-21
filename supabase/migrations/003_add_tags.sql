-- Migration: Lägg till tagg-funktionalitet
-- Iteration 3: AI-taggning

CREATE TABLE link_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  ai_suggested BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index för snabbare queries
CREATE INDEX idx_link_tags_link_id ON link_tags(link_id);
CREATE INDEX idx_link_tags_tag_name ON link_tags(tag_name);

-- Kommentar:
-- link_id kopplar till links-tabellen
-- tag_name är själva taggen (t.ex. "AI", "Machine Learning")
-- ai_suggested = true om Claude föreslog den, false om användaren la till manuellt
