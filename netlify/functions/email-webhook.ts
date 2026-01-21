/**
 * Netlify Function för att ta emot mail via SendGrid Inbound Parse.
 * Extraherar URLs från mailet och lägger till dem i användarens inkorg.
 */
import type { Handler } from '@netlify/functions'

/**
 * Hittar alla URLs i en textsträng
 */
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
  const matches = text.match(urlRegex) || []

  const cleanedUrls = matches.map(url => {
    return url.replace(/[.,;:!?)]+$/, '')
  })

  return [...new Set(cleanedUrls)]
}

/**
 * Parsar email-data och returnerar URLs
 */
function parseEmailForUrls(emailBody: string, subject: string): string[] {
  const combinedText = `${subject}\n${emailBody}`
  return extractUrls(combinedText)
}

export const handler: Handler = async (event) => {
  // Tillåt bara POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    // SendGrid skickar email-data som form-data
    const body = event.body || ''
    const params = new URLSearchParams(body)

    const emailBody = params.get('text') || params.get('html') || ''
    const subject = params.get('subject') || ''
    const fromEmail = params.get('from') || ''
    const toEmail = params.get('to') || ''

    console.log('Email received from:', fromEmail)
    console.log('To:', toEmail)
    console.log('Subject:', subject)

    // Hitta URLs i mailet
    const urls = parseEmailForUrls(emailBody, subject)

    if (urls.length === 0) {
      console.log('No URLs found in email')
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No URLs found' })
      }
    }

    console.log('Found URLs:', urls)

    // TODO: Här ska vi:
    // 1. Identifiera vilken användare som äger denna email-adress (via toEmail)
    // 2. För varje URL: analysera med Jina.ai + Claude
    // 3. Spara i Supabase med user_id

    // För nu: returnera success med information om vad som hittades
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email processed',
        urlsFound: urls.length,
        urls
      })
    }

  } catch (error) {
    console.error('Email webhook error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
