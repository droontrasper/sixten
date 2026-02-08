/**
 * Jina Reader-integration för att hämta webbinnehåll.
 * Konverterar webbsidor till ren text för AI-analys.
 */

const JINA_READER_URL = 'https://r.jina.ai/'

export interface JinaResponse {
  content: string
  url: string
}

export async function fetchPageContent(url: string): Promise<JinaResponse> {
  const apiKey = import.meta.env.VITE_JINA_API_KEY

  const headers: Record<string, string> = {
    'Accept': 'text/plain',
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  let response: Response
  try {
    response = await fetch(`${JINA_READER_URL}${encodeURIComponent(url)}`, {
      method: 'GET',
      headers,
    })
  } catch {
    throw new Error('Kunde inte ansluta till servern. Kontrollera din internetanslutning.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Sidan kunde inte hittas. Kontrollera att länken är korrekt.')
    }
    if (response.status === 403) {
      throw new Error('Åtkomst nekad. Sidan kanske blockerar automatisk hämtning.')
    }
    if (response.status >= 500) {
      throw new Error('Servern svarar inte just nu. Försök igen senare.')
    }
    throw new Error('Kunde inte hämta innehåll från länken. Försök med en annan länk.')
  }

  const content = await response.text()

  if (!content || content.trim().length === 0) {
    throw new Error('Sidan verkar vara tom eller kunde inte läsas.')
  }

  // Jina returnerar ibland felmeddelanden som 200-svar
  const lowerContent = content.toLowerCase()
  const errorIndicators = [
    'could not resolve',
    'failed to fetch',
    'unable to retrieve',
    'connection refused',
    'dns resolution failed',
    'page not found',
    'access denied',
    'err_name_not_resolved',
  ]
  if (content.trim().length < 200 && errorIndicators.some(indicator => lowerContent.includes(indicator))) {
    throw new Error('Sidan kunde inte läsas. Kontrollera att länken är korrekt.')
  }

  return {
    content,
    url,
  }
}
