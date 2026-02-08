/**
 * Claude AI-integration för innehållsanalys.
 * Analyserar webbinnehåll och returnerar titel, sammanfattning, typ och tidsuppskattning.
 */
import type { ClaudeAnalysis } from '../types'

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
- Exempel på taggar: "ai", "machine learning", "business", "tutorial", "research", "produktivitet", "programmering"
- Alla taggar ska vara i gemener (lowercase)

Innehåll att analysera:
`

function buildAnalysisPrompt(existingTags?: string[]): string {
  if (existingTags && existingTags.length > 0) {
    return ANALYSIS_PROMPT.replace(
      'Innehåll att analysera:\n',
      `Befintliga taggar som användaren redan har: [${existingTags.join(', ')}]\nFörsök återanvända dessa taggar om de passar. Skapa nya taggar bara om ingen befintlig passar.\n\nInnehåll att analysera:\n`
    )
  }
  return ANALYSIS_PROMPT
}

export async function analyzeContent(content: string, existingTags?: string[]): Promise<ClaudeAnalysis> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('AI-analys är inte konfigurerad. Kontakta administratören.')
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
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: buildAnalysisPrompt(existingTags) + truncatedContent,
          },
        ],
      }),
    })
  } catch {
    throw new Error('Kunde inte ansluta till AI-tjänsten. Kontrollera din internetanslutning.')
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('AI-tjänsten nekade åtkomst. Kontrollera API-nyckeln.')
    }
    if (response.status === 429) {
      throw new Error('För många förfrågningar. Vänta en stund och försök igen.')
    }
    if (response.status >= 500) {
      throw new Error('AI-tjänsten är tillfälligt otillgänglig. Försök igen senare.')
    }
    throw new Error('Kunde inte analysera innehållet. Försök igen.')
  }

  let data: { content?: { text?: string }[] }
  try {
    data = await response.json()
  } catch {
    throw new Error('Fick ett oväntat svar från AI-tjänsten.')
  }

  const textContent = data.content?.[0]?.text

  if (!textContent) {
    throw new Error('AI-tjänsten returnerade ett tomt svar.')
  }

  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Kunde inte tolka AI-svaret. Försök igen.')
  }

  let analysis: ClaudeAnalysis
  try {
    analysis = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Kunde inte tolka AI-svaret. Försök igen.')
  }

  if (!analysis.titel || !analysis.sammanfattning || !analysis.typ || !analysis.tidsuppskattning_minuter) {
    throw new Error('AI-analysen var ofullständig. Försök igen.')
  }

  if (!['artikel', 'video', 'podd'].includes(analysis.typ)) {
    analysis.typ = 'artikel'
  }

  analysis.tidsuppskattning_minuter = Math.max(1, Math.round(analysis.tidsuppskattning_minuter))

  // Validera taggar - säkerställ att det är en array med 2-4 strängar, normalisera till gemener
  if (!Array.isArray(analysis.taggar)) {
    analysis.taggar = []
  } else {
    analysis.taggar = analysis.taggar
      .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.toLowerCase())
      .slice(0, 4)
  }

  return analysis
}

const IMAGE_ANALYSIS_PROMPT = `Analysera följande bild och svara ENDAST med JSON (ingen annan text):

{
  "titel": "beskrivande titel för bilden/innehållet",
  "sammanfattning": "2-3 meningar som beskriver vad bilden visar",
  "typ": "artikel",
  "tidsuppskattning_minuter": nummer,
  "taggar": ["tagg1", "tagg2", "tagg3"]
}

Regler:
- Extrahera all text som syns i bilden och inkludera den i sammanfattningen
- Om bilden är en skärmdump av en artikel/post, sammanfatta innehållet
- "tidsuppskattning_minuter" ska vara en uppskattning av hur lång tid det tar att läsa/förstå innehållet
- "taggar" ska vara 2-4 relevanta taggar som beskriver innehållet
- Varje tagg ska vara 1-2 ord, kort och beskrivande
- Alla taggar ska vara i gemener (lowercase)`

function buildImagePrompt(existingTags?: string[]): string {
  if (existingTags && existingTags.length > 0) {
    return IMAGE_ANALYSIS_PROMPT + `\n\nBefintliga taggar som användaren redan har: [${existingTags.join(', ')}]\nFörsök återanvända dessa taggar om de passar. Skapa nya taggar bara om ingen befintlig passar.`
  }
  return IMAGE_ANALYSIS_PROMPT
}

/**
 * Analyserar en bild med Claude Vision API
 * @param imageData Base64-encoded bild med data URL prefix (data:image/xxx;base64,...)
 */
export async function analyzeImage(imageData: string, existingTags?: string[]): Promise<ClaudeAnalysis> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('AI-analys är inte konfigurerad. Kontakta administratören.')
  }

  // Extrahera mediatyp och base64-data från data URL
  const match = imageData.match(/^data:(image\/[a-z]+);base64,(.+)$/i)
  if (!match) {
    throw new Error('Ogiltig bildformat. Endast PNG och JPEG stöds.')
  }

  const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  const base64Data = match[2]

  let response: Response
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
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
                text: buildImagePrompt(existingTags),
              },
            ],
          },
        ],
      }),
    })
  } catch {
    throw new Error('Kunde inte ansluta till AI-tjänsten. Kontrollera din internetanslutning.')
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('AI-tjänsten nekade åtkomst. Kontrollera API-nyckeln.')
    }
    if (response.status === 429) {
      throw new Error('För många förfrågningar. Vänta en stund och försök igen.')
    }
    if (response.status >= 500) {
      throw new Error('AI-tjänsten är tillfälligt otillgänglig. Försök igen senare.')
    }
    throw new Error('Kunde inte analysera bilden. Försök igen.')
  }

  let data: { content?: { text?: string }[] }
  try {
    data = await response.json()
  } catch {
    throw new Error('Fick ett oväntat svar från AI-tjänsten.')
  }

  const textContent = data.content?.[0]?.text

  if (!textContent) {
    throw new Error('AI-tjänsten returnerade ett tomt svar.')
  }

  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Kunde inte tolka AI-svaret. Försök igen.')
  }

  let analysis: ClaudeAnalysis
  try {
    analysis = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Kunde inte tolka AI-svaret. Försök igen.')
  }

  if (!analysis.titel || !analysis.sammanfattning || !analysis.typ || !analysis.tidsuppskattning_minuter) {
    throw new Error('AI-analysen var ofullständig. Försök igen.')
  }

  if (!['artikel', 'video', 'podd'].includes(analysis.typ)) {
    analysis.typ = 'artikel'
  }

  analysis.tidsuppskattning_minuter = Math.max(1, Math.round(analysis.tidsuppskattning_minuter))

  if (!Array.isArray(analysis.taggar)) {
    analysis.taggar = []
  } else {
    analysis.taggar = analysis.taggar
      .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.toLowerCase())
      .slice(0, 4)
  }

  return analysis
}
