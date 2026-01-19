-- Sixten MVP: Databasschema för links-tabellen
-- Kör detta i Supabase SQL Editor

-- Skapa enum-typer (valfritt, vi använder text med check constraints istället för flexibilitet)

-- Skapa links-tabellen
CREATE TABLE IF NOT EXISTS links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'user_1',
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('artikel', 'video', 'podd')),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'active', 'later', 'done', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skapa index för snabbare queries
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
CREATE INDEX IF NOT EXISTS idx_links_user_status ON links(user_id, status);

-- Skapa en trigger för att automatiskt uppdatera updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_links_updated_at ON links;
CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - förberett för framtida autentisering
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Policy som tillåter allt för MVP (ingen autentisering än)
-- I produktion byt ut mot: auth.uid()::text = user_id
DROP POLICY IF EXISTS "Allow all for MVP" ON links;
CREATE POLICY "Allow all for MVP" ON links
  FOR ALL
  USING (true)
  WITH CHECK (true);
