/**
 * Hopfällbar tagg-filter komponent.
 * Visar alla unika taggar och låter användaren filtrera på en tagg.
 */
import { useState, useMemo } from 'react'
import type { Link } from '../types'

interface TagFilterProps {
  links: Link[]
  activeFilter: string | null
  onFilterChange: (tag: string | null) => void
}

export function TagFilter({ links, activeFilter, onFilterChange }: TagFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Samla alla unika taggar från länkarna
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    links.forEach(link => {
      link.tags?.forEach(tag => tagSet.add(tag.tag_name))
    })
    return Array.from(tagSet).sort()
  }, [links])

  // Visa inte komponenten om det inte finns några taggar
  if (allTags.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
      >
        <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
        <span>Filtrera på tagg</span>
        {activeFilter && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
            {activeFilter}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-stone-100 rounded-lg">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onFilterChange(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors
                ${!activeFilter
                  ? 'bg-stone-700 text-white'
                  : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
                }`}
            >
              Visa alla
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => onFilterChange(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors
                  ${activeFilter === tag
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
    </div>
  )
}
