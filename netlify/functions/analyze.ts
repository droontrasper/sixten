/**
 * Netlify Function för Claude AI-analys.
 * Tar emot webbinnehåll och returnerar titel, sammanfattning, typ och tidsuppskattning.
 */
import type { Handler } from '@netlify/functions'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const ANALYSIS_PROMPT = `Analysera följande innehåll och svara ENDAST med JSON (ingen annan text):

{
  "titel": "innehållets titel",
  "sammanfattning": "2-3 meningar som beskriver innehållet",
  "typ": "artikel" | "video" | "podd",
  "tidsuppskattning_minuter": nummer,
  "taggar": ["tagg1", "tagg2", "tagg3"]
}

Regler:
- "typ" ska vara "artikel" för textbaserat innehåll, "video" för YouTube/Vimeo etc, "podd" för podcasts/ljudinnehåll
- "tidsuppskattning_minuter" ska vara en rimlig uppskattning av hur lång tid det tar att konsumera innehållet
- För artiklar: uppskatta baserat på textlängd (ca 200 ord/minut)
- För video/podd: försök hitta längden i innehållet, annars uppskatta baserat på typ
- "taggar" ska vara 2-4 relevanta taggar som beskriver innehållet
- Varje tagg ska vara 1-2 ord, kort och beskrivande
- Exempel på taggar: "AI", "Machine Learning", "Business", "Tutorial", "Research", "Produktivitet", "Programmering"

Innehåll att analysera:
`

interface ClaudeAnalysis {
  titel: string
  sammanfattning: string
  typ: 'artikel' | 'video' | 'podd'
  tidsuppskattning_minuter: number
  taggar?: string[]
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AI-analys är inte konfigurerad.' }),
    }
  }

  let content: string
  try {
    const body = JSON.parse(event.body || '{}')
    content = body.content
    if (!content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Inget innehåll att analysera.' }),
      }
    }
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Ogiltig request.' }),
    }
  }

  const truncatedContent = content.slice(0, 15000)

  let response: Response
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: ANALYSIS_PROMPT + truncatedContent,
          },
        ],
      }),
    })
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Kunde inte ansluta till AI-tjänsten.' }),
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI-tjänsten nekade åtkomst.' }),
      }
    }
    if (response.status === 429) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'För många förfrågningar. Vänta en stund.' }),
      }
    }
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'AI-tjänsten svarade med ett fel.' }),
    }
  }

  let data: { content?: { text?: string }[] }
  try {
    data = await response.json()
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Fick ett oväntat svar från AI-tjänsten.' }),
    }
  }

  const textContent = data.content?.[0]?.text

  if (!textContent) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'AI-tjänsten returnerade ett tomt svar.' }),
    }
  }

  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Kunde inte tolka AI-svaret.' }),
    }
  }

  let analysis: ClaudeAnalysis
  try {
    analysis = JSON.parse(jsonMatch[0])
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Kunde inte tolka AI-svaret.' }),
    }
  }

  if (!analysis.titel || !analysis.sammanfattning || !analysis.typ || !analysis.tidsuppskattning_minuter) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'AI-analysen var ofullständig.' }),
    }
  }

  if (!['artikel', 'video', 'podd'].includes(analysis.typ)) {
    analysis.typ = 'artikel'
  }

  analysis.tidsuppskattning_minuter = Math.max(1, Math.round(analysis.tidsuppskattning_minuter))

  // Validera taggar - säkerställ att det är en array med 2-4 strängar
  if (!Array.isArray(analysis.taggar)) {
    analysis.taggar = []
  } else {
    analysis.taggar = analysis.taggar
      .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      .slice(0, 4)
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(analysis),
  }
}
