'use client'

import { useState } from 'react'
import { AVATARS } from '@/lib/recompenses'
import { AvatarCadre } from '@/components/AvatarCadre'

/* ============================================================
   Choix de l'avatar
   ============================================================
   Plus de cent avatars, tous libres, rangés par famille. Le
   cadre, lui, dépend du rang : l'aperçu le montre pour juger
   du rendu final.
   ============================================================ */

export function ChoixAvatar({
  avatar,
  cadre,
  enCours,
  onChoisir,
}: {
  avatar: string
  cadre: string
  enCours: boolean
  onChoisir: (a: string) => void
}) {
  // On ouvre la famille de l'avatar actuel.
  const initiale = AVATARS.findIndex((f) => f.liste.includes(avatar))
  const [famille, setFamille] = useState(initiale < 0 ? 0 : initiale)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <AvatarCadre avatar={avatar} cadre={cadre} taille={52} />
        <p className="font-mono text-[10.5px] text-encre-douce">aperçu avec ton cadre</p>
      </div>

      <div role="tablist" className="defilement-isole -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {AVATARS.map((f, i) => (
          <button
            key={f.famille}
            type="button"
            role="tab"
            aria-selected={famille === i}
            onClick={() => setFamille(i)}
            className={`min-h-9 shrink-0 rounded-full px-3 text-[12.5px] transition-colors ${
              famille === i
                ? 'bg-encre font-semibold text-fond'
                : 'border border-bordure text-encre-douce hover:text-encre'
            }`}
          >
            {f.famille}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {AVATARS[famille].liste.map((a) => (
          <button
            key={a}
            type="button"
            disabled={enCours}
            onClick={() => onChoisir(a)}
            aria-pressed={avatar === a}
            aria-label={`Avatar ${a}`}
            className={`appui flex h-11 items-center justify-center rounded-bloc text-2xl transition-colors ${
              avatar === a
                ? 'border-2 border-encre bg-verre-fort'
                : 'border border-white/[0.08] bg-verre hover:bg-verre-fort'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
