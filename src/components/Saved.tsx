/**
 * Sparat-vyn för konsumerade länkar.
 * Arkiv över länkar som användaren har markerat som klara.
 * Inkluderar filtrering på taggar.
 */
import { useState, useMemo } from 'react'
import type { Link } from '../types'
import { LinkCard } from './LinkCard'

interface SavedProps {
  links: Link[]
  onDelete: (id: string) => void
}

export function Saved({ links, onDelete }: SavedProps) {
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Samla alla unika taggar från alla sparade länkar
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    links.forEach(link => {
      link.tags?.forEach(tag => tagSet.add(tag.tag_name))
    })
    return Array.from(tagSet).sort()
  }, [links])

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
      {/* Tagg-filter */}
      {allTags.length > 0 && (
        <div className="mb-4 p-3 bg-stone-100 rounded-lg">
          <p className="text-sm text-stone-500 mb-2">Filtrera på tagg:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors
                ${!filterTag
                  ? 'bg-stone-700 text-white'
                  : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
                }`}
            >
              Visa alla
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors
                  ${filterTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

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
