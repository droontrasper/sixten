-- Migration: Lägg till user email-adresser för email-integration
-- Iteration 4

CREATE TABLE user_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  email_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_emails_user_id ON user_emails(user_id);
CREATE INDEX idx_user_emails_email ON user_emails(email_address);

COMMENT ON TABLE user_emails IS 'Unika email-adresser för varje användare att skicka länkar till';

-- Lägg till default email för user_1 (för testning)
-- I produktion genereras en unik hash per användare
INSERT INTO user_emails (user_id, email_address)
VALUES ('user_1', 'user1-test@parse.sixten.app');
