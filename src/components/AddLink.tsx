/**
 * Formulär för att lägga till nya länkar.
 * Visar laddningsindikator under AI-analys.
 */
import { useState } from 'react'

interface AddLinkProps {
  onAdd: (url: string) => Promise<void>
  isLoading: boolean
}

export function AddLink({ onAdd, isLoading }: AddLinkProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return

    await onAdd(url.trim())
    setUrl('')
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Klistra in en länk..."
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
