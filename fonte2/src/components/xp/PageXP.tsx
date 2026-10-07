'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  BAREME,
  RANGS,
  calculerNiveau,
  xpCumulePourNiveau,
  type GainXP,
  type PageJournal,
} from '@/lib/xp'
import { bornesSemaine, lundiDe, semaineCourante } from '@/lib/semaine'
import { PisteNiveaux, type AmiPiste } from './PisteNiveaux'
import { RECOMPENSES, LIBELLE_TYPE } from '@/lib/recompenses'
import { journalSuite } from '@/app/(carnet)/xp/actions'

/* ============================================================
   XP et niveaux — barème et journal
   ============================================================
   Le barème affiché est tiré des mêmes constantes que celles
   documentées pour le calcul : il ne peut pas raconter autre
   chose que ce que fait la base.
   ============================================================ */

type Onglet = 'bareme' | 'journal'

export function PageXP({
  total,
  journal,
  ongletInitial,
  amis = [],
}: {
  total: number
  journal: PageJournal
  ongletInitial: Onglet
  amis?: AmiPiste[]
}) {
  const [onglet, setOnglet] = useState<Onglet>(ongletInitial)
  const n = calculerNiveau(total)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 py-4">
      <div className="flex h-11 items-center justify-between">
        <Link
          href="/profil"
          aria-label="Retour au profil"
          className="-ml-2 flex h-11 w-11 items-center justify-center text-encre"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <button
          type="button"
          onClick={() => setOnglet(onglet === 'bareme' ? 'journal' : 'bareme')}
          className="h-10 rounded-pilule bg-verre px-4 text-[15px] font-semibold"
        >
          {onglet === 'bareme' ? 'Mon journal' : 'Barème'}
        </button>
      </div>

      {/* Niveau */}
      <div className="flex items-center gap-4 px-0.5">
        <span className="font-display text-[84px] leading-[0.8] text-accent">{n.niveau}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-mono text-[13px] text-encre-douce uppercase">
            {n.rang} · {total.toLocaleString('fr-FR')} XP
          </span>
          <div className="h-2 overflow-hidden rounded-pilule bg-encre/[0.08]">
            <div className="h-full rounded-pilule bg-accent" style={{ width: `${Math.round(n.progression * 100)}%` }} />
          </div>
          <span className="text-[14px] text-encre-douce">
            −{(n.xpSuivant - total).toLocaleString('fr-FR')} avant le niveau {n.niveau + 1}
          </span>
        </div>
      </div>

      {onglet === 'bareme' ? (
        <Bareme niveau={n.niveau} />
      ) : (
        <>
          <div className="bloc motif-cercles py-3.5">
            <PisteNiveaux niveau={n.niveau} progression={n.progression} amis={amis} />
          </div>
          <Semaine entrees={journal.entrees} />
          <Journal initial={journal} />
        </>
      )}
    </div>
  )
}

/* ---- Cette semaine, en barres ---- */

function Semaine({ entrees }: { entrees: GainXP[] }) {
  const cle = semaineCourante()
  const jours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundiDe(cle).getTime() + i * 86400000)
    return d.toISOString().slice(0, 10)
  })
  const parJour = jours.map((j) =>
    entrees.filter((e) => e.date === j).reduce((t, e) => t + e.montant, 0)
  )
  const total = parJour.reduce((t, v) => t + v, 0)
  const max = Math.max(...parJour, 1)
  const auj = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })

  return (
    <section className="flex flex-col gap-3 px-0.5">
      <div className="flex items-baseline justify-between">
        <span className="section-titre">Cette semaine</span>
        <span className="font-display text-[30px] leading-none text-accent">+{total}</span>
      </div>
      <div className="grid h-[96px] grid-cols-7 items-end gap-2" role="img" aria-label={`${total} XP gagnés cette semaine`}>
        {jours.map((j, i) => (
          <div key={j} className="flex h-full flex-col items-stretch justify-end gap-1.5">
            <span
              className={`rounded-[8px] ${parJour[i] > 0 ? 'bg-accent' : 'bg-encre/[0.08]'}`}
              style={{ height: parJour[i] > 0 ? `${Math.max(10, (parJour[i] / max) * 72)}px` : '6px' }}
              title={`+${parJour[i]} XP`}
            />
            <span className={`text-center font-mono text-[12px] ${j === auj ? 'text-encre' : 'text-encre-douce'}`}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---- Barème ---- */

function Bareme({ niveau }: { niveau: number }) {
  const b = BAREME
  return (
    <div className="entree-page">
      <Groupe titre="Régularité">
        <Ligne
          titre="Séance enregistrée"
          detail="la première du jour ; les suivantes comptent pour leurs séries"
          valeur={`+${b.seance}`}
        />
        <Ligne titre="Cardio" detail="le premier du jour" valeur={`+${b.cardio}`} />
        <Ligne
          titre="Relevé hebdo"
          detail={`+${b.bonusDimanche} de plus s'il est fait le dimanche`}
          valeur={`+${b.releve}`}
        />
        <Ligne
          titre="Semaine complète"
          detail="au moins une séance (ou un cardio) et un relevé"
          valeur={`+${b.semaineComplete}`}
        />
        <Ligne
          titre="Série de semaines"
          detail={`${b.serieSemaines} × la série, jusqu'à +${b.serieSemainesPlafond} par semaine. Donné à la première séance de la semaine. Rater une semaine remet la série à zéro, sans rien retirer.`}
          valeur={`+${b.serieSemaines} → +${b.serieSemainesPlafond}`}
        />
      </Groupe>

      <Groupe titre="Effort">
        <Ligne
          titre="Série validée"
          detail={`${b.seriesPlafondSeance} XP au maximum par jour`}
          valeur={`+${b.serieValidee}`}
        />
      </Groupe>

      <Groupe titre="Progression">
        <Ligne
          titre="Record de 1RM estimé"
          detail="1 par exercice et par séance. La première fois sur un exercice sert de référence."
          valeur={`+${b.record}`}
        />
        <Ligne
          titre="Palier de badge"
          detail="Bronze 25 · Argent 50 · Or 100 · Platine 200 · Diamant 400. Les badges « Moments » valent 100."
          valeur="+25 → +400"
        />
        <Ligne
          titre="Défi réussi"
          detail="L'XP est fixée défi par défi, et chaque défi apporte son badge unique. Voir les défis en cours depuis l'accueil."
          valeur="variable"
        />
      </Groupe>

      <Groupe titre="Rangs">
        <div className="grid grid-cols-3 font-mono text-[14px]">
          {RANGS.map((r) => {
            const actuel =
              niveau >= r.niveau &&
              !RANGS.some((x) => x.niveau > r.niveau && niveau >= x.niveau)
            const atteint = niveau >= r.niveau
            const ton = actuel
              ? 'text-accent-clair font-medium'
              : atteint
                ? 'text-encre-douce'
                : 'text-encre'
            return (
              <div key={r.nom} className="contents">
                <span className={`border-b border-filet py-2.5 ${ton}`}>
                  {r.nom}
                  {actuel && ' · toi'}
                </span>
                <span className={`border-b border-filet py-2.5 ${ton}`}>
                  niv. {r.niveau}
                </span>
                <span className={`border-b border-filet py-2.5 text-right ${ton}`}>
                  {xpCumulePourNiveau(r.niveau).toLocaleString('fr-FR')}
                </span>
              </div>
            )
          })}
        </div>
      </Groupe>

      <Groupe titre="Récompenses de niveau">
        {[...new Set(RECOMPENSES.filter((r) => r.niveau > 0).map((r) => r.niveau))]
          .sort((a, b) => a - b)
          .map((n) => {
            const atteint = niveau >= n
            return (
              <div
                key={n}
                className={`flex justify-between gap-4 border-b border-filet py-2.5 ${
                  atteint ? '' : 'opacity-60'
                }`}
              >
                <span className={`shrink-0 font-mono text-[14px] ${atteint ? 'text-accent-clair' : ''}`}>
                  {atteint ? '✓ ' : ''}niv. {n}
                </span>
                <span className="text-right text-[15px]">
                  {RECOMPENSES.filter((r) => r.niveau === n)
                    .map((r) => `${LIBELLE_TYPE[r.type]} ${r.nom}`)
                    .join(' · ')}
                </span>
              </div>
            )
          })}
      </Groupe>

      <p className="mt-6 text-[13px] leading-relaxed text-encre-douce">
        L&apos;XP ne se perd jamais, sauf si tu supprimes la séance ou le relevé
        qui l&apos;a rapportée.
      </p>
    </div>
  )
}

function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <p className="section-titre mb-1 px-0.5">{titre}</p>
      {children}
    </section>
  )
}

function Ligne({
  titre,
  detail,
  valeur,
  estompe = false,
}: {
  titre: string
  detail: string
  valeur: string
  estompe?: boolean
}) {
  return (
    <div
      className={`flex justify-between gap-4 border-b border-filet py-3 ${
        estompe ? 'opacity-50' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="text-[16px]">{titre}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-encre-douce">
          {detail}
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-[15px] ${
          estompe ? 'text-encre-douce' : 'text-accent-clair'
        }`}
      >
        {valeur}
      </span>
    </div>
  )
}

/* ---- Journal ---- */

function Journal({ initial }: { initial: PageJournal }) {
  const [entrees, setEntrees] = useState<GainXP[]>(initial.entrees)
  const [suite, setSuite] = useState(initial.suite)
  const [enCours, demarrer] = useTransition()

  // Regroupées par semaine, dans l'ordre reçu (déjà trié par la base).
  const semaines: { cle: string; total: number; lignes: GainXP[] }[] = []
  for (const e of entrees) {
    let s = semaines.at(-1)
    if (!s || s.cle !== e.semaine) {
      s = { cle: e.semaine, total: 0, lignes: [] }
      semaines.push(s)
    }
    s.total += e.montant
    s.lignes.push(e)
  }

  function plus() {
    const derniere = semaines.at(-1)?.cle
    if (!derniere) return
    demarrer(async () => {
      const r = await journalSuite(derniere)
      setEntrees((l) => [...l, ...r.entrees])
      setSuite(r.suite)
    })
  }

  if (entrees.length === 0) {
    return (
      <p className="px-0.5 text-[15px] leading-relaxed text-encre-douce">
        Ton journal est vide pour l&apos;instant. Chaque gain d&apos;XP apparaîtra ici, avec sa
        raison et sa date.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {semaines.map((s) => (
        <section key={s.cle} className="flex flex-col">
          <div className="flex items-baseline justify-between px-0.5 pb-1">
            <p className="etiquette">
              Sem. {parseInt(s.cle.split('-W')[1], 10)} · {bornesSemaine(s.cle)}
            </p>
            <span className="font-mono text-[14px] text-accent-clair">+{s.total}</span>
          </div>
          <ul className="flex flex-col">
            {s.lignes.map((l, i) => (
              <li key={i} className="flex min-h-[54px] items-center gap-3 px-0.5">
                <IconeSource source={l.source} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[16px]">{l.libelle}</span>
                  <span className="text-[13px] text-encre-douce">{jourCourt(l.date)}</span>
                </span>
                <span className="font-mono text-[15px] text-accent-clair">+{l.montant}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {suite && (
        <button
          type="button"
          onClick={plus}
          disabled={enCours}
          className="appui h-12 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce
                     hover:text-encre disabled:opacity-50"
        >
          {enCours ? 'Chargement…' : 'Semaines précédentes'}
        </button>
      )}

      <p className="px-0.5 text-[13px] leading-relaxed text-encre-douce">
        Ton journal est privé. Tes amis voient ton niveau, jamais ce détail.
      </p>
    </div>
  )
}

/** Une icône par type de gain. */
function IconeSource({ source }: { source: GainXP['source'] }) {
  const style: Record<string, string> = {
    record: 'bg-accent-2/15 text-accent-2',
    badge: 'bg-[#f0c04a]/15 text-[#f0c04a]',
    defi: 'bg-[#f0c04a]/15 text-[#f0c04a]',
    semaine: 'bg-accent/15 text-accent-clair',
    releve: 'bg-accent-2/15 text-accent-2',
    cardio: 'bg-accent-2/15 text-accent-2',
  }
  const chemins: Record<string, React.ReactNode> = {
    seance: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
    serie: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
    cardio: <><circle cx="14" cy="4" r="2" /><path d="M6 21l3-6 3 2v5M9 15l1-5 4 1 3 3M10 10l-3 2" /></>,
    record: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
    releve: <path d="M5 19v-7M12 19V5M19 19v-10M3 21h18" />,
    semaine: <path d="M12 22c4 0 7-2.7 7-6.8 0-3.2-2-5.6-3.6-7.3-.4 1.9-1.4 3.1-2.6 3.6.3-3.4-1.3-6.6-4.3-8.5.2 3.1-1.5 5-3 6.8C4.3 11.3 5 13.6 5 15.2 5 19.3 8 22 12 22z" />,
    badge: <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" />,
    defi: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />,
  }
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${style[source] ?? 'bg-verre text-encre'}`}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {chemins[source] ?? chemins.seance}
      </svg>
    </span>
  )
}

/** « mer. 1 » */
function jourCourt(date: string): string {
  const d = new Date(date + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return date
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short' })} ${d.getDate()}`
}
