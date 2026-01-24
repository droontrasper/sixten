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
}

interface AddLinkProps {
  onAdd: (result: AddLinkResult) => Promise<void>
  onImageError?: (error: string) => void
  isLoading: boolean
}

type Step = 'buttons' | 'url-input' | 'linkedin-prompt'

export function AddLink({ onAdd, onImageError, isLoading }: AddLinkProps) {
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('buttons')
  const [pendingUrl, setPendingUrl] = useState('')
  const [manualText, setManualText] = useState('')
  const [imageError, setImageError] = useState<string | null>(null)
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
      await onAdd({ url: normalizedUrl })
      setUrl('')
      setStep('buttons')
    }
  }

  const handleAnalyzeWithText = async () => {
    if (!pendingUrl || isLoading) return
    await onAdd({ url: pendingUrl, manualText: manualText.trim() })
    resetLinkedInState()
  }

  const handleSaveWithoutText = async () => {
    if (!pendingUrl || isLoading) return
    await onAdd({ url: pendingUrl, skipAnalysis: true })
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

  // LinkedIn prompt view
  if (step === 'linkedin-prompt') {
    return (
      <div className="mb-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          LinkedIn-inlägg upptäckt
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          Jina.ai kan inte läsa LinkedIn-inlägg eftersom de kräver inloggning.
          Vill du klistra in texten för bättre AI-analys?
        </p>

        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Klistra in inläggets text här (valfritt)..."
          disabled={isLoading}
          className="w-full p-3 border-2 border-blue-300 rounded-lg min-h-32 mb-4
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-stone-800 placeholder:text-stone-400"
        />

        <div className="flex gap-3 flex-wrap">
          {manualText.trim() && (
            <button
              onClick={handleAnalyzeWithText}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg
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
                'Analysera med text'
              )}
            </button>
          )}
          <button
            onClick={handleSaveWithoutText}
            disabled={isLoading}
            className="px-4 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg
                       hover:bg-stone-300 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {isLoading && !manualText.trim() ? (
              <>
                <LoadingSpinner />
                Sparar...
              </>
            ) : (
              'Spara utan text'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-stone-500 text-sm rounded-lg
                       hover:bg-stone-100 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
