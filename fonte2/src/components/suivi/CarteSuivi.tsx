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
          <Courbe points={points} cible={cible} unite={def.unite} libelle={def.libelle} />
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

const L = 322
const H = 96

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
  const valeurs = points.map((p) => p.valeur)
  const bornes = [...valeurs, ...(cible !== undefined ? [cible] : [])]
  let min = Math.min(...bornes)
  let max = Math.max(...bornes)
  const amplitude = max - min || Math.abs(max) * 0.1 || 1
  min -= amplitude * 0.12
  max += amplitude * 0.12

  const haut = 8
  const bas = 18 // place pour l'étiquette de l'objectif
  const x = (i: number) => 4 + (i / (points.length - 1)) * (L - 12)
  const y = (v: number) => haut + (H - haut - bas) * (1 - (v - min) / (max - min))

  const ligne = points.map((p, i) => `${x(i).toFixed(1)},${y(p.valeur).toFixed(1)}`).join(' ')
  const fin = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${L} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${libelle} sur ${points.length} semaines, de ${nombre(points[0].valeur)} à ${nombre(fin.valeur)} ${unite}${
        cible !== undefined ? `, objectif ${nombre(cible)} ${unite}` : ''
      }`}
    >
      {cible !== undefined && (
        <>
          <line
            x1="0"
            x2={L}
            y1={y(cible)}
            y2={y(cible)}
            stroke="var(--color-accent-clair)"
            strokeWidth="1"
            strokeDasharray="4 5"
            opacity="0.7"
          />
          <text
            x={L}
            y={Math.min(H - 2, y(cible) + 14)}
            textAnchor="end"
            style={{ fontFamily: "var(--font-mono)" }}
            fontSize="11"
            fill="var(--color-accent-clair)"
          >
            objectif {nombre(cible)}
          </text>
        </>
      )}
      <polyline
        points={ligne}
        fill="none"
        stroke="var(--color-accent-2)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={x(points.length - 1)} cy={y(fin.valeur)} r="5" fill="var(--color-accent-2)" />
    </svg>
  )
}

/* ---- Historique des relevés ---- */

export function HistoriqueReleves({ releves }: { releves: ReleveComplet[] }) {
  const [tout, setTout] = useState(false)
  const tries = [...releves].sort((a, b) => b.semaine.localeCompare(a.semaine))
  const visibles = tout ? tries : tries.slice(0, 4)

  if (tries.length === 0) return null

  return (
    <section className="flex flex-col">
      <p className="section-titre mb-1 px-0.5">Historique</p>
      <ul className="flex flex-col">
        {visibles.map((r) => {
          const n = CHAMPS_SUIVI.filter((c) => r[c.cle] !== null).length
          return (
            <li key={r.id} className="flex min-h-14 items-center gap-3.5 border-b border-filet px-0.5">
              <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-[12px] bg-verre font-mono text-[13px]">
                {libelleCourt(r.semaine)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[16px] font-semibold">
                  {r.poids !== null ? `${nombre(r.poids)} kg` : `${n} mesure${n > 1 ? 's' : ''}`}
                </span>
                <span className="truncate text-[14px] text-encre-douce">
                  {dateCourte(r.date)}
                  {r.poids !== null && n > 1 ? ` · ${n} mesures` : ''}
                  {r.aPhoto ? ' · photo' : ''}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
      {tries.length > 4 && !tout && (
        <button
          type="button"
          onClick={() => setTout(true)}
          className="appui mt-3 h-12 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce hover:text-encre"
        >
          Voir les {tries.length - 4} autres semaines
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
