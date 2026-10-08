'use client'

import { useState } from 'react'
import { libelleCourt } from '@/lib/semaine'
import { CHAMPS_SUIVI, type CleSuivi, type Objectifs, type ReleveComplet } from '@/lib/suivi'

/* ============================================================
   Progrès · Suivi
   ============================================================
   Un bloc pour la mesure choisie (chiffre, écart, courbe et
   objectif), puis les autres mesures de la semaine en lignes.
   Appuyer sur une ligne la fait passer dans le bloc.
   ============================================================ */

const COURT: Record<CleSuivi, string> = {
  poids: 'Poids',
  calories: 'Calories',
  pec: 'Pecs',
  bras: 'Bras',
  epaule: 'Épaules',
  jambe: 'Jambes',
  taille: 'Taille',
}

const POINTS_MAX = 12

export function CarteSuivi({
  releves,
  objectifs,
  semaine,
}: {
  releves: ReleveComplet[]
  objectifs: Objectifs
  /** Semaine en cours, `2026-W41`. */
  semaine: string
}) {
  const [champ, setChamp] = useState<CleSuivi>('poids')
  const def = CHAMPS_SUIVI.find((c) => c.cle === champ)!

  const tries = [...releves].sort((a, b) => a.semaine.localeCompare(b.semaine))
  const points = tries
    .filter((r) => r[champ] !== null)
    .map((r) => ({ semaine: r.semaine, valeur: r[champ] as number }))
    .slice(-POINTS_MAX)

  const dernier = points.at(-1) ?? null
  const avant = points.at(-2) ?? null
  const ecart = dernier && avant ? arrondi(dernier.valeur - avant.valeur) : null
  const cible = champ === 'calories' ? undefined : objectifs[champ]

  // Vert quand l'écart rapproche de l'objectif, orange quand il en éloigne.
  let tonEcart = 'bg-encre/10 text-encre-douce'
  if (ecart !== null && ecart !== 0 && cible !== undefined && dernier) {
    const rapproche = Math.abs(dernier.valeur - cible) < Math.abs(dernier.valeur - ecart - cible)
    tonEcart = rapproche ? 'bg-valide/15 text-valide' : 'bg-accent/15 text-accent-clair'
  }

  // Les autres mesures : celles de la semaine, sinon du dernier relevé.
  const reference = tries.find((r) => r.semaine === semaine) ?? tries.at(-1) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="bloc flex flex-col gap-3.5 p-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] text-encre-douce">
              {def.libelle}
              {dernier && dernier.semaine !== semaine && (
                <span className="text-encre-douce/70"> · {libelleCourt(dernier.semaine)}</span>
              )}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-[60px] leading-[0.85]">
                {dernier ? nombre(dernier.valeur) : '—'}
              </span>
              <span className="font-mono text-[14px] text-encre-douce">{def.unite}</span>
            </p>
          </div>
          {ecart !== null && (
            <span
              className={`flex h-7 shrink-0 items-center rounded-pilule px-2.5 font-mono text-[13px] ${tonEcart}`}
              aria-label={`Écart avec la mesure précédente : ${ecart} ${def.unite}`}
            >
              {ecart > 0 ? '+' : ecart < 0 ? '−' : '±'}
              {nombre(Math.abs(ecart))}
            </span>
          )}
        </div>

        {points.length >= 2 ? (
          <Courbe key={champ} points={points} cible={cible} unite={def.unite} libelle={def.libelle} />
        ) : (
          <p className="text-[15px] leading-relaxed text-encre-douce">
            {points.length === 0
              ? 'Pas encore de mesure. Ajoute-la dans ton relevé.'
              : 'Une seule mesure pour l’instant : la courbe apparaît dès la deuxième semaine.'}
          </p>
        )}

        <div className="-mx-[18px] flex gap-1.5 overflow-x-auto px-[18px]" role="group" aria-label="Mesure affichée">
          {CHAMPS_SUIVI.map((c) => {
            const choisie = c.cle === champ
            return (
              <button
                key={c.cle}
                type="button"
                aria-pressed={choisie}
                onClick={() => setChamp(c.cle)}
                className={`h-[34px] shrink-0 rounded-pilule px-3 text-[14px] transition-colors ${
                  choisie
                    ? 'bg-encre font-semibold text-fond'
                    : 'bg-encre/[0.06] text-encre-douce hover:text-encre'
                }`}
              >
                {COURT[c.cle]}
              </button>
            )
          })}
        </div>
      </div>

      {reference && (
        <div className="grid grid-cols-2 gap-x-5 px-0.5">
          {CHAMPS_SUIVI.filter((c) => c.cle !== champ).map((c) => (
            <button
              key={c.cle}
              type="button"
              onClick={() => setChamp(c.cle)}
              className="flex h-10 min-w-0 items-baseline justify-between gap-2 border-b border-filet text-left"
            >
              <span className="truncate text-[15px] text-encre-douce">{COURT[c.cle]}</span>
              <span className="shrink-0 text-[16px] font-semibold">
                {reference[c.cle] === null ? (
                  <span className="font-normal text-encre-douce/50">—</span>
                ) : (
                  <>
                    {nombre(reference[c.cle] as number)}
                    {c.unite !== 'kcal' && (
                      <span className="ml-0.5 text-[13px] font-normal text-encre-douce">
                        {' '}
                        {c.unite}
                      </span>
                    )}
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---- La courbe ---- */

const L = 340
const H = 168
const M = { haut: 14, bas: 24, gauche: 34, droite: 10 }

/**
 * Courbe détaillée : valeurs repères à gauche, semaines en bas,
 * un point par relevé. Toucher un point affiche sa valeur.
 */
function Courbe({
  points,
  cible,
  unite,
  libelle,
}: {
  points: { semaine: string; valeur: number }[]
  cible?: number
  unite: string
  libelle: string
}) {
  const [choisi, setChoisi] = useState(points.length - 1)
  const valeurs = points.map((p) => p.valeur)
  const bornes = [...valeurs, ...(cible !== undefined ? [cible] : [])]
  let min = Math.min(...bornes)
  let max = Math.max(...bornes)
  const amplitude = max - min || Math.abs(max) * 0.1 || 1
  min -= amplitude * 0.15
  max += amplitude * 0.15

  const largeur = L - M.gauche - M.droite
  const hauteur = H - M.haut - M.bas
  const x = (i: number) => M.gauche + (points.length === 1 ? largeur / 2 : (i / (points.length - 1)) * largeur)
  const y = (v: number) => M.haut + hauteur * (1 - (v - min) / (max - min))
  const ligne = points.map((p, i) => `${x(i).toFixed(1)},${y(p.valeur).toFixed(1)}`).join(' ')
  const aire = `${x(0).toFixed(1)},${(M.haut + hauteur).toFixed(1)} ${ligne} ${x(points.length - 1).toFixed(1)},${(M.haut + hauteur).toFixed(1)}`
  const pas = Math.max(1, Math.ceil(points.length / 6))
  const repere = [max, (max + min) / 2, min]
  const sel = points[choisi] ?? points[points.length - 1]
  const precedent = points[choisi - 1]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 font-mono text-[13px]">
        <span className="text-encre-douce">{libelleCourt(sel.semaine)}</span>
        <span>
          <strong className="text-[15px] font-semibold text-encre">
            {nombre(sel.valeur)} {unite}
          </strong>
          {precedent && (
            <span className="ml-2 text-encre-douce">
              {sel.valeur - precedent.valeur >= 0 ? '+' : '−'}
              {nombre(Math.abs(arrondi(sel.valeur - precedent.valeur)))} vs {libelleCourt(precedent.semaine)}
            </span>
          )}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${L} ${H}`}
        className="h-auto w-full touch-pan-y"
        role="img"
        aria-label={`${libelle} sur ${points.length} semaines, de ${nombre(points[0].valeur)} à ${nombre(points[points.length - 1].valeur)} ${unite}${
          cible !== undefined ? `, objectif ${nombre(cible)} ${unite}` : ''
        }`}
      >
        <defs>
          <linearGradient id="aire-suivi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-2)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent-2)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Repères horizontaux et valeurs */}
        {repere.map((v, i) => (
          <g key={i}>
            <line x1={M.gauche} x2={L - M.droite} y1={y(v)} y2={y(v)} stroke="var(--color-filet)" strokeWidth="1" />
            <text x={M.gauche - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">
              {Math.round(v)}
            </text>
          </g>
        ))}

        {cible !== undefined && (
          <>
            <line
              x1={M.gauche}
              x2={L - M.droite}
              y1={y(cible)}
              y2={y(cible)}
              stroke="var(--color-accent-clair)"
              strokeWidth="1.2"
              strokeDasharray="4 5"
            />
            <text x={L - M.droite} y={y(cible) - 5} textAnchor="end" fontSize="11" fill="var(--color-accent-clair)">
              objectif {nombre(cible)}
            </text>
          </>
        )}

        <polygon points={aire} fill="url(#aire-suivi)" />
        <polyline points={ligne} fill="none" stroke="var(--color-accent-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Ligne verticale sur le point choisi */}
        <line x1={x(choisi)} x2={x(choisi)} y1={M.haut} y2={M.haut + hauteur} stroke="var(--color-accent-2)" strokeOpacity="0.35" strokeWidth="1" />

        {points.map((p, i) => (
          <g key={p.semaine}>
            <circle
              cx={x(i)}
              cy={y(p.valeur)}
              r={i === choisi ? 6 : 3.5}
              fill={i === choisi ? 'var(--color-accent-2)' : 'var(--color-fond)'}
              stroke="var(--color-accent-2)"
              strokeWidth="2"
            />
            {/* Zone de toucher plus large que le point */}
            <rect
              x={x(i) - largeur / Math.max(1, points.length - 1) / 2}
              y={M.haut}
              width={largeur / Math.max(1, points.length - 1)}
              height={hauteur}
              fill="transparent"
              onClick={() => setChoisi(i)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}

        {points.map((p, i) =>
          i % pas === 0 || i === points.length - 1 ? (
            <text key={`x${p.semaine}`} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
              {libelleCourt(p.semaine)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  )
}

/* ---- Historique des relevés ---- */

export function HistoriqueReleves({ releves }: { releves: ReleveComplet[] }) {
  const [tout, setTout] = useState(false)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const tries = [...releves].sort((a, b) => b.semaine.localeCompare(a.semaine))
  const visibles = tout ? tries : tries.slice(0, 6)

  if (tries.length === 0) return null

  return (
    <section className="flex flex-col">
      <p className="section-titre mb-1 px-0.5">Historique</p>
      <ul className="flex flex-col">
        {visibles.map((r) => {
          const precedent = tries[tries.indexOf(r) + 1]
          const mesures = CHAMPS_SUIVI.filter((c) => r[c.cle] !== null)
          const deplie = ouvert === r.id
          return (
            <li key={r.id} className="border-b border-filet last:border-0">
              <button
                type="button"
                onClick={() => setOuvert(deplie ? null : r.id)}
                aria-expanded={deplie}
                className="flex min-h-14 w-full items-center gap-3.5 px-0.5 text-left"
              >
                <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-[12px] bg-verre font-mono text-[13px]">
                  {libelleCourt(r.semaine)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[16px] font-semibold">
                    {r.poids !== null ? `${nombre(r.poids)} kg` : `${mesures.length} mesure${mesures.length > 1 ? 's' : ''}`}
                    {r.poids !== null && precedent?.poids != null && (
                      <span className="ml-2 font-mono text-[13px] font-normal text-encre-douce">
                        {r.poids - precedent.poids >= 0 ? '+' : '−'}
                        {nombre(Math.abs(arrondi(r.poids - precedent.poids)))}
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[14px] text-encre-douce">
                    {dateCourte(r.date)} · {mesures.length} mesure{mesures.length > 1 ? 's' : ''}
                    {r.aPhoto ? ' · photo' : ''}
                  </span>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
                  className={`shrink-0 text-encre-douce transition-transform ${deplie ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {deplie && (
                <div className="flex flex-col gap-2 pb-3 pl-[62px]">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {CHAMPS_SUIVI.map((c) => {
                      const v = r[c.cle]
                      const avant = precedent?.[c.cle] ?? null
                      return (
                        <div key={c.cle} className="flex items-baseline justify-between gap-2">
                          <dt className="truncate text-[14px] text-encre-douce">{COURT[c.cle]}</dt>
                          <dd className="shrink-0 text-[15px] font-semibold">
                            {v === null ? (
                              <span className="font-normal text-encre-douce/50">—</span>
                            ) : (
                              <>
                                {nombre(v)}
                                {v !== null && avant !== null && v !== avant && (
                                  <span className="ml-1 font-mono text-[11px] font-normal text-encre-douce">
                                    {v > avant ? '+' : '−'}
                                    {nombre(Math.abs(arrondi(v - avant)))}
                                  </span>
                                )}
                              </>
                            )}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                  {r.note && <p className="selectionnable text-[14px] leading-relaxed text-encre-douce">{r.note}</p>}
                  {r.bonusDimanche && (
                    <p className="font-mono text-[12px] text-accent-2">Relevé du dimanche · bonus XP</p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {tries.length > 6 && !tout && (
        <button
          type="button"
          onClick={() => setTout(true)}
          className="appui mt-3 h-12 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce hover:text-encre"
        >
          Voir les {tries.length - 6} autres semaines
        </button>
      )}
    </section>
  )
}

/* ---- Utilitaires ---- */

function arrondi(v: number) {
  return Math.round(v * 10) / 10
}

function nombre(v: number) {
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

function dateCourte(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}
