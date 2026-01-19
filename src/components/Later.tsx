/**
 * Senare-vyn för parkerade länkar.
 * Länkar som användaren vill spara till senare.
 */
import type { Link } from '../types'
import { LinkCard } from './LinkCard'

interface LaterProps {
  links: Link[]
  onMoveToActive: (id: string) => void
  onMarkDone: (link: Link) => void
  onDelete: (id: string) => void
}

export function Later({ links, onMoveToActive, onMarkDone, onDelete }: LaterProps) {
  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>Inga parkerade länkar</p>
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
            <>
              <button
                onClick={() => onMarkDone(link)}
                className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg
                           hover:bg-emerald-600 transition-colors"
              >
                Klar
              </button>
              <button
                onClick={() => onMoveToActive(link.id)}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg
                           hover:bg-blue-600 transition-colors"
              >
                Flytta till Aktiv lista
              </button>
              <button
                onClick={() => onDelete(link.id)}
                className="px-4 py-2 bg-stone-200 text-stone-600 text-sm rounded-lg
                           hover:bg-stone-300 transition-colors"
              >
                Kasta
              </button>
            </>
          }
        />
      ))}
    </div>
  )
}
