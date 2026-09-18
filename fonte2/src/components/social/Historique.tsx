'use client'

import { useState, useTransition } from 'react'
import {
  SIGNES_REACTION,
  dureeLisible,
  type PublicationSeance,
  type Signe,
} from '@/lib/social'
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
      <p className="text-sm italic text-encre-douce">
        {moi
          ? "Aucune séance enregistrée pour l'instant."
          : 'Cette personne ne partage pas ses séances.'}
      </p>
    )

  return (
    <div>
      {erreur && (
        <p className="mb-4 rounded-bloc border border-accent/40 bg-accent/10 px-4 py-3
                      font-mono text-xs text-accent">
          {erreur}
        </p>
      )}

      <div className="entree-liste divide-y divide-filet">
        {seances.map((s) => (
          <Seance key={s.seanceId} s={s} moi={moi} onReagir={reagir} />
        ))}
      </div>

      {reste > 0 && (
        <button
          type="button"
          onClick={charger}
          disabled={enCours}
          className="mt-4 w-full border-t border-filet py-3.5 font-mono text-[11px]
                     text-encre-douce transition-colors hover:text-encre
                     disabled:opacity-50"
        >
          {enCours
            ? 'chargement…'
            : `voir ${reste === 1 ? 'la dernière' : `les ${Math.min(reste, 10)} suivantes`} · ${reste} restante${reste > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}

function Seance({
  s,
  moi,
  onReagir,
}: {
  s: PublicationSeance
  moi: boolean
  onReagir: (id: string, signe: Signe, dejaMise: boolean) => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const duree = dureeLisible(s.dureeSec)

  return (
    <article className="py-4">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        className="flex w-full items-baseline justify-between gap-4 text-left"
      >
        <span className="min-w-0">
          <span className="block font-mono text-[11px] text-encre-douce">
            {s.date}
            {duree && ` · ${duree}`}
          </span>
          <span className="mt-0.5 block truncate text-sm">
            {s.blocs.map((b) => b.nom).join(', ') || '—'}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="font-display text-xl">
            {Math.round(s.volume)}
            <span className="ml-1 font-corps text-[10px] text-encre-douce">kg</span>
          </span>
          <span className="mt-0.5 block font-mono text-[10px] text-encre-douce">
            {ouvert ? 'masquer' : 'détail'}
          </span>
        </span>
      </button>

      {s.note && (
        <p className="mt-2 text-[13px] italic leading-relaxed text-encre-douce">
          {s.note}
        </p>
      )}

      {ouvert && s.blocs.length > 0 && (
        <div className="mt-3 border-l border-filet pl-4">
          {s.blocs.map((b) => (
            <div
              key={b.nom}
              className="flex items-start justify-between gap-3 border-b border-filet
                         py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{b.nom}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {b.series.map((x, i) => (
                    <span
                      key={i}
                      className="rounded-bloc bg-verre px-2 py-0.5 font-mono text-[11px]
                                 text-encre-douce"
                    >
                      {x.poids}×{x.reps}
                    </span>
                  ))}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-encre-douce">
                {Math.round(b.volume)} kg
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {Object.entries(s.reactions).map(([signe, n]) => (
          <span
            key={signe}
            className="rounded-bloc bg-verre px-2.5 py-1 font-mono text-[11px]
                       text-encre-douce"
          >
            {signe} {n}
          </span>
        ))}

        {!moi &&
          SIGNES_REACTION.map((signe) => {
            const choisi = s.maReaction === signe
            return (
              <button
                key={signe}
                type="button"
                onClick={() => onReagir(s.seanceId, signe, choisi)}
                aria-pressed={choisi}
                aria-label={choisi ? `Retirer ${signe}` : `Réagir ${signe}`}
                className={`flex h-8 w-8 items-center justify-center rounded-bloc
                  text-sm transition-colors ${
                    choisi ? 'bg-accent-2/20' : 'bg-verre hover:bg-verre-fort'
                  }`}
              >
                {signe}
              </button>
            )
          })}
      </div>
    </article>
  )
}

/** Met à jour les compteurs sans rappeler la base. */
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
