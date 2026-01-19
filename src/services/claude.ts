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
  "tidsuppskattning_minuter": nummer
}

Regler:
- "typ" ska vara "artikel" för textbaserat innehåll, "video" för YouTube/Vimeo etc, "podd" för podcasts/ljudinnehåll
- "tidsuppskattning_minuter" ska vara en rimlig uppskattning av hur lång tid det tar att konsumera innehållet
- För artiklar: uppskatta baserat på textlängd (ca 200 ord/minut)
- För video/podd: försök hitta längden i innehållet, annars uppskatta baserat på typ

Innehåll att analysera:
`

export async function analyzeContent(content: string): Promise<ClaudeAnalysis> {
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
            content: ANALYSIS_PROMPT + truncatedContent,
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

  return analysis
}
