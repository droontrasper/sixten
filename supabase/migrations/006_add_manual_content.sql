-- Lägg till manual_content-fältet för att spara användarens manuella text
ALTER TABLE links ADD COLUMN manual_content TEXT;
