# SIXTEN MVP-SPECIFIKATION

## Projektöversikt

**Namn:** Sixten (Calm Queue)
**Syfte:** AI-assisterad innehållshantering som ger lugn istället för stress
**Målgrupp (MVP):** En användare (dig själv)

---

## MVP-Scope

### Vad vi bygger

1. **Klistra in länk** – Användaren klistrar in en URL
2. **AI-analys** – Appen hämtar innehåll och analyserar med Claude
3. **Inkorg** – Nya länkar visas här med AI-genererad info
4. **Aktiv lista** – Innehåll användaren vill konsumera (visas med tidsåtgång)
5. **Markera klar** – Tre knappar: "Klar", "Inte klar än", "Flytta till Senare"
6. **Persistens** – Data sparas i Supabase mellan sessioner

### Vad vi INTE bygger i MVP

- Sorteringsvy med swipe
- Sparat-vy med anteckningar
- Max 5 objekt / 90 min-begränsning
- Autentisering (men förberedd datastruktur)
- Teman/taggning
- Sökfunktion

---

## Användarflöde (MVP)

```
1. Användaren klistrar in URL
         ↓
2. Jina.ai hämtar sidans innehåll
         ↓
3. Claude API analyserar och returnerar:
   - Titel
   - Sammanfattning (2-3 meningar)
   - Typ (artikel/video/podd)
   - Tidsuppskattning i minuter
         ↓
4. Länken sparas i Supabase, visas i Inkorg
         ↓
5. Användaren flyttar till Aktiv lista
         ↓
6. Användaren konsumerar innehållet
         ↓
7. Användaren klickar:
   - "Klar" → Frågar "Vill du spara?" → Ja/Nej/Senare
   - "Inte klar än" → Ligger kvar
   - "Flytta till Senare" → Flyttas till Senare-listan
```

---

## Teknisk Stack

| Komponent | Teknologi |
|-----------|-----------|
| Frontend | React + Vite + TypeScript |
| Styling | (att besluta - förslag: Tailwind CSS) |
| Databas | Supabase |
| Hämta innehåll | Jina.ai Reader API |
| AI-analys | Claude API (Sonnet) |

---

## Databasstruktur (Supabase)

### Tabell: `links`

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| id | uuid | Primärnyckel |
| user_id | text | Förberett för fler användare (hårdkodat "user_1" i MVP) |
| url | text | Ursprunglig URL |
| title | text | Titel från AI-analys |
| summary | text | Sammanfattning från AI |
| content_type | text | "artikel" / "video" / "podd" |
| estimated_minutes | integer | Uppskattad tidsåtgång |
| status | text | "inbox" / "active" / "later" / "done" / "deleted" |
| created_at | timestamp | När länken sparades |
| updated_at | timestamp | Senast ändrad |

---

## API-Integrationer

### Jina.ai Reader

**Anrop:**
```
GET https://r.jina.ai/{URL}
```

**Returnerar:** Ren text från webbsidan

### Claude API

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Prompt (exempel):**
```
Analysera följande artikel och svara ENDAST med JSON:

{
  "titel": "artikelns titel",
  "sammanfattning": "2-3 meningar som beskriver innehållet",
  "typ": "artikel" | "video" | "podd",
  "tidsuppskattning_minuter": nummer
}

Artikeltext:
[TEXT FRÅN JINA.AI]
```

---

## Vyer i MVP

### 1. Huvudvy med Inkorg
- Inputfält för att klistra in URL
- Knapp "Lägg till"
- Lista med nya länkar (visar: titel, typ, tid, sammanfattning)
- Knapp per länk: "Lägg till i Aktiv lista"

### 2. Aktiv lista
- Lista med valda länkar
- Total tid visas (summa av alla)
- Per länk: titel, typ, tid
- Tre knappar: "Klar", "Inte klar än", "Flytta till Senare"

### 3. Senare
- Enkel lista med parkerade länkar
- Knapp: "Flytta till Aktiv lista"

### 4. Dialog: "Vill du spara?"
- Visas när användaren klickar "Klar"
- Tre val: "Ja, spara", "Nej, ta bort", "Flytta till Senare"

---

## Designprinciper

- **Lugnt och minimalistiskt** – Ingen visuell stress
- **Tydlig typografi** – Lätt att skanna
- **Mjuka färger** – Inget skrikigt
- **Generöst whitespace** – Andrum

---

## Nästa steg efter MVP

1. Sorteringsvy med swipe-gränssnitt
2. Sparat-vy med anteckningar och taggar
3. Max 5 / 90 min-begränsning i Aktiv lista
4. Autentisering via Supabase Auth
5. Sökfunktion i Sparat
6. Veckans sammanfattning (AI-genererad)

---

## Filstruktur (förslag)

```
sixten/
├── src/
│   ├── components/
│   │   ├── AddLink.tsx
│   │   ├── Inbox.tsx
│   │   ├── ActiveList.tsx
│   │   ├── Later.tsx
│   │   └── SaveDialog.tsx
│   ├── services/
│   │   ├── jina.ts
│   │   ├── claude.ts
│   │   └── supabase.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env
├── package.json
└── README.md
```

---

*Dokument skapat: Gunvor-PL, Projekt Sixten*
