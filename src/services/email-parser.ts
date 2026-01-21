/**
 * Email-parser för att extrahera URLs från inkommande mail.
 * Används av email-webhook för att hitta länkar i mail-innehåll.
 */

/**
 * Hittar alla URLs i en textsträng
 * Returnerar array av unika URLs
 */
export function extractUrls(text: string): string[] {
  // Regex för att hitta URLs i text
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
  const matches = text.match(urlRegex) || []

  // Ta bort dubbletter och rensa trailing tecken
  const cleanedUrls = matches.map(url => {
    // Ta bort trailing punktuation som ofta följer med i mail
    return url.replace(/[.,;:!?)]+$/, '')
  })

  return [...new Set(cleanedUrls)]
}

/**
 * Parsar rå email-data från SendGrid
 * Returnerar array av URLs som hittades
 */
export function parseEmailForUrls(emailBody: string, subject: string): string[] {
  const combinedText = `${subject}\n${emailBody}`
  return extractUrls(combinedText)
}
