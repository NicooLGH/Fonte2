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

   Sur la barre de niveau, l'XP d'avant reste grise et ce que la
   séance vient d'apporter ressort en bleu : on voit d'un coup
   d'œil ce que l'effort du jour a pesé.
   ============================================================ */

export function RecapXP({
  avant,
  apres,
  gains,
  titre,
  resume,
  onContinuer,
}: {
  avant: number
  apres: number
  gains: GainXP[]
  /** Nom du modèle, ou « Séance ». */
  titre: string
  /** « 5 exercices · 8 420 kg · 58:12 » */
  resume: string
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
      resume={resume}
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
  resume,
  onContinuer,
}: {
  avant: number
  apres: number
  gains: GainXP[]
  titre: string
  resume: string
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
    <main className="securise flex min-h-dvh justify-center px-6 py-10">
      <div className="flex w-full max-w-md flex-col">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Séance enregistrée
        </p>
        <h1 className="mt-2.5 text-[44px]">{titre}</h1>
        <p className="mt-2 font-mono text-[11px] text-encre-douce">{resume}</p>

        <p className="mt-9 flex items-baseline gap-2.5">
          <span className="font-display text-[104px] leading-[0.85] text-accent-2">
            +{affiche}
          </span>
          <span className="font-mono text-[13px] text-encre-douce">XP</span>
        </p>

        {lignes.length > 0 && (
          <ul className="entree-liste mt-5 border-t border-filet">
            {lignes.map((g, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 border-b border-filet py-3"
              >
                <span className="text-sm">{g.libelle}</span>
                <span className="font-mono text-[13px] text-accent-2">+{g.montant}</span>
              </li>
            ))}
          </ul>
        )}

        {defis.map((g, i) => (
          <EncartDefi key={`d${i}`} gain={g} />
        ))}

        {badges.map((g, i) => (
          <EncartBadge key={i} gain={g} />
        ))}

        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <span className="section-titre">
              Niveau {n.niveau} · {n.rang}
            </span>
            <span className="font-mono text-[11px] text-encre-douce">
              {apres.toLocaleString('fr-FR')} / {n.xpSuivant.toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-verre-fort">
            <div className="bg-encre/35" style={{ width: `${base * 100}%` }} />
            <div
              className="bg-accent-2 transition-[width] duration-700 ease-out"
              style={{ width: `${(rempli ? fin - base : 0) * 100}%` }}
            />
          </div>
          <p className="mt-2.5 text-[13px] text-encre-douce">
            Plus que{' '}
            <strong className="font-semibold text-encre">
              {(n.xpSuivant - apres).toLocaleString('fr-FR')} XP
            </strong>{' '}
            avant le niveau {n.niveau + 1}.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-3.5 pt-10">
          <button
            type="button"
            onClick={onContinuer}
            className="appui rounded-bloc bg-accent py-4 text-[15px] font-semibold text-white
                       transition-colors hover:bg-accent-clair"
          >
            Continuer
          </button>
          <Link
            href="/xp?onglet=journal"
            className="text-center font-mono text-xs text-accent-2 underline underline-offset-4"
          >
            Voir mon journal d&apos;XP
          </Link>
        </div>
      </div>
    </main>
  )
}

/* ---- Un défi réussi grâce à la séance ---- */

function EncartDefi({ gain }: { gain: GainXP }) {
  if (!gain.defiBadge) return null
  const c = gain.defiBadge.couleur
  return (
    <div
      className="impulsion mt-4 flex items-center gap-3.5 rounded-[14px] border p-3.5"
      style={{ borderColor: `${c}59`, background: `${c}0f` }}
    >
      <BadgeDefi badge={gain.defiBadge} taille={60} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: c }}>
          Défi réussi
        </p>
        <p className="mt-1 font-display text-2xl leading-none">
          {gain.defiTitre ?? gain.libelle}
        </p>
        <p className="mt-1 text-[12.5px] text-encre-douce">Badge ajouté à ton profil</p>
      </div>
      <span className="font-mono text-[13px] text-accent-2">+{gain.montant}</span>
    </div>
  )
}

/* ---- Un badge débloqué par la séance ---- */

function EncartBadge({ gain }: { gain: GainXP }) {
  const def = gain.badge ? definitionBadge(gain.badge) : undefined
  if (!def) return null
  const i = Math.max(0, (gain.palier ?? 1) - 1)
  const couleur = couleurPalier(def, i)

  return (
    <div
      className="impulsion mt-4 flex items-center gap-3.5 rounded-[14px] border p-3.5"
      style={{ borderColor: `${couleur}59`, background: `${couleur}0f` }}
    >
      <Badge def={def} palier={i} taille={60} />
      <div className="min-w-0 flex-1">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ color: couleur }}
        >
          Badge débloqué
        </p>
        <p className="mt-1 font-display text-2xl leading-none">
          {def.nom}
          {!def.moment && ` · ${nomPalier(def, i)}`}
        </p>
        <p className="mt-1 text-[12.5px] text-encre-douce">
          {def.moment ? def.condition : `${def.condition} · ${def.seuils[i]}`}
        </p>
      </div>
      <span className="font-mono text-[13px] text-accent-2">+{gain.montant}</span>
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

  useEffect(() => {
    vibrer(60)
  }, [])

  return (
    <main
      className="securise flex min-h-dvh justify-center px-7 py-10 text-center"
      style={{
        background:
          'radial-gradient(ellipse 120% 70% at 50% 34%, rgb(255 75 43 / 0.28), transparent 60%)',
      }}
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mt-[14vh] flex flex-col items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-clair">
            Nouveau niveau
          </p>
          <p className="arrivee-valeur mt-3.5 font-display text-[200px] leading-[0.8] text-accent">
            {niveau}
          </p>

          {nouveauRang && (
            <p className="mt-6 flex items-center gap-2.5 rounded-full border border-accent-clair/50 px-4.5 py-2">
              <IconeEtoile />
              <span className="font-display text-2xl leading-none tracking-wide">
                Rang {rang}
              </span>
            </p>
          )}

          <p className="mt-6 max-w-[280px] text-sm leading-relaxed text-encre-douce">
            {nouveauRang ? `Tu rejoins le rang ${rang}.` : `Rang ${rang}.`}{' '}
            {suivant
              ? `Prochain palier : ${suivant.nom}, au niveau ${suivant.niveau}.`
              : 'Tu as atteint le sommet.'}
          </p>
        </div>

        {debloques.length > 0 && (
          <div className="mt-8 w-full text-left">
            <p className="section-titre border-b border-bordure pb-2">Débloqué</p>
            <ul>
              {debloques.map((r) => (
                <li
                  key={`${r.type}-${r.cle}`}
                  className="flex items-center gap-3.5 border-b border-filet py-3"
                >
                  <Apercu recompense={r} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {LIBELLE_TYPE[r.type]} {r.nom}
                    </p>
                    <p className="font-mono text-[10.5px] text-encre-douce">
                      {r.type === 'cadre'
                        ? 'autour de ton avatar'
                        : "pour l'en-tête de ton profil"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {suivant && debloques.length === 0 && (
          <div className="mt-10 w-full text-left">
            <div className="flex justify-between">
              <span className="section-titre">Vers {suivant.nom}</span>
              <span className="font-mono text-[11px] text-encre-douce">
                niv. {niveau} / {suivant.niveau}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-verre-fort">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.round((niveau / suivant.niveau) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {debloques.length > 0 ? (
          <div className="mt-auto flex w-full flex-col gap-2.5 pt-8">
            <Link
              href="/reglages"
              className="appui block w-full rounded-bloc bg-accent py-4 text-[15px] font-semibold
                         text-white transition-colors hover:bg-accent-clair"
            >
              Essayer mon nouveau thème
            </Link>
            <button
              type="button"
              onClick={onContinuer}
              className="min-h-11 font-mono text-xs text-encre-douce underline underline-offset-4"
            >
              Continuer
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onContinuer}
            className="appui mt-auto w-full rounded-bloc bg-accent py-4 text-[15px] font-semibold
                       text-white transition-colors hover:bg-accent-clair"
          >
            Continuer
          </button>
        )}
      </div>
    </main>
  )
}

/** Petit aperçu d'une récompense : contour, teinte ou motif. */
function Apercu({ recompense: r }: { recompense: Recompense }) {
  if (r.type === 'cadre') {
    const c = trouverCadre(r.cle)
    return (
      <span
        aria-hidden
        className="h-11 w-11 shrink-0 rounded-[11px] bg-verre"
        style={{ boxShadow: `0 0 0 2px ${c.couleur}, 0 0 12px ${c.couleur}73` }}
      />
    )
  }
  if (r.type === 'teinte')
    return (
      <span
        aria-hidden
        className="h-11 w-11 shrink-0 rounded-[11px] border border-bordure"
        style={{ background: `${fondBanniere(r.cle)}, var(--color-fond)` }}
      />
    )
  return (
    <span
      aria-hidden
      className="h-11 w-11 shrink-0 rounded-[11px] border border-bordure bg-verre"
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
