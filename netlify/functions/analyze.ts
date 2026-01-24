/**
 * Netlify Function för Claude AI-analys.
 * Tar emot webbinnehåll eller bilder och returnerar titel, sammanfattning, typ och tidsuppskattning.
 *
 * Input-format:
 * - URL-analys: { type: 'url', data: 'innehåll från webbsidan' } eller { content: 'innehåll' } (bakåtkompatibelt)
 * - Bildanalys: { type: 'image', data: 'data:image/png;base64,...' }
 */
import type { Handler } from '@netlify/functions'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const TEXT_ANALYSIS_PROMPT = `Analysera följande innehåll och svara ENDAST med JSON (ingen annan text):

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

const IMAGE_ANALYSIS_PROMPT = `Analysera denna skärmdump och svara ENDAST med JSON (ingen annan text):

{
  "titel": "beskrivande titel för bilden/innehållet (max 60 tecken)",
  "sammanfattning": "2-3 meningar som beskriver vad bilden visar och extraherar all viktig text",
  "typ": "artikel",
  "tidsuppskattning_minuter": nummer,
  "taggar": ["tagg1", "tagg2", "tagg3"]
}

Regler:
- Extrahera all text som syns i bilden och inkludera den i sammanfattningen
- Om bilden är en skärmdump av en artikel/post, sammanfatta innehållet
- "tidsuppskattning_minuter" ska vara en uppskattning av hur lång tid det tar att läsa/förstå innehållet (vanligtvis 1-5 minuter för en skärmdump)
- "taggar" ska vara 2-4 relevanta taggar som beskriver innehållet
- Varje tagg ska vara 1-2 ord, kort och beskrivande
- Om bilden är oläslig eller inte innehåller text, svara med: {"error": "UNREADABLE_IMAGE"}`

interface ClaudeAnalysis {
  titel: string
  sammanfattning: string
  typ: 'artikel' | 'video' | 'podd'
  tidsuppskattning_minuter: number
  taggar?: string[]
  error?: string
}

type RequestBody =
  | { type: 'url'; data: string }
  | { type: 'image'; data: string }
  | { content: string } // Bakåtkompatibelt format

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

  let requestBody: RequestBody
  try {
    requestBody = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Ogiltig request.' }),
    }
  }

  // Avgör om det är bildanalys eller textanalys
  const isImageAnalysis = 'type' in requestBody && requestBody.type === 'image'

  let response: Response
  try {
    if (isImageAnalysis) {
      // Bildanalys med Claude Vision
      const imageData = requestBody.data

      // Validera och extrahera base64-data
      const match = imageData.match(/^data:(image\/[a-z]+);base64,(.+)$/i)
      if (!match) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, error: 'INVALID_IMAGE_FORMAT' }),
        }
      }

      const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      const base64Data = match[2]

      response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
                {
                  type: 'text',
                  text: IMAGE_ANALYSIS_PROMPT,
                },
              ],
            },
          ],
        }),
      })
    } else {
      // Textanalys (befintlig logik)
      let content: string
      if ('type' in requestBody && requestBody.type === 'url') {
        content = requestBody.data
      } else if ('content' in requestBody) {
        content = requestBody.content
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Inget innehåll att analysera.' }),
        }
      }

      if (!content) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Inget innehåll att analysera.' }),
        }
      }

      const truncatedContent = content.slice(0, 15000)

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
              content: TEXT_ANALYSIS_PROMPT + truncatedContent,
            },
          ],
        }),
      })
    }
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, error: 'API_ERROR' }),
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'API_ERROR' }),
      }
    }
    if (response.status === 429) {
      return {
        statusCode: 429,
        body: JSON.stringify({ success: false, error: 'API_ERROR' }),
      }
    }
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, error: 'API_ERROR' }),
    }
  }

  let data: { content?: { text?: string }[] }
  try {
    data = await response.json()
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, error: 'API_ERROR' }),
    }
  }

  const textContent = data.content?.[0]?.text

  if (!textContent) {
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, error: 'API_ERROR' }),
    }
  }

  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, error: 'API_ERROR' }),
    }
  }

  let analysis: ClaudeAnalysis
  try {
    analysis = JSON.parse(jsonMatch[0])
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, error: 'API_ERROR' }),
    }
  }

  // Kontrollera om Claude rapporterade att bilden var oläslig
  if (analysis.error === 'UNREADABLE_IMAGE') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: false, error: 'UNREADABLE_IMAGE' }),
    }
  }

  if (!analysis.titel || !analysis.sammanfattning || !analysis.typ || !analysis.tidsuppskattning_minuter) {
    return {
      statusCode: 502,
      body: JSON.stringify({ success: false, error: 'API_ERROR' }),
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

  // Returnera med success-flagga och content_type för bilder
  const isImageAnalysis = 'type' in requestBody && requestBody.type === 'image'

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      title: analysis.titel,
      summary: analysis.sammanfattning,
      tags: analysis.taggar,
      estimatedMinutes: analysis.tidsuppskattning_minuter,
      contentType: isImageAnalysis ? 'image' : analysis.typ,
      // Behåll också svenska fält för bakåtkompatibilitet
      titel: analysis.titel,
      sammanfattning: analysis.sammanfattning,
      taggar: analysis.taggar,
      typ: analysis.typ,
      tidsuppskattning_minuter: analysis.tidsuppskattning_minuter,
    }),
  }
}
