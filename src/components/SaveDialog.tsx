/**
 * Dialog som visas när användaren markerar en länk som klar.
 * Frågar om länken ska sparas, kastas eller flyttas till Senare.
 */
import { useState } from 'react'
import type { Link } from '../types'

interface SaveDialogProps {
  link: Link
  onSave: (note: string) => void
  onDelete: () => void
  onMoveToLater: () => void
  onClose: () => void
}

export function SaveDialog({ link, onSave, onDelete, onMoveToLater, onClose }: SaveDialogProps) {
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-semibold text-stone-800 mb-2">
          Vill du spara?
        </h2>
        <p className="text-stone-600 mb-4">
          Du har markerat "{link.title}" som klar.
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Lägg till anteckning (valfritt)..."
          className="w-full px-3 py-2 mb-4 border border-stone-300 rounded-lg text-stone-800
                     placeholder:text-stone-400 focus:outline-none focus:ring-2
                     focus:ring-sky-500 focus:border-transparent resize-none"
          rows={3}
        />

        <div className="space-y-3">
          <button
            onClick={() => onSave(note)}
            className="w-full px-4 py-3 bg-sky-100 text-sky-800 rounded-lg font-medium
                       hover:bg-sky-200 transition-colors"
          >
            Ja, spara
          </button>
          <button
            onClick={onDelete}
            className="w-full px-4 py-3 bg-stone-100 text-stone-600 rounded-lg font-medium
                       hover:bg-stone-200 transition-colors"
          >
            Nej, kasta
          </button>
          <button
            onClick={onMoveToLater}
            className="w-full px-4 py-3 bg-amber-50 text-amber-800 rounded-lg font-medium
                       hover:bg-amber-100 transition-colors"
          >
            Flytta till Senare
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-stone-400 text-sm
                     hover:text-stone-600 transition-colors"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
