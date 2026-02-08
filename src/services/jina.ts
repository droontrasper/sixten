/**
 * Innehållshämtning via Netlify Function /api/fetch-content.
 * API-nyckeln hålls säkert på servern.
 */

export interface JinaResponse {
  content: string
  url: string
}

export async function fetchPageContent(url: string): Promise<JinaResponse> {
  let response: Response
  try {
    response = await fetch('/api/fetch-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  } catch {
    throw new Error('Kunde inte ansluta till servern. Kontrollera din internetanslutning.')
  }

  if (!response.ok) {
    let errorMessage = 'Kunde inte hämta innehåll från länken. Försök med en annan länk.'
    try {
      const data = await response.json()
      if (data.error) {
        errorMessage = data.error
      }
    } catch {
      // Använd default felmeddelande
    }
    throw new Error(errorMessage)
  }

  let data: { content: string; url: string }
  try {
    data = await response.json()
  } catch {
    throw new Error('Fick ett oväntat svar från servern.')
  }

  if (!data.content || data.content.trim().length === 0) {
    throw new Error('Sidan verkar vara tom eller kunde inte läsas.')
  }

  return {
    content: data.content,
    url: data.url,
  }
}
