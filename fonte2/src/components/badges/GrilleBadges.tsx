'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from './Badge'
import {
  BADGES,
  CATEGORIES,
  TOTAL_PALIERS,
  couleurPalier,
  nomPalier,
  obtenus,
  seuilNumerique,
  xpPalier,
  type DefinitionBadge,
  type EtatBadge,
} from '@/lib/badges'

/* ============================================================
   Grille des badges
   ============================================================
   Tous les badges sont visibles : gris tant qu'ils ne sont pas
   débloqués, dans la couleur de leur meilleur palier sinon.
   Toucher un badge ouvre son détail : ce qu'il récompense, la
   progression vers le palier suivant, et chaque palier avec sa
   date d'obtention.
   ============================================================ */

export function GrilleBadges({
  etats,
  moi,
}: {
  etats: EtatBadge[]
  /** Sur son propre profil : textes à la 2e personne. */
  moi: boolean
}) {
  const [ouvert, setOuvert] = useState<string | null>(null)
  const parId = new Map(etats.map((e) => [e.id, e]))
  const total = etats.reduce((t, e) => t + obtenus(e), 0)
  const def = ouvert ? BADGES.find((b) => b.id === ouvert) : undefined

  return (
    <>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="section-titre">Badges</p>
        <span className="font-mono text-[11px] text-encre-douce">
          <strong className="font-medium text-encre">{total}</strong> /{' '}
          {TOTAL_PALIERS} paliers
        </span>
      </div>

      {CATEGORIES.map((categorie) => (
        <div key={categorie} className="mt-4">
          <p className="section-titre text-[9.5px] opacity-80">{categorie}</p>
          <div className="mt-2.5 grid grid-cols-4 gap-x-1.5 gap-y-3.5 sm:grid-cols-6">
            {BADGES.filter((b) => b.categorie === categorie).map((b) => {
              const n = obtenus(parId.get(b.id))
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setOuvert(b.id)}
                  aria-label={`${b.nom}${n > 0 ? ` — ${nomPalier(b, n - 1)}` : ' — verrouillé'}`}
                  className={`appui flex min-h-11 flex-col items-center gap-1.5 rounded-bloc py-1
                    transition-colors hover:bg-verre ${n > 0 ? 'text-encre' : 'text-encre-douce'}`}
                >
                  <Badge def={b} palier={n - 1} taille={58} />
                  <span className="text-center text-[11px] leading-tight">{b.nom}</span>
                  {!b.moment && <Points def={b} n={n} />}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <p className="mt-5 font-mono text-[10.5px] leading-relaxed text-encre-douce">
        {moi
          ? 'Touche un badge pour voir ce qu’il récompense et tes paliers. Tes amis voient tes badges sur ton profil.'
          : 'Touche un badge pour voir ce qu’il récompense.'}
      </p>

      {def && (
        <Detail
          def={def}
          etat={parId.get(def.id)}
          onFermer={() => setOuvert(null)}
        />
      )}
    </>
  )
}

function Points({ def, n }: { def: DefinitionBadge; n: number }) {
  const couleur = n > 0 ? couleurPalier(def, n - 1) : undefined
  return (
    <span className="flex justify-center gap-[3px]" aria-hidden>
      {def.seuils.map((_, k) => (
        <span
          key={k}
          className="h-[5px] w-[5px] rounded-full"
          style={{ background: k < n ? couleur : 'rgb(255 255 255 / 0.14)' }}
        />
      ))}
    </span>
  )
}

/* ---- Détail, en panneau qui monte du bas ---- */

function Detail({
  def,
  etat,
  onFermer,
}: {
  def: DefinitionBadge
  etat: EtatBadge | undefined
  onFermer: () => void
}) {
  const [monte, setMonte] = useState(false)
  useEffect(() => setMonte(true), [])

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', surTouche)
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', surTouche)
      document.body.style.overflow = avant
    }
  }, [onFermer])

  if (!monte) return null

  const n = obtenus(etat)
  const valeur = etat?.valeur ?? 0
  const suivant = n < def.seuils.length ? n : null

  return createPortal(
    <div
      className="voile fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={def.nom}
        className="carte-monte defilement-isole relative max-h-[88dvh] w-full max-w-md overflow-y-auto
                   rounded-t-[22px] border-t border-bordure bg-[#15171a] px-5.5 pt-2.5
                   sm:rounded-[22px] sm:border"
        style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}
      >
        <span className="mx-auto block h-1 w-10 rounded-full bg-white/20" aria-hidden />
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center
                     text-encre-douce transition-colors hover:text-encre"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="mt-4 flex flex-col items-center text-center">
          <Badge def={def} palier={n - 1} taille={116} />
          <p
            className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em]"
            style={{ color: n > 0 ? couleurPalier(def, n - 1) : undefined }}
          >
            {n === 0
              ? 'Pas encore débloqué'
              : def.moment
                ? 'Débloqué'
                : `Palier ${nomPalier(def, n - 1)}`}
          </p>
          <h2 className="mt-1.5 text-[40px]">{def.nom}</h2>
          <p
            className={`mt-1.5 max-w-[290px] leading-relaxed ${
              def.moment ? 'text-[15px] text-encre' : 'text-sm text-encre-douce'
            }`}
          >
            {def.condition}
          </p>
        </div>

        {def.moment ? (
          <div className="mt-6 flex items-baseline justify-between border-t border-filet pt-3.5">
            <p className="section-titre">{n > 0 ? 'Obtenu le' : 'Récompense'}</p>
            <span className="font-mono text-[13px] text-accent-2">
              {n > 0 && etat?.dates[0] ? `${dateLisible(etat.dates[0])} · ` : ''}+
              {xpPalier(def, 0)} XP
            </span>
          </div>
        ) : (
          <>
            {suivant !== null && (
              <Progression def={def} valeur={valeur} palier={suivant} />
            )}
            {suivant === null && (
              <p className="mt-5 text-center text-sm text-encre-douce">
                Tous les paliers sont obtenus. Chapeau.
              </p>
            )}

            <ul className="mt-4">
              {def.seuils.map((seuil, i) => {
                const date = etat?.dates[i] ?? null
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-3 border-b border-filet py-2.5 ${
                      date ? '' : 'opacity-75'
                    }`}
                  >
                    <Badge def={def} palier={date ? i : -1} taille={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span
                          className="font-semibold"
                          style={{ color: date ? couleurPalier(def, i) : undefined }}
                        >
                          {nomPalier(def, i)}
                        </span>{' '}
                        · {seuil}
                        {/\d$/.test(seuil) ? ` ${def.unite(seuilNumerique(seuil))}` : ''}
                      </p>
                      <p className="font-mono text-[10.5px] text-encre-douce">
                        {date ? dateLisible(date) : 'à débloquer'}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-[13px] ${
                        date ? 'text-accent-2' : 'text-encre-douce'
                      }`}
                    >
                      +{xpPalier(def, i)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    </div>,
    document.body
  )
}

function Progression({
  def,
  valeur,
  palier,
}: {
  def: DefinitionBadge
  valeur: number
  palier: number
}) {
  const cible = seuilNumerique(def.seuils[palier])
  const reste = Math.max(0, cible - valeur)
  const part = cible > 0 ? Math.min(1, valeur / cible) : 0
  const unite = def.unite(reste)

  return (
    <div className="mt-5">
      <div className="flex justify-between font-mono text-[11px] text-encre-douce">
        <span>
          <strong className="font-medium text-encre">{nombre(valeur)}</strong>{' '}
          {def.unite(valeur)}
        </span>
        <span>
          {nomPalier(def, palier)} à {def.seuils[palier]}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full"
          style={{ width: `${part * 100}%`, background: couleurPalier(def, palier) }}
        />
      </div>
      <p className="mt-2 text-[13px] text-encre-douce">
        Encore{' '}
        <strong className="font-semibold text-encre">
          {nombre(reste)} {unite}
        </strong>{' '}
        pour le palier {nomPalier(def, palier)}.
      </p>
    </div>
  )
}

function nombre(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('fr-FR')
}

function dateLisible(date: string): string {
  const d = new Date(date + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
