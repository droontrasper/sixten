# Sixten Backlog

## ✅ MVP (Fas 1) – Klart
- [x] Klistra in länk + AI-analys (Jina.ai hämtar innehåll → Claude analyserar)
- [x] Fyra vyer: Inkorg, Aktiv lista, Senare, Sparat
- [x] "Vill du spara?"-dialog med tre val
- [x] Supabase-persistens (user_id förberett för fler användare)
- [x] UX-förbättringar: Dubblettskydd, klickbara titlar, ikoner på flikar, mjukare färger, auto-byt till Inkorg

## ✅ Städning – Klart
- [x] Felhantering för API-anrop (användarvänliga meddelanden)
- [x] JSDoc-kommentarer i alla filer
- [x] Konsekvent namngivning (svenska UI, engelska kod)

## ✅ Iteration 2 – Klart
- [x] Anteckningar på sparade länkar
- [x] Max 5 objekt / 90 min-begränsning i Aktiv lista
- [x] Deploy till Netlify (sixten-sorterare.netlify.app) med säker API-hantering
- [x] GitHub-repo uppsatt (privat)
- [x] Sixten-ikon (favicon + PWA)

## ✅ Iteration 3 – Klart (AI-taggning + Smart URL)
- [x] AI-taggning – Claude föreslår 2-4 taggar automatiskt baserat på innehåll
- [x] Tweaka taggar – Användaren kan justera AI-föreslagna taggar i alla vyer
- [x] Taggar i Sparat – Filtrera länkar baserat på taggar med filter-UI
- [x] LinkedIn-fallback – Manuell text-input när Jina.ai blockeras av LinkedIn
- [x] Smart URL – Auto-komplettering (skriv "gp.se" → "https://gp.se")

## 🔄 Iteration 4 – Bilduppladdning (Pågående)

### Frontend
- [x] Ny "Lägg till"-design: Ersätt textfält med två knappar
  - [x] Knapp 1: "🔗 Klistra in länk" (öppnar textfält)
  - [x] Knapp 2: "📸 Ladda upp bild" (öppnar filväljare)
- [x] Filväljare för bilder (PNG, JPEG, max 5MB)
- [x] Konvertera bild till base64
- [ ] Fallback-dialog vid URL-fel (tre val: text/bild/avbryt)
- [ ] Fallback-dialog vid bildanalys-fel (manuell input: titel, taggar)
- [ ] Visa bildminiatyr i alla vyer (Inkorg, Aktiv lista, Senare, Sparat)
- [ ] Klick på bild → öppna fullstorlek

### Backend
- [x] AI-bildanalys via Claude API (analyzeImage i claude.ts)
- [x] Extrahera text från skärmdump
- [x] Generera: titel, sammanfattning, taggar, uppskattad tid
- [ ] Hantera fel vid bildanalys

### Databas
- [x] Lägg till image_data-kolumn i links-tabellen (migration: 005_add_image_data.sql)
- [x] Spara base64-bild i databasen

**Utanför scope:** iOS Share Extension, Browser Extension, Email, Bulk-upload

## 📋 Framtida iterationer

### Mobilanvändning
- [ ] iOS Share Extension – Spara från vilken app som helst på iPhone (LinkedIn, Twitter, Safari, etc.)
- [ ] iOS Shortcut – 2-klicks-lösning via iOS Shortcuts (enklare alternativ)

### Email till Sixten (PAUSAD - kräver domän)
**Varför pausad:** Kräver egen domän för email-mottagning (SendGrid/Mailgun). För komplext för nuvarande fas.

**När vi återupptar:**
- [ ] Skaffa domän (sixten.app eller subdomain)
- [ ] SendGrid Inbound Parse setup
- [ ] Email-webhook implementation (grundkod finns i netlify/functions/email-webhook.ts)
- [ ] Databas för user_emails (migration finns: 004_add_user_emails.sql)
- [ ] Besluta om text-hantering (anteckningar/analys/separat visning)
- [ ] Outlook-regel dokumentation

### Browser & Desktop
- [ ] Browser Extension (Chrome/Safari) – 1-klicks-spara från desktop-webbläsare
- [ ] Desktop shortcut/bookmarklet

### Taggning - Förbättringar
- [ ] Egna fasta taggar (återanvändbara favorittaggar)
- [ ] Tagg-autocomplete
- [ ] Sökfunktion på taggar i Sparat
- [ ] Tagg-statistik
- [ ] Bulk-taggning
- [ ] Bättre färgdifferentiering (AI vs manuella taggar)
- [ ] Mer spacing mellan taggar och knappar
- [ ] Hover-effekter

### Övriga features
- [ ] Smart länkhantering (titel → URL-sökning)
- [ ] Länkhistorik (kom ihåg kastade länkar)
- [ ] Sorteringsvy med swipe-gränssnitt
- [ ] AI-kostnadsvisning
- [ ] YouTube/Podcast-import
- [ ] Sökfunktion i Sparat (fulltextsök)
- [ ] Autentisering via Supabase Auth
- [ ] Veckans sammanfattning (AI-genererad)
- [ ] Delning av länkar
