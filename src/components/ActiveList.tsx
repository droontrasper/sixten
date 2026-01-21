/**
 * Aktiv lista med länkar som användaren planerar att konsumera.
 * Visar total tidsuppskattning för alla aktiva länkar.
 */
import { useState, useMemo } from 'react'
import type { Link } from '../types'
import { LinkCard } from './LinkCard'
import { TagFilter } from './TagFilter'

interface ActiveListProps {
  links: Link[]
  maxLinks: number
  maxMinutes: number
  onMarkDone: (link: Link) => void
  onMoveToLater: (id: string) => void
}

export function ActiveList({ links, maxLinks, maxMinutes, onMarkDone, onMoveToLater }: ActiveListProps) {
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const filteredLinks = useMemo(() => {
    if (!filterTag) return links
    return links.filter(link =>
      link.tags?.some(tag => tag.tag_name === filterTag)
    )
  }, [links, filterTag])

  const totalMinutes = links.reduce((sum, link) => sum + link.estimated_minutes, 0)
  const linksFull = links.length >= maxLinks
  const minutesFull = totalMinutes >= maxMinutes

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>Inga aktiva länkar</p>
        <p className="text-sm mt-1">Flytta länkar från inkorgen hit</p>
        <p className="text-xs mt-2 text-stone-300">Max {maxLinks} länkar • Max {maxMinutes} min</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between">
          <p className="text-blue-800 font-medium">
            <span className={linksFull ? 'text-amber-600' : ''}>
              {links.length}/{maxLinks} länkar
            </span>
            <span className="text-blue-400 mx-2">•</span>
            <span className={minutesFull ? 'text-amber-600' : ''}>
              {totalMinutes}/{maxMinutes} min
            </span>
          </p>
          {(linksFull || minutesFull) && (
            <span className="text-xs text-amber-600 font-medium">Full kapacitet</span>
          )}
        </div>
      </div>

      <TagFilter
        links={links}
        activeFilter={filterTag}
        onFilterChange={setFilterTag}
      />

      <div className="space-y-4">
        {filteredLinks.map((link) => (
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
