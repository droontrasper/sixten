/**
 * Fullskärmsmodal för att visa bilder.
 * Klicka var som helst för att stänga.
 */
import { useEffect } from 'react'

interface ImageModalProps {
  imageData: string
  title: string
  onClose: () => void
}

export function ImageModal({ imageData, title, onClose }: ImageModalProps) {
  // Stäng med Escape-tangenten
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Förhindra scroll när modal är öppen
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
      {/* Stäng-knapp */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-light transition-colors"
        aria-label="Stäng"
      >
        ×
      </button>

      {/* Bild */}
      <img
        src={imageData}
        alt={title}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Titel */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="text-white/80 text-sm">{title}</p>
      </div>
    </div>
  )
}
