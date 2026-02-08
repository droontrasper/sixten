/**
 * Landing-komponent - lugn startsida för Sixten
 *
 * Visar:
 * - Sixten-loggan centrerad
 * - Senast tillagda länk (om det finns en)
 * - AddLink-funktionalitet för att lägga till ny länk
 * - Knapp för att gå till sortering/inbox
 */
import type { Link } from '../types'
import { AddLink, type AddLinkResult } from './AddLink'

interface LandingStats {
  addedThisWeek: number
  completedThisWeek: number
  totalLinks: number
}

interface LandingProps {
  latestLink: Link | null
  stats: LandingStats
  onAdd: (result: AddLinkResult) => Promise<void>
  onGoToSorting: () => void
  onGoToActive: () => void
  isLoading: boolean
  error?: string | null
  onClearError?: () => void
}

export function Landing({ latestLink, stats, onAdd, onGoToSorting, onGoToActive, isLoading, error, onClearError }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Logga */}
        <div className="flex justify-center mb-12">
          <img
            src="/sixten-icon-192.png"
            alt="Sixten"
            className="w-40 h-40 drop-shadow-lg"
          />
        </div>

        {/* Titel */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-800 mb-3">
            Sixten
          </h1>
          <p className="text-lg text-stone-500">
            Din lugna innehållskö
          </p>
        </div>

        {/* AddLink - för att lägga till ny länk */}
        <AddLink onAdd={onAdd} isLoading={isLoading} />

        {/* Felmeddelande */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            {onClearError && (
              <button
                onClick={onClearError}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Senast tillagda länk */}
        {latestLink && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-stone-200">
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">
              Senast tillagd
            </p>
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              {latestLink.url.startsWith('image://') ? (
                latestLink.title
              ) : (
                <a
                  href={latestLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                >
                  {latestLink.title}
                  <span className="text-stone-400 text-sm">🔗</span>
                </a>
              )}
            </h3>
            <p className="text-sm text-stone-600 mb-3 line-clamp-2">
              {latestLink.summary}
            </p>
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="px-2 py-1 bg-stone-100 rounded-full">
                {latestLink.content_type}
              </span>
              <span>{latestLink.estimated_minutes} min</span>
            </div>
          </div>
        )}

        {/* Statistik */}
        {(stats.addedThisWeek > 0 || stats.completedThisWeek > 0 || stats.totalLinks > 0) && (
          <div className="flex justify-center gap-8 py-4 mb-6 text-stone-400 text-sm">
            <div className="text-center">
              <span className="block text-lg font-semibold text-stone-600">+{stats.addedThisWeek}</span>
              <span>denna vecka</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-semibold text-emerald-600">{stats.completedThisWeek}</span>
              <span>klara</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-semibold text-stone-600">{stats.totalLinks}</span>
              <span>totalt</span>
            </div>
          </div>
        )}

        {/* Knappar för navigation */}
        <div className="flex gap-3">
          <button
            onClick={onGoToSorting}
            className="flex-1 px-6 py-4 bg-stone-800 text-white rounded-xl font-medium
                       hover:bg-stone-900 transition-colors shadow-sm
                       flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>Sortering</span>
          </button>
          <button
            onClick={onGoToActive}
            className="flex-1 px-6 py-4 bg-sky-600 text-white rounded-xl font-medium
                       hover:bg-sky-700 transition-colors shadow-sm
                       flex items-center justify-center gap-2"
          >
            <span>⚡</span>
            <span>Aktiv lista</span>
          </button>
        </div>

        {/* Subtil footer */}
        <p className="text-center text-xs text-stone-400 mt-8">
          Behåll lugnet. Fokusera på det viktiga.
        </p>
      </div>
    </div>
  )
}
