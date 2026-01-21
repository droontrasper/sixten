/**
 * Formulär för att lägga till nya länkar.
 * Visar laddningsindikator under AI-analys.
 * Specialhantering för LinkedIn-posts som kräver manuell text-input.
 * Auto-kompletterar URL:er utan protokoll (gp.se → https://gp.se)
 */
import { useState } from 'react'

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

export interface AddLinkResult {
  url: string
  manualText?: string
  skipAnalysis?: boolean
}

interface AddLinkProps {
  onAdd: (result: AddLinkResult) => Promise<void>
  isLoading: boolean
}

type Step = 'input' | 'linkedin-prompt'

export function AddLink({ onAdd, isLoading }: AddLinkProps) {
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [pendingUrl, setPendingUrl] = useState('')
  const [manualText, setManualText] = useState('')

  const isLinkedInPost = (checkUrl: string): boolean => {
    return checkUrl.includes('linkedin.com/posts/')
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
    setStep('input')
    setPendingUrl('')
    setManualText('')
  }

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

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Klistra in en länk (t.ex. gp.se eller https://...)..."
          disabled={isLoading}
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
