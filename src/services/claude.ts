/**
 * Claude AI-integration för innehållsanalys.
 * Anropar Netlify Function /api/analyze istället för Anthropic direkt.
 * API-nyckeln hålls säkert på servern.
 */
import type { ClaudeAnalysis } from '../types'

interface AnalyzeResponse {
  success: boolean
  titel?: string
  sammanfattning?: string
  typ?: 'artikel' | 'video' | 'podd'
  tidsuppskattning_minuter?: number
  taggar?: string[]
  error?: string
}

function mapResponse(data: AnalyzeResponse): ClaudeAnalysis {
  if (!data.success || !data.titel || !data.sammanfattning || !data.typ || !data.tidsuppskattning_minuter) {
    throw new Error('AI-analysen var ofullständig. Försök igen.')
  }

  return {
    titel: data.titel,
    sammanfattning: data.sammanfattning,
    typ: data.typ,
    tidsuppskattning_minuter: data.tidsuppskattning_minuter,
    taggar: data.taggar || [],
  }
}

function handleError(status: number, data: AnalyzeResponse): never {
  if (data.error === 'UNREADABLE_IMAGE') {
    throw new Error('UNREADABLE_IMAGE')
  }
  if (status === 429 || data.error === 'RATE_LIMIT') {
    throw new Error('För många förfrågningar. Vänta en stund och försök igen.')
  }
  if (status === 500 && data.error === 'API_AUTH_ERROR') {
    throw new Error('AI-tjänsten nekade åtkomst. Kontrollera API-nyckeln.')
  }
  if (status >= 500) {
    throw new Error('AI-tjänsten är tillfälligt otillgänglig. Försök igen senare.')
  }
  throw new Error('Kunde inte analysera innehållet. Försök igen.')
}

export async function analyzeContent(content: string, existingTags?: string[]): Promise<ClaudeAnalysis> {
  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'url', data: content, existingTags }),
    })
  } catch {
    throw new Error('Kunde inte ansluta till AI-tjänsten. Kontrollera din internetanslutning.')
  }

  let data: AnalyzeResponse
  try {
    data = await response.json()
  } catch {
    throw new Error('Fick ett oväntat svar från AI-tjänsten.')
  }

  if (!response.ok || !data.success) {
    handleError(response.status, data)
  }

  return mapResponse(data)
}

/**
 * Analyserar en bild via Netlify Function
 * @param imageData Base64-encoded bild med data URL prefix (data:image/xxx;base64,...)
 */
export async function analyzeImage(imageData: string, existingTags?: string[]): Promise<ClaudeAnalysis> {
  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'image', data: imageData, existingTags }),
    })
  } catch {
    throw new Error('Kunde inte ansluta till AI-tjänsten. Kontrollera din internetanslutning.')
  }

  let data: AnalyzeResponse
  try {
    data = await response.json()
  } catch {
    throw new Error('Fick ett oväntat svar från AI-tjänsten.')
  }

  if (!response.ok || !data.success) {
    handleError(response.status, data)
  }

  return mapResponse(data)
}
