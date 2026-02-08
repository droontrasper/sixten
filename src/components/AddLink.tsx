/**
 * Formulär för att lägga till nya länkar eller bilder.
 * Visar laddningsindikator under AI-analys.
 * Specialhantering för LinkedIn-posts som kräver manuell text-input.
 * Auto-kompletterar URL:er utan protokoll (gp.se → https://gp.se)
 * Stöd för bilduppladdning med base64-konvertering.
 */
import { useState, useRef } from 'react'

/**
 * Normaliserar URL genom att lägga till https:// om det saknas
 */
function normalizeInputUrl(input: string): string {
  const trimmed = input.trim()

  // Om redan har protokoll, returnera som den är
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed
  }

  // Ta bort eventuell www. i början för att sedan lägga till https://
  const withoutWww = trimmed.replace(/^www\./i, '')

  // Lägg till https://
  return `https://${withoutWww}`
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg']

export interface AddLinkResult {
  url?: string
  manualText?: string
  skipAnalysis?: boolean
  imageData?: string // base64-encoded image
  manualTitle?: string // Manuell titel vid AI-fel
  manualTags?: string[] // Manuella taggar vid AI-fel
}

interface AddLinkProps {
  onAdd: (result: AddLinkResult) => Promise<void>
  onImageError?: (error: string) => void
  isLoading: boolean
}

type Step = 'buttons' | 'url-input' | 'linkedin-prompt' | 'linkedin-text-input' | 'image-fallback' | 'jina-fallback'

export function AddLink({ onAdd, onImageError, isLoading }: AddLinkProps) {
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('buttons')
  const [pendingUrl, setPendingUrl] = useState('')
  const [manualText, setManualText] = useState('')
  const [imageError, setImageError] = useState<string | null>(null)
  const [pendingImageData, setPendingImageData] = useState<string | null>(null)
  const [fallbackTitle, setFallbackTitle] = useState('')
  const [fallbackTagInput, setFallbackTagInput] = useState('')
  const [fallbackTags, setFallbackTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLinkedInPost = (checkUrl: string): boolean => {
    return checkUrl.includes('linkedin.com/posts/')
  }

  const handleUrlButtonClick = () => {
    setStep('url-input')
    setImageError(null)
  }

  const handleImageButtonClick = () => {
    setImageError(null)
    fileInputRef.current?.click()
  }

  const handleBackToButtons = () => {
    setStep('buttons')
    setUrl('')
    setImageError(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input
    e.target.value = ''

    // Validera filtyp
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const error = 'Endast PNG och JPEG stöds.'
      setImageError(error)
      onImageError?.(error)
      return
    }

    // Validera storlek
    if (file.size > MAX_IMAGE_SIZE) {
      const error = 'Bilden är för stor. Max 5MB.'
      setImageError(error)
      onImageError?.(error)
      return
    }

    // Konvertera till base64
    try {
      const base64 = await fileToBase64(file)
      console.log('Image converted to base64, length:', base64.length)

      // Skicka till parent för analys
      await onAdd({ imageData: base64 })
      setImageError(null)
    } catch {
      const error = 'Kunde inte läsa bilden. Försök igen.'
      setImageError(error)
      onImageError?.(error)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Ta bort "data:image/xxx;base64," prefix om vi bara vill ha raw base64
        // Men behåll det för nu då Claude API behöver det
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return

    const normalizedUrl = normalizeInputUrl(url.trim())

    if (isLinkedInPost(normalizedUrl)) {
      setPendingUrl(normalizedUrl)
      setStep('linkedin-prompt')
      setUrl('')
    } else {
      try {
        await onAdd({ url: normalizedUrl })
        setUrl('')
        setStep('buttons')
      } catch {
        // Fel hanteras av App (felmeddelande eller fallback-dialog)
        setUrl('')
      }
    }
  }

  const handleAnalyzeWithText = async () => {
    if (!pendingUrl || isLoading) return
    await onAdd({ url: pendingUrl, manualText: manualText.trim() })
    resetLinkedInState()
  }

  const handleCancel = () => {
    resetLinkedInState()
  }

  const resetLinkedInState = () => {
    setStep('buttons')
    setPendingUrl('')
    setManualText('')
  }

  const resetFallbackState = () => {
    setStep('buttons')
    setPendingImageData(null)
    setFallbackTitle('')
    setFallbackTagInput('')
    setFallbackTags([])
  }

  const handleFallbackAddTag = () => {
    const tag = fallbackTagInput.trim()
    const normalizedTag = tag.toLowerCase()
    if (normalizedTag && fallbackTags.length < 4 && !fallbackTags.some(t => t.toLowerCase() === normalizedTag)) {
      setFallbackTags([...fallbackTags, normalizedTag])
      setFallbackTagInput('')
    }
  }

  const handleFallbackRemoveTag = (tagToRemove: string) => {
    setFallbackTags(fallbackTags.filter(t => t !== tagToRemove))
  }

  const handleFallbackSubmit = async () => {
    if (!pendingImageData || !fallbackTitle.trim() || isLoading) return
    await onAdd({
      imageData: pendingImageData,
      manualTitle: fallbackTitle.trim(),
      manualTags: fallbackTags.length > 0 ? fallbackTags : undefined,
    })
    resetFallbackState()
  }

  // Exponera funktion för att trigga fallback-dialog från parent
  const showImageFallback = (imageData: string) => {
    setPendingImageData(imageData)
    setStep('image-fallback')
  }

  // Gör showImageFallback tillgänglig via window för parent-komponent
  // Detta är ett enkelt sätt att kommunicera utan att behöva refs
  ;(window as unknown as { showImageFallback?: typeof showImageFallback }).showImageFallback = showImageFallback

  // Exponera funktion för att trigga Jina-fallback från parent
  const showJinaFallback = (failedUrl: string) => {
    setPendingUrl(failedUrl)
    setStep('jina-fallback')
  }
  ;(window as unknown as { showJinaFallback?: typeof showJinaFallback }).showJinaFallback = showJinaFallback

  // Handler för LinkedIn-bilduppladdning
  const handleLinkedInImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const error = 'Endast PNG och JPEG stöds.'
      setImageError(error)
      onImageError?.(error)
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const error = 'Bilden är för stor. Max 5MB.'
      setImageError(error)
      onImageError?.(error)
      return
    }

    try {
      const base64 = await fileToBase64(file)
      await onAdd({ url: pendingUrl, imageData: base64 })
      setImageError(null)
      resetLinkedInState()
    } catch {
      const error = 'Kunde inte läsa bilden. Försök igen.'
      setImageError(error)
      onImageError?.(error)
    }
  }

  // Image fallback view - manuell input vid AI-fel
  if (step === 'image-fallback') {
    return (
      <div className="mb-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
        <h3 className="text-lg font-medium text-amber-800 mb-2">
          AI-analys misslyckades
        </h3>
        <p className="text-sm text-amber-700 mb-4">
          Bilden kunde inte analyseras automatiskt. Ange titel och taggar manuellt.
        </p>

        {/* Bildförhandsvisning */}
        {pendingImageData && (
          <div className="mb-4">
            <img
              src={pendingImageData}
              alt="Uppladdad bild"
              className="max-h-32 rounded-lg border border-amber-200"
            />
          </div>
        )}

        {/* Titel */}
        <input
          type="text"
          value={fallbackTitle}
          onChange={(e) => setFallbackTitle(e.target.value)}
          placeholder="Ange en titel..."
          disabled={isLoading}
          autoFocus
          className="w-full px-4 py-3 rounded-lg border border-amber-300 bg-white mb-4
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-stone-800 placeholder:text-stone-400"
        />

        {/* Taggar */}
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={fallbackTagInput}
              onChange={(e) => setFallbackTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleFallbackAddTag()
                }
              }}
              placeholder="Lägg till tagg..."
              disabled={isLoading || fallbackTags.length >= 4}
              className="flex-1 px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-stone-800 placeholder:text-stone-400"
            />
            <button
              type="button"
              onClick={handleFallbackAddTag}
              disabled={!fallbackTagInput.trim() || fallbackTags.length >= 4 || isLoading}
              className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm
                         hover:bg-amber-600 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          {fallbackTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {fallbackTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs"
                >
                  {tag}
                  <button
                    onClick={() => handleFallbackRemoveTag(tag)}
                    className="text-amber-500 hover:text-amber-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetFallbackState}
            disabled={isLoading}
            className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-lg
                       hover:bg-stone-200 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Avbryt
          </button>
          <button
            onClick={handleFallbackSubmit}
            disabled={!fallbackTitle.trim() || isLoading}
            className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium
                       hover:bg-amber-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Sparar...
              </>
            ) : (
              'Spara'
            )}
          </button>
        </div>
      </div>
    )
  }

  // Jina.ai fallback view - länken kunde inte läsas
  if (step === 'jina-fallback') {
    const handleJinaSaveAnyway = async () => {
      if (!pendingUrl || isLoading) return
      await onAdd({ url: pendingUrl, skipAnalysis: true })
      setPendingUrl('')
      setStep('buttons')
    }

    const handleJinaManualText = () => {
      setStep('linkedin-text-input')
    }

    return (
      <div className="mb-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
        <h3 className="text-lg font-medium text-amber-800 mb-2">
          Kunde inte läsa länken
        </h3>
        <p className="text-sm text-amber-700 mb-4">
          Innehållet kunde inte hämtas automatiskt. Välj ett alternativ:
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleJinaSaveAnyway}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-amber-500 text-white rounded-lg font-medium
                       hover:bg-amber-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Sparar...
              </>
            ) : (
              'Spara ändå utan AI-analys'
            )}
          </button>

          <button
            onClick={handleJinaManualText}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            <span className="text-lg">📝</span>
            Klistra in text manuellt
          </button>

          <button
            onClick={() => { setPendingUrl(''); setStep('buttons') }}
            disabled={isLoading}
            className="w-full px-6 py-2.5 text-stone-500 rounded-lg
                       hover:bg-stone-100 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Avbryt
          </button>
        </div>
      </div>
    )
  }

  // LinkedIn text input view (sub-step)
  if (step === 'linkedin-text-input') {
    return (
      <div className="mb-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Klistra in text
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          Kopiera texten från LinkedIn-inlägget och klistra in här.
        </p>

        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Klistra in inläggets text här..."
          disabled={isLoading}
          autoFocus
          className="w-full p-3 border-2 border-blue-300 rounded-lg min-h-32 mb-4
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-stone-800 placeholder:text-stone-400"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setStep('linkedin-prompt')}
            disabled={isLoading}
            className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-lg
                       hover:bg-stone-200 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Tillbaka
          </button>
          <button
            onClick={handleAnalyzeWithText}
            disabled={!manualText.trim() || isLoading}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Analyserar...
              </>
            ) : (
              'Analysera'
            )}
          </button>
        </div>
      </div>
    )
  }

  // LinkedIn prompt view - tre knappar
  if (step === 'linkedin-prompt') {
    return (
      <div className="mb-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        {/* Hidden file input för LinkedIn-bilduppladdning */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleLinkedInImageUpload}
          className="hidden"
        />

        <h3 className="text-lg font-medium text-blue-800 mb-2">
          LinkedIn-inlägg upptäckt
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          LinkedIn kräver inloggning för att läsa inlägg. Välj ett alternativ:
        </p>

        {/* Error message */}
        {imageError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
            <span>{imageError}</span>
            <button
              onClick={() => setImageError(null)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setStep('linkedin-text-input')}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Analyserar...
              </>
            ) : (
              <>
                <span className="text-lg">📝</span>
                Klistra in text manuellt
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium
                       hover:bg-emerald-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Analyserar...
              </>
            ) : (
              <>
                <span className="text-lg">📸</span>
                Ladda upp skärmdump
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full px-6 py-2.5 text-stone-500 rounded-lg
                       hover:bg-stone-100 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            <span>❌</span>
            Avbryt
          </button>
        </div>
      </div>
    )
  }

  // URL input view
  if (step === 'url-input') {
    return (
      <div className="mb-8">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBackToButtons}
              disabled={isLoading}
              className="px-3 py-3 bg-stone-100 text-stone-600 rounded-lg
                         hover:bg-stone-200 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              title="Tillbaka"
            >
              ←
            </button>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Klistra in en länk (t.ex. gp.se eller https://...)..."
              disabled={isLoading}
              autoFocus
              className="flex-1 px-4 py-3 rounded-lg border border-stone-300 bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-stone-800 placeholder:text-stone-400"
            />
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                         hover:bg-blue-600 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Analyserar...
                </>
              ) : (
                'Lägg till'
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Default: Two buttons view
  return (
    <div className="mb-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {imageError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
          <span>{imageError}</span>
          <button
            onClick={() => setImageError(null)}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Two buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleUrlButtonClick}
          disabled={isLoading}
          className="flex-1 px-6 py-4 bg-blue-500 text-white rounded-lg font-medium
                     hover:bg-blue-600 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Analyserar...
            </>
          ) : (
            <>
              <span className="text-lg">🔗</span>
              Klistra in länk
            </>
          )}
        </button>

        <button
          onClick={handleImageButtonClick}
          disabled={isLoading}
          className="flex-1 px-6 py-4 bg-emerald-500 text-white rounded-lg font-medium
                     hover:bg-emerald-600 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Analyserar...
            </>
          ) : (
            <>
              <span className="text-lg">📸</span>
              Ladda upp bild
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
