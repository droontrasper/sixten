/**
 * Sparat-vyn för konsumerade länkar.
 * Arkiv över länkar som användaren har markerat som klara.
 */
import type { Link } from '../types'
import { LinkCard } from './LinkCard'

interface SavedProps {
  links: Link[]
  onDelete: (id: string) => void
}

export function Saved({ links, onDelete }: SavedProps) {
  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>Inga sparade länkar</p>
        <p className="text-sm mt-1">Markera länkar som klara för att spara dem här</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          actions={
            <button
              onClick={() => onDelete(link.id)}
              className="px-4 py-2 bg-stone-200 text-stone-600 text-sm rounded-lg
                         hover:bg-stone-300 transition-colors"
            >
              Kasta
            </button>
          }
        />
      ))}
    </div>
  )
}
