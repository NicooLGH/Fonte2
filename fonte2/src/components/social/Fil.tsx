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
  const [erreur, setErreur] = useState<string | null>(null)
  const [, demarrer] = useTransition()

  function reagir(seanceId: string, signe: Signe, dejaMise: boolean) {
    setErreur(null)
    demarrer(async () => {
      const r = dejaMise ? await retirerReaction(seanceId) : await reagirSeance(seanceId, signe)
      if (r.erreur) setErreur(r.erreur)
    })
  }

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
      {erreur && (
        <p className="rounded-bloc bg-accent/10 px-4 py-3 font-mono text-[12px] text-accent">{erreur}</p>
      )}

      {publications.slice(0, visibles).map((p) => (
        <Publication key={p.seanceId} p={p} onReagir={reagir} />
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
  onReagir,
  sansAuteur = false,
}: {
  p: PublicationSeance
  onReagir?: (id: string, signe: Signe, dejaMise: boolean) => void
  /** Sur le profil de l'ami, son nom est déjà en haut. */
  sansAuteur?: boolean
}) {
  const [detail, setDetail] = useState(false)
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
            {p.avatar ?? '💪'}
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

      <p className="font-display text-[34px] leading-[0.9]">
        {p.nom || 'Séance'}
        {sansAuteur && <span className="ml-2 font-corps text-[13px] text-encre-douce">{quand}</span>}
      </p>

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

      <div className="flex items-center gap-1.5">
        {SIGNES_REACTION.map((signe) => {
          const choisi = p.maReaction === signe
          const n = p.reactions[signe] ?? 0
          return (
            <button
              key={signe}
              type="button"
              disabled={!onReagir}
              onClick={() => onReagir?.(p.seanceId, signe, choisi)}
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
  return kg >= 1000
    ? `${(kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`
    : `${Math.round(kg)} kg`
}
