'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from './Badge'
import { BadgeDefi } from '@/components/defis/BadgeDefi'
import type { BadgesDefis } from '@/lib/defis'
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
  defis = null,
  entete = true,
}: {
  /** Faux sur la page Badges, qui a déjà son titre. */
  entete?: boolean
  etats: EtatBadge[]
  /** Sur son propre profil : textes à la 2e personne. */
  moi: boolean
  /** Badges uniques des défis : réussis, et en cours. */
  defis?: BadgesDefis | null
}) {
  const [ouvert, setOuvert] = useState<string | null>(null)
  const parId = new Map(etats.map((e) => [e.id, e]))
  const total = etats.reduce((t, e) => t + obtenus(e), 0)
  const def = ouvert ? BADGES.find((b) => b.id === ouvert) : undefined

  return (
    <>
      {entete && (
        <div className="mb-1 flex items-baseline justify-between px-0.5">
          <p className="section-titre">Badges</p>
          <span className="font-mono text-[13px] text-encre-douce">
            <strong className="font-medium text-encre">{total}</strong> / {TOTAL_PALIERS} paliers
          </span>
        </div>
      )}

      {CATEGORIES.map((categorie) => (
        <div key={categorie} className="mt-5">
          <p className="section-titre px-0.5">{categorie}</p>
          <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-5">
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
                  <Badge def={b} palier={n - 1} taille={64} />
                  <span className="text-center text-[13px] leading-tight">{b.nom}</span>
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: n > 0 ? couleurPalier(b, n - 1) : undefined }}
                  >
                    {n === 0 ? 'verrouillé' : b.moment ? 'Moment' : nomPalier(b, n - 1)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {defis && (defis.reussis.length > 0 || defis.enCours.length > 0 || moi) && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between px-0.5">
            <p className="section-titre">Défis</p>
            <span className="font-mono text-[13px] text-encre-douce">
              <strong className="font-medium text-encre">{defis.reussis.length}</strong>{' '}
              réussi{defis.reussis.length > 1 ? 's' : ''}
            </span>
          </div>
          {defis.reussis.length === 0 && defis.enCours.length === 0 ? (
            <p className="mt-2.5 px-0.5 text-[15px] text-encre-douce">
              Aucun défi pour l&apos;instant.{' '}
              <Link href="/defis" className="font-semibold text-accent-2">
                Voir les défis en cours
              </Link>
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-5">
              {defis.reussis.map((r) => (
                <Link
                  key={r.defi}
                  href={`/defis/${r.edition}`}
                  className="appui relative flex min-h-11 flex-col items-center gap-1.5 rounded-bloc py-1
                             text-encre transition-colors hover:bg-verre"
                >
                  <BadgeDefi badge={r.badge} taille={64} />
                  {r.fois > 1 && (
                    <span
                      className="absolute right-1 top-0 rounded-full border border-white/20 bg-fond px-1.5
                                 font-mono text-[10px]"
                    >
                      ×{r.fois}
                    </span>
                  )}
                  <span className="text-center text-[13px] leading-tight">{r.titre}</span>
                  <span className="font-mono text-[11px] text-encre-douce">
                    {dateCourte(r.derniere)}
                  </span>
                </Link>
              ))}
              {defis.enCours.map((e) => (
                <Link
                  key={e.edition}
                  href={`/defis/${e.edition}`}
                  className="appui flex min-h-11 flex-col items-center gap-1.5 rounded-bloc py-1
                             text-encre-douce transition-colors hover:bg-verre"
                >
                  <BadgeDefi badge={e.badge} taille={64} verrouille />
                  <span className="text-center text-[13px] leading-tight">{e.titre}</span>
                  <span className="font-mono text-[11px]">en cours</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-5 px-0.5 text-[13px] leading-relaxed text-encre-douce">
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
                   rounded-t-[24px] bg-verre px-5.5 pt-2.5 sm:rounded-[24px]"
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
            className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em]"
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
              def.moment ? 'text-[16px] text-encre' : 'text-[15px] text-encre-douce'
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
                      <p className="text-[15px]">
                        <span
                          className="font-semibold"
                          style={{ color: date ? couleurPalier(def, i) : undefined }}
                        >
                          {nomPalier(def, i)}
                        </span>{' '}
                        · {seuil}
                        {/\d$/.test(seuil) ? ` ${def.unite(seuilNumerique(seuil))}` : ''}
                      </p>
                      <p className="font-mono text-[12px] text-encre-douce">
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
      <div className="flex justify-between font-mono text-[13px] text-encre-douce">
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
      <p className="mt-2 text-[15px] text-encre-douce">
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

/** « oct. 2026 » */
function dateCourte(date: string): string {
  const d = new Date(date + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}
