'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { calculerNiveau, rangSuivant, type GainXP } from '@/lib/xp'
import { vibrer } from '@/lib/sons'
import { Badge } from '@/components/badges/Badge'
import { couleurPalier, definitionBadge, nomPalier } from '@/lib/badges'
import { BadgeDefi } from '@/components/defis/BadgeDefi'
import {
  recompensesEntre,
  cadre as trouverCadre,
  LIBELLE_TYPE,
  type Recompense,
} from '@/lib/recompenses'
import { fondBanniere } from '@/lib/bannieres'
import { motifCss } from '@/lib/motifs'

/* ============================================================
   Récapitulatif d'XP, après l'enregistrement d'une séance
   ============================================================
   Si la séance fait passer un niveau, l'écran de passage vient
   d'abord, en plein écran ; le détail suit. Sinon on arrive
   directement sur le détail.

   Sur la barre de niveau, l'XP d'avant reste pâle et ce que la
   séance vient d'apporter ressort en orange : on voit d'un coup
   d'œil ce que l'effort du jour a pesé.
   ============================================================ */

/** Les trois chiffres de la séance, déjà mis en forme. */
export type StatsSeance = { duree: string; tonnage: string; series: number }

export function RecapXP({
  avant,
  apres,
  gains,
  titre,
  stats,
  onContinuer,
}: {
  avant: number
  apres: number
  gains: GainXP[]
  /** Nom du modèle, ou « Séance ». */
  titre: string
  stats: StatsSeance
  onContinuer: () => void
}) {
  const nAvant = calculerNiveau(avant)
  const nApres = calculerNiveau(apres)
  const monte = nApres.niveau > nAvant.niveau
  const [etape, setEtape] = useState<'niveau' | 'detail'>(monte ? 'niveau' : 'detail')

  if (etape === 'niveau') {
    return (
      <PassageNiveau
        niveau={nApres.niveau}
        rang={nApres.rang}
        nouveauRang={nApres.rang !== nAvant.rang}
        debloques={recompensesEntre(nAvant.niveau, nApres.niveau)}
        onContinuer={() => setEtape('detail')}
      />
    )
  }

  return (
    <Detail
      avant={avant}
      apres={apres}
      gains={gains}
      titre={titre}
      stats={stats}
      onContinuer={onContinuer}
    />
  )
}

/* ---- Le détail ---- */

function Detail({
  avant,
  apres,
  gains,
  titre,
  stats,
  onContinuer,
}: {
  avant: number
  apres: number
  gains: GainXP[]
  titre: string
  stats: StatsSeance
  onContinuer: () => void
}) {
  const total = gains.reduce((t, g) => t + g.montant, 0)
  const lignes = gains.filter((g) => g.source !== 'badge' && g.source !== 'defi')
  const badges = gains.filter((g) => g.source === 'badge')
  const defis = gains.filter((g) => g.source === 'defi')
  const n = calculerNiveau(apres)
  const etendue = n.xpSuivant - n.xpDebut

  // Part déjà acquise avant la séance, dans le niveau actuel.
  // Si la séance a fait changer de niveau, tout le niveau en
  // cours est « nouveau ».
  const base = Math.max(0, Math.min(1, (avant - n.xpDebut) / etendue))
  const fin = Math.max(0, Math.min(1, (apres - n.xpDebut) / etendue))

  const [affiche, setAffiche] = useState(0)
  const [rempli, setRempli] = useState(false)

  // Le total monte en une fraction de seconde, la barre se
  // remplit en même temps.
  useEffect(() => {
    vibrer(14)
    const t0 = performance.now()
    const duree = 700
    let id = 0
    const pas = (t: number) => {
      const p = Math.min(1, (t - t0) / duree)
      setAffiche(Math.round(total * (1 - Math.pow(1 - p, 3))))
      if (p < 1) id = requestAnimationFrame(pas)
    }
    id = requestAnimationFrame(pas)
    const r = setTimeout(() => setRempli(true), 80)
    return () => {
      cancelAnimationFrame(id)
      clearTimeout(r)
    }
  }, [total])

  return (
    <main
      className="securise flex min-h-dvh justify-center px-4 pt-7 pb-7"
      style={{
        background: 'radial-gradient(circle at 50% 18%, rgb(255 75 43 / 0.28), transparent 50%)',
      }}
    >
      <div className="flex w-full max-w-md flex-col gap-[18px]">
        <div className="pt-5 text-center">
          <p className="font-mono text-[13px] tracking-[0.08em] text-accent-clair uppercase">
            {titre} · terminé
          </p>
          <p className="mt-2.5 font-display text-[112px] leading-[0.8] text-accent">+{affiche}</p>
          <p className="mt-1.5 font-display text-[30px] leading-none">XP</p>
        </div>

        <div className="grid grid-cols-3 py-1.5 text-center">
          <Chiffre valeur={stats.duree} libelle="durée" />
          <Chiffre valeur={stats.tonnage} libelle="soulevées" />
          <Chiffre valeur={String(stats.series)} libelle="séries" />
        </div>

        <div className="bloc motif-cercles px-[18px] pt-1.5 pb-4">
          <ul className="entree-liste">
            {lignes.map((g, i) => (
              <li key={i} className="flex min-h-[46px] items-center justify-between gap-3">
                <span className="text-[16px]">{g.libelle}</span>
                <span className="font-mono text-[15px] text-accent-clair">+{g.montant}</span>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-col gap-2">
            <div
              className="flex h-2 overflow-hidden rounded-pilule bg-encre/[0.08]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(fin * 100)}
              aria-label={`Progression du niveau ${n.niveau}`}
            >
              <div className="bg-accent/45" style={{ width: `${base * 100}%` }} />
              <div
                className="bg-accent transition-[width] duration-700 ease-out"
                style={{ width: `${(rempli ? fin - base : 0) * 100}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[13px] text-encre-douce">
              <span>
                Niv. {n.niveau} · {n.rang}
              </span>
              <span>
                −{(n.xpSuivant - apres).toLocaleString('fr-FR')} XP avant le {n.niveau + 1}
              </span>
            </div>
          </div>
        </div>

        {defis.map((g, i) => (
          <LigneDefi key={`d${i}`} gain={g} />
        ))}
        {badges.map((g, i) => (
          <LigneBadge key={i} gain={g} />
        ))}

        <div className="mt-auto flex flex-col gap-1 pt-4">
          <div className="flex gap-2">
            <Link
              href="/story/nouvelle?etiquette=seance"
              aria-label="Partager en story"
              className="appui flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-carte bg-verre"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={onContinuer}
              className="appui h-[58px] flex-1 rounded-carte bg-accent text-[17px] font-bold text-white
                         transition-colors hover:bg-accent-clair"
            >
              Continuer
            </button>
          </div>
          <Link
            href="/xp?onglet=journal"
            className="flex h-11 items-center justify-center text-[15px] font-semibold text-encre-douce hover:text-encre"
          >
            Voir mon journal d&apos;XP
          </Link>
        </div>
      </div>
    </main>
  )
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div>
      <p className="font-display text-[clamp(1.5rem,8vw,2.25rem)] leading-none">{valeur}</p>
      <p className="mt-0.5 text-[13px] text-encre-douce">{libelle}</p>
    </div>
  )
}

/* ---- Un défi réussi grâce à la séance ---- */

function LigneDefi({ gain }: { gain: GainXP }) {
  if (!gain.defiBadge) return null
  return (
    <div className="impulsion flex items-center gap-3.5 px-0.5">
      <BadgeDefi badge={gain.defiBadge} taille={52} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-[12px] tracking-[0.08em] uppercase" style={{ color: gain.defiBadge.couleur }}>
          Défi réussi
        </span>
        <span className="truncate text-[16px] font-semibold">{gain.defiTitre ?? gain.libelle}</span>
      </span>
      <span className="font-mono text-[14px] text-accent-clair">+{gain.montant} XP</span>
    </div>
  )
}

/* ---- Un badge débloqué par la séance ---- */

function LigneBadge({ gain }: { gain: GainXP }) {
  const def = gain.badge ? definitionBadge(gain.badge) : undefined
  if (!def) return null
  const i = Math.max(0, (gain.palier ?? 1) - 1)
  const couleur = couleurPalier(def, i)

  return (
    <div className="impulsion flex items-center gap-3.5 px-0.5">
      <Badge def={def} palier={i} taille={52} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[16px] font-semibold">
          {def.nom}
          {!def.moment && ` · ${nomPalier(def, i)}`}
        </span>
        <span className="font-mono text-[13px]" style={{ color: couleur }}>
          +{gain.montant} XP
        </span>
      </span>
    </div>
  )
}

/* ---- Le passage de niveau ---- */

export function PassageNiveau({
  niveau,
  rang,
  nouveauRang,
  debloques = [],
  onContinuer,
}: {
  niveau: number
  rang: string
  nouveauRang: boolean
  /** Teintes, motifs et cadres débloqués par ce passage. */
  debloques?: Recompense[]
  onContinuer: () => void
}) {
  const suivant = rangSuivant(niveau)
  const ecart = suivant ? suivant.niveau - niveau : 0
  const teinte = debloques.find((r) => r.type === 'teinte')
  const essai =
    debloques.length === 0
      ? null
      : teinte
        ? 'Essayer ma nouvelle teinte'
        : debloques.some((r) => r.type === 'cadre')
          ? 'Essayer mon nouveau cadre'
          : 'Essayer mon nouveau motif'

  useEffect(() => {
    vibrer(60)
  }, [])

  return (
    <main
      className="securise relative flex min-h-dvh justify-center overflow-hidden px-4 pt-7 pb-7"
      style={{
        background: 'radial-gradient(circle at 50% 24%, rgb(255 75 43 / 0.32), transparent 52%)',
      }}
    >
      <Eclats />
      <div className="relative flex w-full max-w-md flex-col gap-5">
        <div className="pt-14 text-center">
          <p className="font-mono text-[13px] tracking-[0.1em] text-accent-clair uppercase">
            Nouveau niveau
          </p>
          <p className="arrivee-valeur mt-1.5 font-display text-[190px] leading-[0.78] text-accent">
            {niveau}
          </p>
          {nouveauRang ? (
            <p className="mx-auto mt-4 flex w-fit items-center gap-2.5 rounded-pilule bg-accent/15 px-4 py-2">
              <IconeEtoile />
              <span className="font-display text-[24px] leading-none tracking-wide">
                Rang {rang}
              </span>
            </p>
          ) : null}
          <p className="mt-3 font-mono text-[14px] text-encre-douce uppercase">
            {rang}
            {suivant
              ? ` · encore ${ecart} niveau${ecart > 1 ? 'x' : ''} avant ${suivant.nom}`
              : ' · le sommet'}
          </p>
        </div>

        {debloques.map((r) => (
          <div key={`${r.type}-${r.cle}`} className="bloc motif-cercles flex items-center gap-4 p-[18px]">
            <Apercu recompense={r} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-mono text-[12px] tracking-[0.08em] text-encre-douce uppercase">
                Débloqué
              </span>
              <span className="truncate text-[18px] font-bold">
                {LIBELLE_TYPE[r.type]} {r.nom}
              </span>
            </span>
          </div>
        ))}

        <div className="mt-auto flex flex-col gap-1 pt-4">
          {essai ? (
            <>
              <Link
                href="/reglages/apparence"
                className="appui flex h-[58px] items-center justify-center rounded-carte bg-accent text-[17px]
                           font-bold text-white transition-colors hover:bg-accent-clair"
              >
                {essai}
              </Link>
              <button
                type="button"
                onClick={onContinuer}
                className="h-[50px] text-[16px] text-encre-douce hover:text-encre"
              >
                Continuer
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onContinuer}
              className="appui h-[58px] rounded-carte bg-accent text-[17px] font-bold text-white
                         transition-colors hover:bg-accent-clair"
            >
              Continuer
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

/** Quelques éclats de couleur autour du chiffre. */
function Eclats() {
  return (
    <svg
      viewBox="0 0 390 360"
      aria-hidden
      className="pointer-events-none absolute top-10 left-1/2 w-[390px] -translate-x-1/2"
    >
      <rect x="58" y="62" width="10" height="4" rx="2" fill="#ff8a63" transform="rotate(-30 63 64)" />
      <rect x="320" y="90" width="12" height="4" rx="2" fill="#4cc9f0" transform="rotate(25 326 92)" />
      <rect x="300" y="250" width="9" height="4" rx="2" fill="#f0c04a" transform="rotate(-50 304 252)" />
      <rect x="70" y="240" width="11" height="4" rx="2" fill="#4cc9f0" transform="rotate(40 75 242)" />
      <circle cx="110" cy="40" r="3" fill="#f0c04a" />
      <circle cx="270" cy="30" r="2.5" fill="#ff8a63" />
      <circle cx="40" cy="160" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="350" cy="180" r="3" fill="#ff8a63" />
    </svg>
  )
}

/** Petit aperçu d'une récompense : contour, teinte ou motif. */
function Apercu({ recompense: r }: { recompense: Recompense }) {
  if (r.type === 'cadre') {
    const c = trouverCadre(r.cle)
    return (
      <span
        aria-hidden
        className="h-14 w-14 shrink-0 rounded-bloc bg-verre-fort"
        style={{ boxShadow: `0 0 0 2px ${c.couleur}, 0 0 12px ${c.couleur}73` }}
      />
    )
  }
  if (r.type === 'teinte')
    return (
      <span
        aria-hidden
        className="h-14 w-[84px] shrink-0 rounded-bloc"
        style={{ background: `${fondBanniere(r.cle)}, var(--color-fond)` }}
      />
    )
  return (
    <span
      aria-hidden
      className="h-14 w-[84px] shrink-0 rounded-bloc bg-verre-fort"
      style={motifCss(r.cle)}
    />
  )
}

function IconeEtoile() {
  return (
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
      className="text-accent-clair"
    >
      <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" />
    </svg>
  )
}
