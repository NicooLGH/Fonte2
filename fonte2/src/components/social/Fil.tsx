'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  SIGNES_REACTION,
  dateRelative,
  dureeLisible,
  type PublicationSeance,
  type Signe,
} from '@/lib/social'
import { reagirSeance, retirerReaction } from '@/app/(carnet)/amis/actions'
import { TexteAjuste } from '@/components/ui/TexteAjuste'
import { Visage } from '@/components/Visage'

/* ============================================================
   Fil des amis
   ============================================================
   Les séances des amis sur les deux dernières semaines, une par
   bloc. Seuls les amis qui ont choisi de partager leurs séances
   apparaissent ici (règle portée par la base).
   ============================================================ */

const PAS = 10

export function Fil({
  publications,
  nbAmis,
}: {
  publications: PublicationSeance[]
  nbAmis: number
}) {
  const [visibles, setVisibles] = useState(PAS)

  if (nbAmis === 0) {
    return (
      <div className="bloc motif-cercles flex flex-col gap-2 p-5">
        <p className="font-display text-[34px] leading-none">Seul pour l&apos;instant</p>
        <p className="text-[15px] leading-relaxed text-encre-douce">
          Ajoute un ami avec le bouton + en haut : ses séances apparaîtront ici, et vous pourrez
          vous encourager.
        </p>
      </div>
    )
  }

  if (publications.length === 0) {
    return (
      <p className="px-0.5 text-[15px] leading-relaxed text-encre-douce">
        Aucune séance d&apos;ami ces deux dernières semaines. Seuls les amis qui partagent leurs
        séances apparaissent ici.
      </p>
    )
  }

  const reste = publications.length - visibles

  return (
    <div className="flex flex-col gap-3">
      {publications.slice(0, visibles).map((p) => (
        <Publication key={p.seanceId} p={p} />
      ))}

      {reste > 0 && (
        <button
          type="button"
          onClick={() => setVisibles(visibles + PAS)}
          className="appui h-12 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce hover:text-encre"
        >
          Voir plus
        </button>
      )}
    </div>
  )
}

/* ---- Une séance d'ami ---- */

export function Publication({
  p,
  sansAuteur = false,
  interactif = true,
}: {
  p: PublicationSeance
  /** Sur le profil de l'ami, son nom est déjà en haut. */
  sansAuteur?: boolean
  /** Faux sur ses propres séances : on ne réagit pas à soi-même. */
  interactif?: boolean
}) {
  const [detail, setDetail] = useState(false)
  // Réaction affichée tout de suite ; la base suit en arrière-plan.
  const [maReaction, setMaReaction] = useState<Signe | null>(p.maReaction)
  const [reactions, setReactions] = useState<Record<string, number>>(p.reactions)
  const [erreur, setErreur] = useState<string | null>(null)
  const [, demarrer] = useTransition()

  function reagir(signe: Signe) {
    const avant = { maReaction, reactions }
    const nouveau = maReaction === signe ? null : signe
    const compte = { ...reactions }
    if (maReaction) {
      compte[maReaction] = (compte[maReaction] ?? 1) - 1
      if (compte[maReaction] <= 0) delete compte[maReaction]
    }
    if (nouveau) compte[nouveau] = (compte[nouveau] ?? 0) + 1
    setMaReaction(nouveau)
    setReactions(compte)
    setErreur(null)
    demarrer(async () => {
      const r = nouveau ? await reagirSeance(p.seanceId, nouveau) : await retirerReaction(p.seanceId)
      if (r.erreur) {
        setMaReaction(avant.maReaction)
        setReactions(avant.reactions)
        setErreur(r.erreur)
      }
    })
  }
  const duree = dureeLisible(p.dureeSec)
  const quand = p.cree ? dateRelative(p.cree) : dateRelative(p.date + 'T12:00:00')
  const lien = `/u/${encodeURIComponent(p.pseudo)}`

  return (
    <article className="bloc flex flex-col gap-3 p-4">
      {!sansAuteur && (
        <header className="flex items-center gap-3">
          <Link
            href={lien}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-verre-fort text-[20px]"
            aria-label={`Profil de ${p.pseudo}`}
          >
            <Visage avatar={p.avatar} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={lien} className="block truncate text-[16px] font-semibold hover:text-accent-2">
              {p.pseudo}
            </Link>
            <p className="text-[13px] text-encre-douce">{quand}</p>
          </div>
          {p.records.length > 0 && (
            <span className="shrink-0 rounded-pilule bg-accent-2/15 px-2.5 py-1 font-mono text-[12px] text-accent-2">
              record
            </span>
          )}
        </header>
      )}

      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1">
          <TexteAjuste max={34} min={20} className="font-display leading-[0.95]">
            {p.nom || 'Séance'}
          </TexteAjuste>
        </span>
        {sansAuteur && <span className="shrink-0 text-[13px] text-encre-douce">{quand}</span>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {duree && <Etiquette>{duree}</Etiquette>}
        {p.volume > 0 && <Etiquette>{tonnage(p.volume)}</Etiquette>}
        {p.records.slice(0, 2).map((r) => (
          <Etiquette key={r} bleu>
            Record · {r}
          </Etiquette>
        ))}
      </div>

      {p.note && <p className="selectionnable text-[15px] leading-relaxed">{p.note}</p>}

      <div className="flex items-center gap-1.5">
        {SIGNES_REACTION.map((signe) => {
          const choisi = maReaction === signe
          const n = reactions[signe] ?? 0
          return (
            <button
              key={signe}
              type="button"
              disabled={!interactif}
              onClick={() => reagir(signe)}
              aria-pressed={choisi}
              aria-label={`${choisi ? 'Retirer' : 'Réagir'} ${signe}${n ? `, ${n}` : ''}`}
              className={`appui flex h-9 min-w-9 items-center justify-center gap-1 rounded-pilule px-2 text-[16px] transition-colors ${
                choisi ? 'bg-accent/20 ring-1 ring-accent/40' : 'bg-encre/[0.06] hover:bg-encre/10'
              }`}
            >
              {signe}
              {n > 0 && <span className="font-mono text-[12px] text-encre-douce">{n}</span>}
            </button>
          )
        })}
        <span className="flex-1" />
        {p.blocs.length > 0 && (
          <button
            type="button"
            onClick={() => setDetail(!detail)}
            aria-expanded={detail}
            aria-label={detail ? 'Masquer les séries' : 'Voir les séries'}
            className="flex h-9 w-9 items-center justify-center rounded-pilule text-encre-douce hover:text-encre"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={`transition-transform ${detail ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
      {detail && p.blocs.length > 0 && (
        <ul className="flex flex-col">
          {p.blocs.map((b) => (
            <li key={b.nom} className="border-b border-filet py-2.5 last:border-0">
              <p className="text-[15px] font-semibold">{b.nom}</p>
              <p className="mt-0.5 font-mono text-[13px] text-encre-douce">
                {b.series.map((s) => `${s.poids}×${s.reps}`).join('  ·  ')}
              </p>
            </li>
          ))}
        </ul>
      )}

      {erreur && <p className="font-mono text-[12px] text-accent">{erreur}</p>}
    </article>
  )
}

function Etiquette({ children, bleu = false }: { children: React.ReactNode; bleu?: boolean }) {
  return (
    <span
      className={`rounded-pilule px-2.5 py-1 font-mono text-[13px] ${
        bleu ? 'bg-accent-2/15 text-accent-2' : 'bg-encre/[0.06] text-encre-douce'
      }`}
    >
      {children}
    </span>
  )
}

function tonnage(kg: number) {
  return `${Math.round(kg).toLocaleString('fr-FR')} kg`
}
