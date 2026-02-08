/**
 * Netlify Function för att hämta webbinnehåll via Jina Reader.
 * Konverterar webbsidor till ren text för AI-analys.
 * Inkluderar feldetektering för DNS-fel och andra problem.
 */
import type { Handler } from '@netlify/functions'

const JINA_READER_URL = 'https://r.jina.ai/'

const ERROR_INDICATORS = [
  'could not resolve',
  'failed to fetch',
  'unable to retrieve',
  'connection refused',
  'dns resolution failed',
  'page not found',
  'access denied',
  'err_name_not_resolved',
]

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  let url: string
  try {
    const body = JSON.parse(event.body || '{}')
    url = body.url
    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ingen URL angiven.' }),
      }
    }
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Ogiltig request.' }),
    }
  }

  const apiKey = process.env.JINA_API_KEY

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
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Kunde inte ansluta till servern.' }),
    }
  }

  if (!response.ok) {
    if (response.status === 404) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Sidan kunde inte hittas. Kontrollera att länken är korrekt.' }),
      }
    }
    if (response.status === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Åtkomst nekad. Sidan kanske blockerar automatisk hämtning.' }),
      }
    }
    if (response.status >= 500) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Servern svarar inte just nu. Försök igen senare.' }),
      }
    }
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Kunde inte hämta innehåll från länken.' }),
    }
  }

  const content = await response.text()

  if (!content || content.trim().length === 0) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'Sidan verkar vara tom eller kunde inte läsas.' }),
    }
  }

  // Jina returnerar ibland felmeddelanden som 200-svar
  const lowerContent = content.toLowerCase()
  if (content.trim().length < 200 && ERROR_INDICATORS.some(indicator => lowerContent.includes(indicator))) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'Sidan kunde inte läsas. Kontrollera att länken är korrekt.' }),
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, url }),
  }
}
