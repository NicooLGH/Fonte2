'use client'

import { useState, useTransition } from 'react'
import type { PublicationSeance } from '@/lib/social'
import { Publication } from './Fil'
import { pageSuivante } from '@/app/(carnet)/profil/actions'

/* ============================================================
   Historique des séances
   ============================================================
   Tout l'historique, chargé par pages de dix. Le détail des
   séries se déplie séance par séance : afficher tout d'emblée
   rendrait la liste illisible dès la vingtième.
   ============================================================ */

export function Historique({
  cible,
  initiales,
  total,
  moi,
}: {
  cible: string
  initiales: PublicationSeance[]
  total: number
  /** Sur son propre profil, pas de boutons de réaction. */
  moi: boolean
}) {
  const [seances, setSeances] = useState(initiales)
  const [enCours, demarrer] = useTransition()

  const reste = total - seances.length

  function charger() {
    demarrer(async () => {
      const suite = await pageSuivante(cible, seances.length)
      setSeances((s) => [...s, ...suite])
    })
  }

  if (total === 0)
    return (
      <p className="px-0.5 text-[15px] leading-relaxed text-encre-douce">
        {moi
          ? "Aucune séance enregistrée pour l'instant."
          : 'Cette personne ne partage pas ses séances.'}
      </p>
    )

  return (
    <div className="flex flex-col gap-3">

      {seances.map((s) => (
        <Publication key={s.seanceId} p={s} sansAuteur interactif={!moi} />
      ))}

      {reste > 0 && (
        <button
          type="button"
          onClick={charger}
          disabled={enCours}
          className="appui h-12 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce
                     hover:text-encre disabled:opacity-50"
        >
          {enCours ? 'Chargement…' : `Voir plus · ${reste} restante${reste > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}
