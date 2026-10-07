'use client'

import { useState, useTransition } from 'react'
import type { PublicationSeance, Signe } from '@/lib/social'
import { Publication } from './Fil'
import { reagirSeance, retirerReaction } from '@/app/(carnet)/amis/actions'
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
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  const reste = total - seances.length

  function charger() {
    demarrer(async () => {
      const suite = await pageSuivante(cible, seances.length)
      setSeances((s) => [...s, ...suite])
    })
  }

  function reagir(id: string, signe: Signe, dejaMise: boolean) {
    setErreur(null)
    demarrer(async () => {
      const r = dejaMise
        ? await retirerReaction(id)
        : await reagirSeance(id, signe)
      if (r.erreur) {
        setErreur(r.erreur)
        return
      }
      setSeances((liste) =>
        liste.map((s) =>
          s.seanceId === id
            ? {
                ...s,
                maReaction: dejaMise ? null : signe,
                reactions: recompter(s.reactions, s.maReaction, dejaMise ? null : signe),
              }
            : s
        )
      )
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
      {erreur && (
        <p className="rounded-bloc bg-accent/10 px-4 py-3 font-mono text-[12px] text-accent">{erreur}</p>
      )}

      {seances.map((s) => (
        <Publication key={s.seanceId} p={s} sansAuteur onReagir={moi ? undefined : reagir} />
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

function recompter(
  actuel: Record<string, number>,
  avant: Signe | null,
  apres: Signe | null
): Record<string, number> {
  const suite = { ...actuel }
  if (avant) {
    suite[avant] = (suite[avant] ?? 1) - 1
    if (suite[avant] <= 0) delete suite[avant]
  }
  if (apres) suite[apres] = (suite[apres] ?? 0) + 1
  return suite
}
