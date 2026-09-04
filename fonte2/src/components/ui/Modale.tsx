'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modale.
 *
 * Le contenu est déplacé à la racine du document plutôt que
 * rendu sur place. La raison n'est pas cosmétique : un parent
 * portant `backdrop-blur`, `transform` ou `filter` devient un
 * repère de positionnement pour ses descendants en `fixed`. La
 * modale se calait alors sur la barre de navigation — d'où son
 * apparition en haut de l'écran et sa hauteur tronquée.
 *
 * Elle ferme sur Échap et au clic dehors, et empêche la page de
 * défiler derrière.
 */
export function Modale({
  titre,
  sousTitre,
  ouverte,
  onFermer,
  children,
}: {
  titre: string
  sousTitre?: string
  ouverte: boolean
  onFermer: () => void
  children: React.ReactNode
}) {
  const carte = useRef<HTMLDivElement>(null)
  const [monte, setMonte] = useState(false)

  // Le portail n'existe qu'une fois la page rendue dans le
  // navigateur : sur le serveur, `document` n'existe pas.
  useEffect(() => setMonte(true), [])

  useEffect(() => {
    if (!ouverte) return

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', surTouche)

    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    carte.current?.focus()

    return () => {
      document.removeEventListener('keydown', surTouche)
      document.body.style.overflow = avant
    }
  }, [ouverte, onFermer])

  if (!ouverte || !monte) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer()
      }}
    >
      <div
        ref={carte}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-carte
                   border border-bordure bg-fond p-6 outline-none"
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl">{titre}</h2>
            {sousTitre && (
              <p className="mt-1 text-sm text-encre-douce">{sousTitre}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                       bg-verre text-xs text-encre-douce transition-colors
                       hover:bg-verre-fort hover:text-encre"
          >
            ✕
          </button>
        </div>

        {/* `break-words` évite qu'un mot très long déborde
            au lieu de passer à la ligne. */}
        <div className="min-h-0 flex-1 overflow-y-auto break-words">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
