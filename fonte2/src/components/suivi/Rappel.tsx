'use client'

import Link from 'next/link'
import { useTransition, useState } from 'react'
import { ecarterRappel } from '@/app/(carnet)/reglages/rappel'

/**
 * Bandeau de rappel du relevé hebdomadaire.
 *
 * Discret et écartable : un pense-bête, pas une injonction. Une
 * fois écarté, il ne revient pas avant la semaine suivante.
 */
export function Rappel() {
  const [masque, setMasque] = useState(false)
  const [, demarrer] = useTransition()

  if (masque) return null

  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-carte border
                 border-accent-2/40 bg-accent-2/[0.07] px-5 py-4"
    >
      <p className="min-w-0 flex-1 text-sm leading-relaxed">
        <span className="font-semibold">C&apos;est le jour de ton relevé.</span>{' '}
        <span className="text-encre-douce">
          Poids, calories, mensurations — ce que tu veux, rien n&apos;est
          obligatoire.
        </span>
      </p>

      <div className="flex shrink-0 gap-2">
        <Link
          href="/suivi"
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white
                     transition-colors hover:bg-accent-clair"
        >
          Remplir
        </Link>
        <button
          type="button"
          onClick={() => {
            setMasque(true)
            demarrer(async () => {
              await ecarterRappel()
            })
          }}
          className="rounded-full border border-bordure px-4 py-2 text-xs
                     font-semibold text-encre-douce transition-colors hover:text-encre"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
