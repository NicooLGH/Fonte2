'use client'

import { useState } from 'react'
import { libelleCourt } from '@/lib/semaine'
import {
  CHAMPS_SUIVI,
  type ReleveComplet,
  type Objectifs,
  type CleSuivi,
} from '@/lib/suivi'

/* ============================================================
   Évolution
   ============================================================
   Un graphique en SVG plutôt qu'une bibliothèque : les données
   sont peu nombreuses, le tracé est simple, et ça évite
   d'alourdir la page pour dessiner une ligne.
   ============================================================ */

const L = 640
const H = 220
const MARGE = { haut: 20, bas: 30, gauche: 44, droite: 16 }

export function Evolution({
  releves,
  objectifs,
}: {
  releves: ReleveComplet[]
  objectifs: Objectifs
}) {
  const [champ, setChamp] = useState<CleSuivi>('poids')

  const def = CHAMPS_SUIVI.find((c) => c.cle === champ)!
  const points = [...releves]
    .filter((r) => r[champ] !== null)
    .sort((a, b) => a.semaine.localeCompare(b.semaine))
    .map((r) => ({ semaine: r.semaine, valeur: r[champ] as number }))

  const cible = champ === 'calories' ? undefined : objectifs[champ]

  return (
    <section className="rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-4 text-2xl">Évolution</h2>

      <div className="mb-5 flex flex-wrap gap-2">
        {CHAMPS_SUIVI.map((c) => (
          <button
            key={c.cle}
            type="button"
            onClick={() => setChamp(c.cle)}
            aria-pressed={champ === c.cle}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold
              transition-colors ${
                champ === c.cle
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-bordure bg-verre text-encre-douce hover:text-encre'
              }`}
          >
            {c.libelle}
          </button>
        ))}
      </div>

      {points.length < 2 ? (
        <p className="text-sm italic text-encre-douce">
          {points.length === 0
            ? `Aucune donnée pour ${def.libelle.toLowerCase()}.`
            : `Une seule mesure : ${points[0].valeur} ${def.unite}. Ajoute une autre semaine pour voir la progression.`}
        </p>
      ) : (
        <Trace points={points} unite={def.unite} cible={cible} />
      )}
    </section>
  )
}

function Trace({
  points,
  unite,
  cible,
}: {
  points: { semaine: string; valeur: number }[]
  unite: string
  cible?: number
}) {
  const valeurs = points.map((p) => p.valeur)
  const bornes = [...valeurs, ...(cible !== undefined ? [cible] : [])]

  let min = Math.min(...bornes)
  let max = Math.max(...bornes)
  // Une marge évite que la courbe colle aux bords, et gère le cas
  // où toutes les valeurs sont identiques.
  const amplitude = max - min || Math.abs(max) * 0.1 || 1
  min -= amplitude * 0.15
  max += amplitude * 0.15

  const largeur = L - MARGE.gauche - MARGE.droite
  const hauteur = H - MARGE.haut - MARGE.bas

  const x = (i: number) =>
    MARGE.gauche +
    (points.length === 1 ? largeur / 2 : (i / (points.length - 1)) * largeur)
  const y = (v: number) =>
    MARGE.haut + hauteur - ((v - min) / (max - min)) * hauteur

  const chemin = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.valeur).toFixed(1)}`)
    .join(' ')

  const aire =
    `M ${x(0).toFixed(1)} ${(MARGE.haut + hauteur).toFixed(1)} ` +
    points.map((p, i) => `L ${x(i).toFixed(1)} ${y(p.valeur).toFixed(1)}`).join(' ') +
    ` L ${x(points.length - 1).toFixed(1)} ${(MARGE.haut + hauteur).toFixed(1)} Z`

  // Une étiquette sur deux au maximum, pour éviter le chevauchement
  const pas = Math.max(1, Math.ceil(points.length / 6))

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${L} ${H}`}
        className="w-full min-w-[320px]"
        role="img"
        aria-label={`Évolution sur ${points.length} semaines, de ${Math.min(...valeurs)} à ${Math.max(...valeurs)} ${unite}`}
      >
        <defs>
          <linearGradient id="remplissage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Repères horizontaux */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={MARGE.gauche}
            x2={L - MARGE.droite}
            y1={MARGE.haut + hauteur * f}
            y2={MARGE.haut + hauteur * f}
            stroke="var(--color-filet)"
            strokeWidth="1"
          />
        ))}

        {/* Valeurs extrêmes */}
        <text x="6" y={MARGE.haut + 4} className="fill-current text-[10px] text-encre-douce" fill="currentColor">
          {Math.round(max)}
        </text>
        <text x="6" y={MARGE.haut + hauteur + 4} className="text-[10px]" fill="currentColor" opacity="0.6">
          {Math.round(min)}
        </text>

        {/* Objectif */}
        {cible !== undefined && cible >= min && cible <= max && (
          <>
            <line
              x1={MARGE.gauche}
              x2={L - MARGE.droite}
              y1={y(cible)}
              y2={y(cible)}
              stroke="var(--color-accent-2)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text
              x={L - MARGE.droite}
              y={y(cible) - 6}
              textAnchor="end"
              fill="var(--color-accent-2)"
              className="text-[10px]"
            >
              objectif {cible} {unite}
            </text>
          </>
        )}

        <path d={aire} fill="url(#remplissage)" />
        <path
          d={chemin}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={p.semaine}
            cx={x(i)}
            cy={y(p.valeur)}
            r="3.5"
            fill="var(--color-fond)"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
        ))}

        {points.map((p, i) =>
          i % pas === 0 || i === points.length - 1 ? (
            <text
              key={p.semaine}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fill="currentColor"
              opacity="0.55"
              className="text-[10px]"
            >
              {libelleCourt(p.semaine)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  )
}
