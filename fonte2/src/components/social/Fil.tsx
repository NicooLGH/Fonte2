'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  SIGNES_REACTION,
  dureeLisible,
  type PublicationSeance,
  type Signal,
  type Signe,
} from '@/lib/social'
import { reagirSeance, retirerReaction } from '@/app/(carnet)/amis/actions'

/* ============================================================
   Fil d'actualité
   ============================================================
   Un seul flux chronologique : les séances des amis et les
   signaux reçus. La pagination est indispensable — sans limite,
   quelques amis actifs suffisent à rendre la page interminable.
   ============================================================ */

const PAS = 10

type Element =
  | { genre: 'seance'; date: string; publication: PublicationSeance }
  | { genre: 'signal'; date: string; signal: Signal }

export function Fil({
  publications,
  signaux,
  nbAmis,
  actifs,
}: {
  publications: PublicationSeance[]
  signaux: Signal[]
  nbAmis: number
  actifs: number
}) {
  const [visibles, setVisibles] = useState(PAS)
  const [erreur, setErreur] = useState<string | null>(null)
  const [, demarrer] = useTransition()

  const elements: Element[] = [
    ...publications.map(
      (p): Element => ({ genre: 'seance', date: p.date, publication: p })
    ),
    ...signaux.map(
      (s): Element => ({ genre: 'signal', date: s.date.slice(0, 10), signal: s })
    ),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const reste = elements.length - visibles

  function reagir(seanceId: string, signe: Signe, dejaMise: boolean) {
    setErreur(null)
    demarrer(async () => {
      const r = dejaMise
        ? await retirerReaction(seanceId)
        : await reagirSeance(seanceId, signe)
      if (r.erreur) setErreur(r.erreur)
    })
  }

  if (nbAmis === 0) {
    return (
      <section className="rounded-carte border border-bordure bg-verre p-6">
        <h2 className="mb-2 text-2xl">Fil d&apos;actualité</h2>
        <p className="text-sm leading-relaxed text-encre-douce">
          Tu n&apos;as pas encore d&apos;amis. Cherche quelqu&apos;un par son
          pseudo dans l&apos;onglet{' '}
          <Link href="/amis" className="font-semibold text-accent">
            Amis
          </Link>
          .
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-carte border border-bordure bg-verre p-5 sm:p-6">
      <h2 className="mb-2 text-2xl">Fil d&apos;actualité</h2>

      <p className="mb-5 text-sm text-encre-douce">
        {actifs === 0 ? (
          "Personne ne s'est entraîné cette semaine. À toi d'ouvrir le bal."
        ) : actifs === nbAmis ? (
          <>
            <strong className="text-encre">Tout le monde</strong> s&apos;est
            entraîné cette semaine.
          </>
        ) : (
          <>
            <strong className="text-encre">
              {actifs} sur {nbAmis}
            </strong>{' '}
            se {actifs > 1 ? 'sont entraînés' : 'est entraîné'} cette semaine.
          </>
        )}
      </p>

      {erreur && (
        <p className="mb-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-xs text-accent">
          {erreur}
        </p>
      )}

      {elements.length === 0 ? (
        <p className="text-sm italic text-encre-douce">
          Rien à afficher pour l&apos;instant.
        </p>
      ) : (
        <div className="divide-y divide-filet">
          {elements.slice(0, visibles).map((e, i) =>
            e.genre === 'seance' ? (
              <Publication
                key={e.publication.seanceId}
                p={e.publication}
                onReagir={reagir}
              />
            ) : (
              <SignalRecu key={`s-${i}`} s={e.signal} />
            )
          )}
        </div>
      )}

      {reste > 0 && (
        <button
          type="button"
          onClick={() => setVisibles(visibles + PAS)}
          className="mt-5 w-full rounded-full border border-bordure bg-verre py-2.5
                     text-xs font-semibold text-encre-douce transition-colors
                     hover:text-encre"
        >
          Voir {reste === 1 ? "l'autre" : `les ${reste} autres`}
        </button>
      )}
    </section>
  )
}

/* ---- Une séance d'ami, présentée comme une publication ---- */

function Publication({
  p,
  onReagir,
}: {
  p: PublicationSeance
  onReagir: (id: string, signe: Signe, dejaMise: boolean) => void
}) {
  const [detail, setDetail] = useState(false)
  const duree = dureeLisible(p.dureeSec)

  return (
    <article className="py-5">
      <header className="mb-3 flex items-center gap-3">
        <Link
          href={`/u/${encodeURIComponent(p.pseudo)}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                     border border-bordure bg-verre text-xl transition-colors
                     hover:border-accent-2/60"
        >
          {p.avatar ?? '💪'}
        </Link>
        <div className="min-w-0">
          <Link
            href={`/u/${encodeURIComponent(p.pseudo)}`}
            className="font-semibold transition-colors hover:text-accent-2"
          >
            {p.pseudo}
          </Link>
          <p className="font-mono text-[11px] text-encre-douce">
            {p.date}
            {duree && ` · ⏱ ${duree}`} · {Math.round(p.volume)} kg
          </p>
        </div>
      </header>

      {p.note && (
        <p className="mb-3 text-[15px] leading-relaxed">{p.note}</p>
      )}

      {p.blocs.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setDetail(!detail)}
            className="font-mono text-[11px] text-accent-2 underline underline-offset-4"
          >
            {detail ? 'Masquer le détail' : 'Voir le détail des séries'}
          </button>

          {detail && (
            <div className="mt-3 rounded-2xl border border-bordure bg-verre p-4">
              {p.blocs.map((b) => (
                <div
                  key={b.nom}
                  className="flex items-start justify-between gap-3 border-b
                             border-filet py-2.5 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{b.nom}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {b.series.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-lg border border-bordure bg-verre-fort
                                     px-2 py-0.5 font-mono text-[11px]"
                        >
                          {s.poids}kg×{s.reps}
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
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {Object.entries(p.reactions).map(([signe, n]) => (
          <span
            key={signe}
            className="rounded-full bg-verre px-3 py-1 font-mono text-xs text-encre-douce"
          >
            {signe} {n}
          </span>
        ))}

        {SIGNES_REACTION.map((signe) => {
          const choisi = p.maReaction === signe
          return (
            <button
              key={signe}
              type="button"
              onClick={() => onReagir(p.seanceId, signe, choisi)}
              aria-pressed={choisi}
              aria-label={choisi ? `Retirer ${signe}` : `Réagir ${signe}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full border
                text-base transition-colors ${
                  choisi
                    ? 'border-accent-2 bg-accent-2/15'
                    : 'border-bordure bg-verre hover:bg-verre-fort'
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

function SignalRecu({ s }: { s: Signal }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <span className="text-2xl leading-none">{s.signe}</span>
      <p className="text-sm text-encre-douce">
        <strong className="text-encre">{s.pseudo}</strong> {s.detail}.
      </p>
    </div>
  )
}
