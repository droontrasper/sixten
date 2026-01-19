/**
 * Aktiv lista med länkar som användaren planerar att konsumera.
 * Visar total tidsuppskattning för alla aktiva länkar.
 */
import type { Link } from '../types'
import { LinkCard } from './LinkCard'

interface ActiveListProps {
  links: Link[]
  onMarkDone: (link: Link) => void
  onMoveToLater: (id: string) => void
}

export function ActiveList({ links, onMarkDone, onMoveToLater }: ActiveListProps) {
  const totalMinutes = links.reduce((sum, link) => sum + link.estimated_minutes, 0)

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>Inga aktiva länkar</p>
        <p className="text-sm mt-1">Flytta länkar från inkorgen hit</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-blue-800 font-medium">
          Total tid: {totalMinutes} minuter
          <span className="text-blue-600 font-normal ml-2">
            ({links.length} {links.length === 1 ? 'länk' : 'länkar'})
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {links.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            actions={
              <>
                <button
                  onClick={() => onMarkDone(link)}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg
                             hover:bg-emerald-600 transition-colors"
                >
                  Klar
                </button>
                <button
                  onClick={() => onMoveToLater(link.id)}
                  className="px-4 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg
                             hover:bg-stone-300 transition-colors"
                >
                  Flytta till Senare
                </button>
              </>
            }
          />
        ))}
      </div>
    </div>
  )
}
