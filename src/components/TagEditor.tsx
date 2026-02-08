/**
 * Komponent för att visa och redigera taggar.
 * AI-föreslagna taggar visas med outline, manuella med solid bakgrund.
 * Stöd för autocomplete med befintliga taggar och favorittaggar.
 */
import { useState } from 'react'
import type { Tag } from '../types'

interface TagEditorProps {
  tags: Tag[]
  editable?: boolean
  onAdd?: (tagName: string) => void
  onRemove?: (tagId: string) => void
  allTags?: string[]
  favoriteTags?: string[]
  onToggleFavorite?: (tagName: string) => void
}

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 20

export function TagEditor({ tags, editable = false, onAdd, onRemove, allTags = [], favoriteTags = [], onToggleFavorite }: TagEditorProps) {
  const [newTag, setNewTag] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  function handleAddTag(value?: string) {
    const trimmed = (value || newTag).trim().slice(0, MAX_TAG_LENGTH)
    if (trimmed && tags.length < MAX_TAGS && onAdd) {
      onAdd(trimmed)
      setNewTag('')
      setShowSuggestions(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  function handleInputChange(value: string) {
    setNewTag(value.slice(0, MAX_TAG_LENGTH))
    setShowSuggestions(true)
  }

  const alreadyAdded = new Set(tags.map(t => t.tag_name.toLowerCase()))

  const suggestions = (() => {
    const search = newTag.trim().toLowerCase()

    if (search) {
      // Sök: favoriter först, sedan vanliga
      const matchingFavorites = favoriteTags
        .filter(tag => tag.toLowerCase().includes(search) && !alreadyAdded.has(tag.toLowerCase()))
      const matchingOthers = allTags
        .filter(tag =>
          tag.toLowerCase().includes(search) &&
          !alreadyAdded.has(tag.toLowerCase()) &&
          !favoriteTags.includes(tag)
        )
      return { favorites: matchingFavorites.slice(0, 5), others: matchingOthers.slice(0, 5) }
    } else {
      // Tomt fält: visa bara favoriter som snabbval
      const availableFavorites = favoriteTags
        .filter(tag => !alreadyAdded.has(tag.toLowerCase()))
      return { favorites: availableFavorites, others: [] as string[] }
    }
  })()

  const hasSuggestions = suggestions.favorites.length > 0 || suggestions.others.length > 0

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
        <div className="relative">
          <input
            type="text"
            value={newTag}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Fördröj så klick på suggestion hinner registreras
              setTimeout(() => {
                setShowSuggestions(false)
                if (newTag.trim()) handleAddTag()
              }, 200)
            }}
            placeholder="Lägg till tagg..."
            className="px-3 py-1 rounded-full text-sm border border-dashed border-stone-300
                       bg-transparent text-stone-600 placeholder-stone-400
                       focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200
                       w-28"
          />
          {showSuggestions && hasSuggestions && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-stone-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {suggestions.favorites.map(suggestion => (
                <div key={suggestion} className="flex items-center">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleAddTag(suggestion)
                    }}
                    className="flex-1 text-left px-3 py-2 hover:bg-blue-50 text-sm text-stone-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onToggleFavorite(suggestion)
                      }}
                      className="px-2 py-2 text-amber-400 hover:text-amber-500 transition-colors"
                      aria-label="Ta bort från favoriter"
                    >
                      ★
                    </button>
                  )}
                </div>
              ))}
              {suggestions.favorites.length > 0 && suggestions.others.length > 0 && (
                <div className="border-t border-stone-100" />
              )}
              {suggestions.others.map(suggestion => (
                <div key={suggestion} className="flex items-center">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleAddTag(suggestion)
                    }}
                    className="flex-1 text-left px-3 py-2 hover:bg-blue-50 text-sm text-stone-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onToggleFavorite(suggestion)
                      }}
                      className="px-2 py-2 text-stone-300 hover:text-amber-400 transition-colors"
                      aria-label="Lägg till som favorit"
                    >
                      ☆
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
