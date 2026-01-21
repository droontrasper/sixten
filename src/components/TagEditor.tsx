/**
 * Komponent för att visa och redigera taggar.
 * AI-föreslagna taggar visas med outline, manuella med solid bakgrund.
 */
import { useState } from 'react'
import type { Tag } from '../types'

interface TagEditorProps {
  tags: Tag[]
  editable?: boolean
  onAdd?: (tagName: string) => void
  onRemove?: (tagId: string) => void
}

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 20

export function TagEditor({ tags, editable = false, onAdd, onRemove }: TagEditorProps) {
  const [newTag, setNewTag] = useState('')

  function handleAddTag() {
    const trimmed = newTag.trim().slice(0, MAX_TAG_LENGTH)
    if (trimmed && tags.length < MAX_TAGS && onAdd) {
      onAdd(trimmed)
      setNewTag('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (tags.length === 0 && !editable) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
            ${tag.ai_suggested
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-blue-500 text-white'
            }`}
        >
          {tag.tag_name}
          {editable && onRemove && (
            <button
              onClick={() => onRemove(tag.id)}
              className={`ml-0.5 hover:opacity-70 transition-opacity
                ${tag.ai_suggested ? 'text-blue-500' : 'text-blue-200'}`}
              aria-label={`Ta bort tagg ${tag.tag_name}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {editable && tags.length < MAX_TAGS && (
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value.slice(0, MAX_TAG_LENGTH))}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          placeholder="Lägg till tagg..."
          className="px-3 py-1 rounded-full text-sm border border-dashed border-stone-300
                     bg-transparent text-stone-600 placeholder-stone-400
                     focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200
                     w-28"
        />
      )}
    </div>
  )
}
