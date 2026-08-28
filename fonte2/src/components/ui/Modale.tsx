'use client'

import { useEffect, useRef } from 'react'

/**
 * Modale.
 *
 * Le carnet actuel utilisait `prompt()` et `confirm()` à ses
 * débuts, avant qu'on les remplace un par un. Ici, une seule
 * modale sert à tout : saisie, confirmation, détail.
 *
 * Elle ferme sur Échap et au clic dehors, et empêche la page de
 * défiler derrière — sinon on perd sa place en la refermant.
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

  useEffect(() => {
    if (!ouverte) return

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', surTouche)

    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Le focus entre dans la modale, sinon la navigation au
    // clavier reste bloquée sur la page derrière.
    carte.current?.focus()

    return () => {
      document.removeEventListener('keydown', surTouche)
      document.body.style.overflow = avant
    }
  }, [ouverte, onFermer])

  if (!ouverte) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
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
          <div>
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

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
