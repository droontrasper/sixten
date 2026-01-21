/**
 * Inkorgsvyn där nya länkar hamnar.
 * Härifrån kan användaren sortera till Aktiv lista eller Senare.
 */
import { useState, useMemo } from 'react'
import type { Link } from '../types'
import { LinkCard } from './LinkCard'
import { TagFilter } from './TagFilter'

interface InboxProps {
  links: Link[]
  onMoveToActive: (id: string) => void
  onMoveToLater: (id: string) => void
  onDelete: (id: string) => void
  onAddTag: (linkId: string, tagName: string) => void
  onRemoveTag: (linkId: string, tagId: string) => void
}

export function Inbox({ links, onMoveToActive, onMoveToLater, onDelete, onAddTag, onRemoveTag }: InboxProps) {
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const filteredLinks = useMemo(() => {
    if (!filterTag) return links
    return links.filter(link =>
      link.tags?.some(tag => tag.tag_name === filterTag)
    )
  }, [links, filterTag])

  if (links.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400">
        <p className="text-4xl mb-3">📬</p>
        <p className="text-lg text-stone-500">Redo för nya upptäckter!</p>
        <p className="text-sm mt-1">Klistra in en länk ovan för att komma igång</p>
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

      <div className="space-y-4">
        {filteredLinks.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            tagsEditable={true}
            onAddTag={(tagName) => onAddTag(link.id, tagName)}
            onRemoveTag={(tagId) => onRemoveTag(link.id, tagId)}
            actions={
              <>
                <button
                  onClick={() => onMoveToActive(link.id)}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg
                             hover:bg-blue-600 transition-colors"
                >
                  Lägg till i Aktiv lista
                </button>
                <button
                  onClick={() => onMoveToLater(link.id)}
                  className="px-4 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg
                             hover:bg-stone-300 transition-colors"
                >
                  Senare
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
    </div>
  )
}
