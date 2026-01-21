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

## ✅ Iteration 3 – Klart (AI-taggning + LinkedIn-fallback)
- [x] AI-taggning – Claude föreslår 2-4 taggar automatiskt baserat på innehåll
- [x] Tweaka taggar – Användaren kan justera AI-föreslagna taggar i alla vyer
- [x] Taggar i Sparat – Filtrera länkar baserat på taggar
- [x] LinkedIn-fallback – Manuell text-input när Jina.ai blockeras av LinkedIn
- [ ] Browser Extension (Chrome) – Flyttad till framtida iterationer (löser inte iPhone-problemet)

## 🔄 Iteration 4 (Planerad) – Smart länkar + Email-mottagning

### Smart länkhantering
- [ ] Auto-komplettera URL – Skriv "gp.se" → Sixten förstår och kompletterar till "https://gp.se"
- [ ] Fuzzy matching – Hantera "www.gp.se", "gp.se/artikel", etc.
- [ ] Validering – Kolla att URL:en är giltig innan analys

### Email till Sixten (MVP - Steg 1)
- [ ] SendGrid Inbound Parse – Setup för att ta emot mail
- [ ] Unik Sixten-email – Generera användar-specifik adress (t.ex. xyz@sixten.app)
- [ ] Email-parsing – Hitta alla URLs i mailets body + subject
- [ ] Auto-lägg till – Varje URL analyseras och hamnar i Inbox
- [ ] Dokumentation – Guide för Outlook-regel (vidarebefordran)

**Text-hantering (SENARE efter testning):**
- [ ] Besluta om mailets text ska: sparas som anteckning / användas för analys / visas separat
- [ ] Hantera mail med bara text (ingen URL)
- [ ] Hantera mail med flera URLs + text

### Teknisk stack
- SendGrid Inbound Parse (gratis upp till 100 mail/dag)
- Netlify Function för webhook
- Supabase för att spara användar-email-adresser

## 📋 Framtida iterationer

### Browser & Mobile
- [ ] Browser Extension (Chrome/Safari) – 1-klicks-spara från desktop-webbläsare
- [ ] iOS Share Extension – Spara från vilken app som helst på iPhone (LinkedIn, Twitter, Safari, etc.)
- [ ] iOS Shortcut – 2-klicks-lösning via iOS Shortcuts

### Övriga funktioner
- [ ] Smart länkhantering (titel → URL-sökning)
- [ ] Länkhistorik (kom ihåg kastade länkar)
- [ ] Sorteringsvy med swipe-gränssnitt
- [ ] AI-kostnadsvisning
- [ ] YouTube/Podcast-import
- [ ] Sökfunktion i Sparat
- [ ] Autentisering via Supabase Auth
- [ ] Veckans sammanfattning (AI-genererad)
- [ ] Delning av länkar
