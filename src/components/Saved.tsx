/**
 * Sparat-vyn för konsumerade länkar.
 * Arkiv över länkar som användaren har markerat som klara.
 * Inkluderar filtrering på taggar.
 */
import { useState, useMemo } from 'react'
import type { Link } from '../types'
import { LinkCard } from './LinkCard'
import { TagFilter } from './TagFilter'

interface SavedProps {
  links: Link[]
  onDelete: (id: string) => void
}

export function Saved({ links, onDelete }: SavedProps) {
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Filtrera länkar baserat på vald tagg
  const filteredLinks = useMemo(() => {
    if (!filterTag) return links
    return links.filter(link =>
      link.tags?.some(tag => tag.tag_name === filterTag)
    )
  }, [links, filterTag])

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>Inga sparade länkar</p>
        <p className="text-sm mt-1">Markera länkar som klara för att spara dem här</p>
      </div>
    )
  }

  return (
    <div>
      <TagFilter
        links={links}
        activeFilter={filterTag}
        onFilterChange={setFilterTag}
      />

      {/* Visar antal resultat om filter är aktivt */}
      {filterTag && (
        <p className="text-sm text-stone-500 mb-3">
          Visar {filteredLinks.length} av {links.length} länkar med taggen "{filterTag}"
        </p>
      )}

      {/* Länklista */}
      <div className="space-y-4">
        {filteredLinks.map((link) => (
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

      {/* Tom state när filter inte matchar */}
      {filteredLinks.length === 0 && filterTag && (
        <div className="text-center py-8 text-stone-400">
          <p>Inga länkar med taggen "{filterTag}"</p>
          <button
            onClick={() => setFilterTag(null)}
            className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
          >
            Visa alla länkar
          </button>
        </div>
      )}
    </div>
  )
}
