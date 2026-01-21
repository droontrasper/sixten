/**
 * Återanvändbar komponent för att visa en länk.
 * Visar titel, sammanfattning, typ, tidsuppskattning och taggar.
 */
import type { Link } from '../types'
import { TagEditor } from './TagEditor'

interface LinkCardProps {
  link: Link
  actions: React.ReactNode
  tagsEditable?: boolean
  onAddTag?: (tagName: string) => void
  onRemoveTag?: (tagId: string) => void
}

const typeLabels: Record<string, string> = {
  artikel: 'Artikel',
  video: 'Video',
  podd: 'Podd',
}

const typeColors: Record<string, string> = {
  artikel: 'bg-emerald-100 text-emerald-700',
  video: 'bg-purple-100 text-purple-700',
  podd: 'bg-amber-100 text-amber-700',
}

export function LinkCard({ link, actions, tagsEditable = false, onAddTag, onRemoveTag }: LinkCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-medium text-stone-800 leading-snug">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
          >
            {link.title}
            <span className="text-stone-400 text-sm">🔗</span>
          </a>
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[link.content_type]}`}>
            {typeLabels[link.content_type]}
          </span>
          <span className="text-sm text-stone-500">
            {link.estimated_minutes} min
          </span>
        </div>
      </div>

      <p className="text-stone-600 text-sm leading-relaxed">
        {link.summary}
      </p>

      {link.tags && link.tags.length > 0 || tagsEditable ? (
        <TagEditor
          tags={link.tags || []}
          editable={tagsEditable}
          onAdd={onAddTag}
          onRemove={onRemoveTag}
        />
      ) : null}

      {link.note && (
        <p className="text-stone-500 text-sm mt-3 leading-relaxed flex items-start gap-1.5">
          <span>📝</span>
          <span className="italic">{link.note}</span>
        </p>
      )}

      <div className="flex gap-2 mt-4">
        {actions}
      </div>
    </div>
  )
}
