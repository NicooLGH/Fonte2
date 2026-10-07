'use client'

import { useState } from 'react'
import { AVATARS } from '@/lib/recompenses'

/* ============================================================
   Choix de l'avatar
   ============================================================
   Plus de cent avatars, tous libres, rangés par famille. Le
   cadre, lui, dépend du rang : l'aperçu le montre pour juger
   du rendu final.
   ============================================================ */

export function ChoixAvatar({
  avatar,
  enCours,
  onChoisir,
}: {
  avatar: string
  /** Gardé pour compatibilité : l'aperçu vit dans l'écran parent. */
  cadre?: string
  enCours: boolean
  onChoisir: (a: string) => void
}) {
  // On ouvre la famille de l'avatar actuel.
  const initiale = AVATARS.findIndex((f) => f.liste.includes(avatar))
  const [famille, setFamille] = useState(initiale < 0 ? 0 : initiale)

  return (
    <div className="flex flex-col gap-3">

      <div role="tablist" className="defilement-isole -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {AVATARS.map((f, i) => (
          <button
            key={f.famille}
            type="button"
            role="tab"
            aria-selected={famille === i}
            onClick={() => setFamille(i)}
            className={`h-10 shrink-0 rounded-full px-4 text-[14px] transition-colors ${
              famille === i
                ? 'bg-encre font-semibold text-fond'
                : 'bg-verre text-encre-douce hover:text-encre'
            }`}
          >
            {f.famille}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
        {AVATARS[famille].liste.map((a) => (
          <button
            key={a}
            type="button"
            disabled={enCours}
            onClick={() => onChoisir(a)}
            aria-pressed={avatar === a}
            aria-label={`Avatar ${a}`}
            className={`appui flex h-12 items-center justify-center rounded-bloc text-[26px] transition-colors ${
              avatar === a ? 'bg-verre-fort ring-2 ring-encre' : 'bg-verre hover:bg-verre-fort'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
