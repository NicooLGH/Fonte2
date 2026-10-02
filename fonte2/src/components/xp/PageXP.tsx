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
import { bornesSemaine } from '@/lib/semaine'
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
}: {
  total: number
  journal: PageJournal
  ongletInitial: Onglet
}) {
  const [onglet, setOnglet] = useState<Onglet>(ongletInitial)
  const n = calculerNiveau(total)

  return (
    <div className="mx-auto flex max-w-xl flex-col py-4">
      <Link
        href="/profil"
        className="flex min-h-11 items-center gap-1.5 self-start text-[13px] text-encre-douce
                   transition-colors hover:text-encre"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Profil
      </Link>

      <h1 className="mt-2 text-[46px]">XP &amp; niveaux</h1>

      {/* Résumé */}
      <div className="mt-5 flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center
                     rounded-full border border-accent/50"
        >
          <span className="font-display text-[30px] leading-none text-accent">
            {n.niveau}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-encre-douce">
            {n.rang}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3 font-mono text-[11px] text-encre-douce">
            <span>
              <strong className="font-medium text-encre">
                {total.toLocaleString('fr-FR')}
              </strong>{' '}
              XP
            </span>
            <span>
              {(n.xpSuivant - total).toLocaleString('fr-FR')} avant niv. {n.niveau + 1}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-verre-fort">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.round(n.progression * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div
        role="tablist"
        className="mt-6 flex gap-1 rounded-bloc border border-bordure bg-verre p-1"
      >
        {(
          [
            ['bareme', 'Barème'],
            ['journal', 'Journal'],
          ] as const
        ).map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            role="tab"
            aria-selected={onglet === cle}
            onClick={() => setOnglet(cle)}
            className={`h-[38px] flex-1 rounded-[9px] text-[13px] font-semibold transition-colors ${
              onglet === cle
                ? 'bg-encre text-fond'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {onglet === 'bareme' ? (
        <Bareme niveau={n.niveau} />
      ) : (
        <Journal initial={journal} />
      )}
    </div>
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
          detail="une par jour"
          valeur={`+${b.seance}`}
        />
        <Ligne
          titre="Relevé hebdo"
          detail={`+${b.bonusDimanche} de plus s'il est fait le dimanche`}
          valeur={`+${b.releve}`}
        />
        <Ligne
          titre="Semaine complète"
          detail="au moins une séance et un relevé"
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
          detail={`${b.seriesPlafondSeance} XP au maximum par séance`}
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
        <div className="grid grid-cols-3 font-mono text-xs">
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

      <p className="mt-6 font-mono text-[10.5px] leading-relaxed text-encre-douce">
        L&apos;XP ne se perd jamais, sauf si tu supprimes la séance ou le relevé
        qui l&apos;a rapportée.
      </p>
    </div>
  )
}

function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <p className="section-titre mb-1">{titre}</p>
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
        <p className="text-sm">{titre}</p>
        <p className="mt-0.5 font-mono text-[10.5px] leading-relaxed text-encre-douce">
          {detail}
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-[13px] ${
          estompe ? 'text-encre-douce' : 'text-accent-2'
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
      <p className="entree-page mt-8 text-sm leading-relaxed text-encre-douce">
        Ton journal est vide pour l&apos;instant. Enregistre une séance ou ton
        relevé de la semaine : chaque gain d&apos;XP apparaîtra ici, avec sa
        raison et sa date.
      </p>
    )
  }

  return (
    <div className="entree-page">
      {semaines.map((s) => (
        <section key={s.cle} className="mt-7">
          <div className="flex items-baseline justify-between border-b border-bordure pb-2">
            <p className="section-titre">
              Semaine {parseInt(s.cle.split('-W')[1], 10)} · {bornesSemaine(s.cle)}
            </p>
            <span className="font-display text-[22px] leading-none text-accent-2">
              +{s.total}
            </span>
          </div>
          <ul>
            {s.lignes.map((l, i) => (
              <li
                key={i}
                className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-baseline gap-x-2.5
                           border-b border-filet py-2.5 last:border-0"
              >
                <span className="font-mono text-[10.5px] text-encre-douce">
                  {jourCourt(l.date)}
                </span>
                <span className="text-sm">{l.libelle}</span>
                <span className="font-mono text-[13px] text-accent-2">+{l.montant}</span>
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
          className="mt-5 min-h-12 w-full border-t border-filet font-mono text-[11px]
                     text-encre-douce transition-colors hover:text-encre disabled:opacity-50"
        >
          {enCours ? 'Chargement…' : 'Voir les semaines précédentes'}
        </button>
      )}

      <p className="mt-4 font-mono text-[10.5px] leading-relaxed text-encre-douce">
        Ton journal est privé. Tes amis verront ton niveau, jamais ce détail.
      </p>
    </div>
  )
}

/** « mer. 1 » */
function jourCourt(date: string): string {
  const d = new Date(date + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return date
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short' })} ${d.getDate()}`
}
