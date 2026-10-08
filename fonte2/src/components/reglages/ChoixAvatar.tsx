'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AVATARS } from '@/lib/recompenses'
import { usePastille, Pastille } from '@/components/ui/Pastille'
import { Visage } from '@/components/Visage'
import { CATALOGUE, estAvatarSpecial, possede, valeurAvatar, type Possession } from '@/lib/boutique'

/* ============================================================
   Choix de l'avatar
   ============================================================
   Plus de cent avatars, tous libres, rangés par famille. Le
   cadre, lui, dépend du rang : l'aperçu le montre pour juger
   du rendu final.
   ============================================================ */

const SPECIAUX = CATALOGUE.filter((o) => o.type === 'avatar')

export function ChoixAvatar({
  avatar,
  enCours,
  onChoisir,
  possessions = [],
}: {
  avatar: string
  /** Gardé pour compatibilité : l'aperçu vit dans l'écran parent. */
  cadre?: string
  enCours: boolean
  onChoisir: (a: string) => void
  /** Objets achetés en boutique (avatars spéciaux). */
  possessions?: Possession[]
}) {
  // La boutique est la dernière famille ; on ouvre celle de l'avatar actuel.
  const familles = [...AVATARS.map((f) => f.famille), 'Boutique']
  const indexBoutique = familles.length - 1
  const initiale = estAvatarSpecial(avatar) ? indexBoutique : AVATARS.findIndex((f) => f.liste.includes(avatar))
  const [famille, setFamille] = useState(initiale < 0 ? 0 : initiale)
  const pastille = usePastille(famille)

  return (
    <div className="flex flex-col gap-3">

      <div ref={pastille.ref} role="tablist" className="defilement-isole relative -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <Pastille pos={pastille.pos} />
        {familles.map((f, i) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={famille === i}
            data-actif={famille === i}
            onClick={() => setFamille(i)}
            className={`relative h-10 shrink-0 rounded-full px-4 text-[14px] transition-colors duration-300 ${
              famille === i
                ? `${pastille.fond} font-semibold text-fond`
                : 'bg-verre text-encre-douce hover:text-encre'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {famille === indexBoutique ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {SPECIAUX.map((o) => {
              const a = possede(possessions, 'avatar', o.cle)
              const valeur = valeurAvatar(o.cle)
              return (
                <button
                  key={o.cle}
                  type="button"
                  disabled={enCours || !a}
                  onClick={() => onChoisir(valeur)}
                  aria-pressed={avatar === valeur}
                  aria-label={a ? `Avatar ${o.nom}` : `Avatar ${o.nom}, en boutique`}
                  className={`appui flex h-[68px] flex-col items-center justify-center gap-0.5 rounded-bloc text-[34px] transition-colors ${
                    avatar === valeur ? 'bg-verre-fort ring-2 ring-encre' : 'bg-verre hover:bg-verre-fort'
                  } ${a ? '' : 'opacity-40'}`}
                >
                  <Visage avatar={valeur} />
                  {!a && <span className="text-[10px] text-encre-douce">boutique</span>}
                </button>
              )
            })}
          </div>
          <Link href="/boutique" className="px-0.5 text-[14px] font-semibold text-accent-2">
            Voir les avatars en boutique ›
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  )
}
