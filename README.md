# Sixten

**Din lugna innehållskö** - en minimalistisk app för att samla, sortera och spara innehåll du vill konsumera senare.

## Funktioner

### Spara innehåll
- **Klistra in länk** - URL:er analyseras automatiskt med AI (Claude)
- **Ladda upp bild** - Skärmdumpar analyseras och sparas med AI-genererad titel
- **LinkedIn-stöd** - Manuell text-input eller bilduppladdning för inloggningsskyddade inlägg
- **Jina.ai-fallback** - Spara länk utan AI-analys eller klistra in text manuellt när hämtning misslyckas
- **Smart URL** - Skriv bara `gp.se` så läggs `https://` till automatiskt

### Fyra vyer
1. **Inkorg** - Nya länkar som väntar på sortering
2. **Aktiv lista** - Max 5 länkar / 90 min för fokuserat konsumerande
3. **Senare** - Parkera länkar för framtiden
4. **Sparat** - Arkiv med anteckningar och taggar

### AI-funktioner (Claude)
- Automatisk titel och sammanfattning
- Tidsuppskattning baserat på innehåll
- AI-föreslagna taggar (2-4 st per länk)
- Bildanalys med textigenkänning
- AI återanvänder befintliga taggar för konsekvens

### Tagghantering
- Tagg-autocomplete med befintliga taggar
- Favorittaggar (stjärnmarkerade) visas först
- Taggar normaliseras automatiskt till gemener
- Taggfiltrering i alla vyer

### Övrigt
- Landing-sida med Sixten-logga och veckostatistik
- Dubblettskydd
- PWA-stöd (installera på mobil)
- Error Boundary förhindrar blank sida vid krasch
- Debounce-skydd mot dubbel-submit

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Netlify Functions
- **Databas**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **Innehållshämtning**: Jina.ai Reader

## Lokal utveckling

```bash
# Installera beroenden
npm install

# Starta dev-server
npm run dev

# Bygg för produktion
npm run build
```

### Miljövariabler

**Frontend** (`.env.local`):
```env
VITE_SUPABASE_URL=din-supabase-url
VITE_SUPABASE_ANON_KEY=din-anon-key
```

**Server** (Netlify Dashboard → Environment Variables):
```env
ANTHROPIC_API_KEY=din-claude-api-nyckel
JINA_API_KEY=din-jina-api-nyckel
```

## Projektstruktur

```
src/
├── components/     # React-komponenter
│   ├── AddLink.tsx       # Formulär för att lägga till länkar/bilder
│   ├── Landing.tsx       # Startsida
│   ├── Inbox.tsx         # Inkorg-vy
│   ├── ActiveList.tsx    # Aktiv lista-vy
│   ├── Later.tsx         # Senare-vy
│   ├── Saved.tsx         # Sparat-vy
│   ├── LinkCard.tsx      # Återanvändbar länkkomponent
│   ├── ImageModal.tsx    # Fullskärmsvisning av bilder
│   ├── TagEditor.tsx     # Tagg-hantering med autocomplete
│   ├── TagFilter.tsx     # Taggfilter
│   ├── StatsBar.tsx      # Veckostatistik
│   ├── ErrorBoundary.tsx # Felhantering vid krasch
│   └── SaveDialog.tsx    # "Vill du spara?"-dialog
├── services/       # API-integrationer (proxar via Netlify Functions)
│   ├── supabase.ts       # Databasoperationer
│   ├── claude.ts         # AI-analys via /api/analyze
│   └── jina.ts           # Innehållshämtning via /api/fetch-content
├── types/          # TypeScript-typer
└── App.tsx         # Huvudkomponent

netlify/
└── functions/      # Serverless-funktioner (API-nycklar hålls här)
    ├── analyze.ts        # Claude API-proxy
    └── fetch-content.ts  # Jina Reader-proxy

docs/
└── BACKLOG.md      # Projektbacklog och roadmap
```

## Deploy

Appen körs på **[sixten-sorterare.netlify.app](https://sixten-sorterare.netlify.app)** och är konfigurerad för Netlify:
- Bygg-kommando: `npm run build`
- Publiceringsmapp: `dist`
- Functions: `netlify/functions`
- Automatisk deploy vid push till `main`

## Licens

Privat projekt.
