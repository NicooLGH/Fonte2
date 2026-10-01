'use client'

import { useId } from 'react'
import { couleurPalier, type DefinitionBadge } from '@/lib/badges'

/* ============================================================
   Un badge dessiné
   ============================================================
   Un hexagone, l'icône du badge, la couleur du palier.
   - verrouillé : gris, sans couleur ;
   - à partir de l'or : un liseré intérieur ;
   - platine : un point, diamant : un éclat.
   ============================================================ */

const HEX = '32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5'
const HEX_INTERIEUR = '32,9.5 51.5,20.8 51.5,43.2 32,54.5 12.5,43.2 12.5,20.8'

export function Badge({
  def,
  palier,
  taille = 64,
}: {
  def: DefinitionBadge
  /** Index du palier affiché (0 = premier), ou -1 si verrouillé. */
  palier: number
  taille?: number
}) {
  const id = `badge-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`

  if (palier < 0) {
    return (
      <svg width={taille} height={taille} viewBox="0 0 64 64" fill="none" aria-hidden>
        <polygon
          points={HEX}
          fill="#16181b"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <g
          transform="translate(18.8 18.8) scale(1.1)"
          stroke="#4a4e55"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: def.icone }}
        />
      </svg>
    )
  }

  const c = couleurPalier(def, palier)
  const lisere = def.moment || palier >= 2

  return (
    <svg width={taille} height={taille} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <radialGradient id={id} cx="50%" cy="28%" r="75%">
          <stop offset="0" stopColor={c} stopOpacity="0.34" />
          <stop offset="1" stopColor={c} stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <polygon
        points={HEX}
        fill={`url(#${id})`}
        stroke={c}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {lisere && (
        <polygon
          points={HEX_INTERIEUR}
          stroke={c}
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      <g
        transform="translate(18.8 18.8) scale(1.1)"
        stroke={c}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: def.icone }}
      />
      {!def.moment && palier === 3 && <circle cx="51" cy="10" r="2" fill={c} />}
      {!def.moment && palier >= 4 && (
        <path
          d="M50 6.5l1.2 2.8 2.8 1.2-2.8 1.2L50 14.5l-1.2-2.8-2.8-1.2 2.8-1.2z"
          fill={c}
        />
      )}
    </svg>
  )
}
