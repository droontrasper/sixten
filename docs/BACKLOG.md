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

## ✅ Iteration 4 – Bilduppladdning (Klart)

### Frontend
- [x] Ny "Lägg till"-design: Ersätt textfält med två knappar
  - [x] Knapp 1: "🔗 Klistra in länk" (öppnar textfält)
  - [x] Knapp 2: "📸 Ladda upp bild" (öppnar filväljare)
- [x] Filväljare för bilder (PNG, JPEG, max 5MB)
- [x] Konvertera bild till base64
- [x] Fallback-dialog vid URL-fel (tre val: text/bild/avbryt) – LinkedIn-prompt med 3 knappar
- [x] Fallback-dialog vid bildanalys-fel (manuell input: titel, taggar)
- [x] Visa bildminiatyr i alla vyer (Inkorg, Aktiv lista, Senare, Sparat) – via LinkCard
- [x] Klick på bild → öppna fullstorlek – ImageModal-komponent
- [x] Landing-sida – ny startsida med logga, snabbåtkomst till Sortering/Aktiv lista

### Backend
- [x] AI-bildanalys via Claude API (analyzeImage i claude.ts)
- [x] Extrahera text från skärmdump
- [x] Generera: titel, sammanfattning, taggar, uppskattad tid
- [x] Hantera fel vid bildanalys – triggar fallback-dialog med manuell input

### Databas
- [x] Lägg till image_data-kolumn i links-tabellen (migration: 005_add_image_data.sql)
- [x] Spara base64-bild i databasen

**Utanför scope:** iOS Share Extension, Browser Extension, Email, Bulk-upload

## ✅ Iteration 5 – Jina-fallback + Tagg-autocomplete (Klart)

### Jina.ai-fallback (inkl. manual content)
- [x] Fallback-dialog när Jina.ai inte kan läsa en länk (DNS-fel, paywall, etc.)
- [x] Tre val: "Spara ändå utan AI-analys" / "Klistra in text manuellt" / "Avbryt"
- [x] Manual content-stöd – ny `manual_content`-kolumn i databasen
- [x] Visning av manuell text i LinkCard (blå bakgrund)
- [x] Bättre feldetektering (DNS-fel, timeout, etc.)

### Tagg-autocomplete
- [x] Dropdown med befintliga taggar vid skrivning
- [x] Filtrera matchande taggar (max 5 förslag)
- [x] Välj med klick eller Enter, stäng med Escape

### Databas
- [x] Migration 006: Lägg till `manual_content`-kolumn i links-tabellen

---

## 📋 Featurelista (prioriterad)

| # | Feature | Insats | Beskrivning |
|---|---------|--------|-------------|
| 1 | Statistik | Liten | Tre siffror: inlagda/vecka, klara/vecka, totalt |
| 2 | ~~Jina.ai-fallback~~ | ~~Liten~~ | ~~Spara länk utan AI-analys till Inkorg~~ ✅ Iteration 5 |
| 3 | Email intake | Medel | Mail till inbox@rasper.se → Claude-analys → Inkorg |
| 4 | Egna fasta taggar | Liten | Återanvändbara favorittaggar |
| 5 | ~~Tagg-autocomplete~~ | ~~Liten~~ | ~~Föreslå befintliga taggar medan du skriver~~ ✅ Iteration 5 |
| 6 | Länkhistorik | Liten | Kom ihåg kastade länkar |
| 7 | UX-polish | Liten | Bättre spacing, hover-effekter, färger |

### Email intake — beslut
- **Adress:** inbox@rasper.se (eller valfritt prefix)
- **Teknik:** Cloudflare Email Routing (gratis) → Netlify webhook → Claude-analys → Inkorg
- **Innehåll:** Mailtexten i sig är innehållet (nyhetsbrev, mail från kollegor, egna texter)
- **Visning:** Som vanligt kort med titel, sammanfattning, tidsgissning, taggar
- **Grundkod finns redan** i projektet (webhook + migration)
- **Kostnad:** 0 kr (domän finns)

### Övriga idéer (oprioriterade)
- [ ] iOS Share Extension / iOS Shortcut
- [ ] Browser Extension (Chrome/Safari)
- [ ] YouTube/Podcast-import
- [ ] Sökfunktion i Sparat (fulltextsök)
- [ ] Autentisering via Supabase Auth
- [ ] AI-kostnadsvisning
- [ ] Veckans sammanfattning (AI-genererad)
