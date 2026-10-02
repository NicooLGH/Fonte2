'use client'

import { useId } from 'react'
import { ICONES_BADGE, type ConfigBadge, type FormeBadge } from '@/lib/defis'

/* ============================================================
   Badge de défi
   ============================================================
   Dessiné à partir de la configuration choisie par l'admin :
   forme, couleur, icône, fond, bordure et texte court. Le même
   composant sert à l'aperçu en direct du formulaire, au profil
   et au récapitulatif de séance.
   ============================================================ */

function rosette(n = 12, R = 30, r = 25.5): string {
  const pts: string[] = []
  for (let k = 0; k < 2 * n; k++) {
    const a = (Math.PI * k) / n - Math.PI / 2
    const rr = k % 2 === 0 ? R : r
    pts.push(`${(32 + rr * Math.cos(a)).toFixed(1)},${(32 + rr * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}
const ROSETTE = rosette()

function Forme({
  forme,
  fill,
  stroke,
  largeur = 1.6,
  pointilles = false,
}: {
  forme: FormeBadge
  fill: string
  stroke: string
  largeur?: number
  pointilles?: boolean
}) {
  const commun = {
    fill,
    stroke,
    strokeWidth: largeur,
    strokeLinejoin: 'round' as const,
    strokeDasharray: pointilles ? '3 3' : undefined,
  }
  switch (forme) {
    case 'cercle':
      return <circle cx="32" cy="32" r="29" {...commun} />
    case 'bouclier':
      return <path d="M32 3L56 11V30C56 45 45 56 32 61C19 56 8 45 8 30V11Z" {...commun} />
    case 'rosette':
      return <polygon points={ROSETTE} {...commun} />
    case 'losange':
      return <polygon points="32,2 62,32 32,62 2,32" {...commun} />
    case 'medaille':
      return (
        <>
          <path d="M22 2h8l6 16h-8zM42 2h-8l-6 16h8z" fill={stroke} fillOpacity="0.55" />
          <circle cx="32" cy="38" r="23" {...commun} />
        </>
      )
    default:
      return <polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" {...commun} />
  }
}

export function BadgeDefi({
  badge,
  taille = 64,
  verrouille = false,
}: {
  badge: ConfigBadge
  taille?: number
  /** Gris : défi en cours, pas encore réussi. */
  verrouille?: boolean
}) {
  const id = `defi-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const c = verrouille ? '#4a4e55' : badge.couleur
  const cy = badge.forme === 'medaille' ? 38 : 32

  let fill = '#16181b'
  let defs: React.ReactNode = null
  if (!verrouille) {
    if (badge.fond === 'uni') {
      fill = `${c}26`
    } else if (badge.fond === 'rayons') {
      fill = `url(#${id})`
      defs = (
        <pattern
          id={id}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" fill={c} fillOpacity="0.1" />
          <rect width="2.5" height="6" fill={c} fillOpacity="0.22" />
        </pattern>
      )
    } else if (badge.fond === 'points') {
      fill = `url(#${id})`
      defs = (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill={c} fillOpacity="0.08" />
          <circle cx="3" cy="3" r="1.1" fill={c} fillOpacity="0.35" />
        </pattern>
      )
    } else {
      fill = `url(#${id})`
      defs = (
        <radialGradient id={id} cx="50%" cy="28%" r="75%">
          <stop offset="0" stopColor={c} stopOpacity="0.38" />
          <stop offset="1" stopColor={c} stopOpacity="0.05" />
        </radialGradient>
      )
    }
  }

  const contour = verrouille ? 'rgba(255,255,255,0.12)' : c
  const double = !verrouille && badge.bordure === 'double' && badge.forme !== 'medaille'

  return (
    <svg width={taille} height={taille} viewBox="0 0 64 64" fill="none" aria-hidden>
      {defs && <defs>{defs}</defs>}
      <Forme
        forme={badge.forme}
        fill={fill}
        stroke={contour}
        pointilles={!verrouille && badge.bordure === 'pointillee'}
      />
      {double && (
        <g transform="translate(32 32) scale(0.82) translate(-32 -32)" opacity="0.45">
          <Forme forme={badge.forme} fill="none" stroke={contour} largeur={1.4} />
        </g>
      )}
      {badge.texte ? (
        <>
          <g
            transform={`translate(${32 - 8.4} ${cy - 16}) scale(0.7)`}
            stroke={c}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: ICONES_BADGE[badge.icone] }}
          />
          <text
            x="32"
            y={cy + 15}
            textAnchor="middle"
            fontFamily="var(--police-display), sans-serif"
            fontSize="15"
            fill={c}
            letterSpacing="0.5"
          >
            {badge.texte}
          </text>
        </>
      ) : (
        <g
          transform={`translate(${32 - 13.2} ${cy - 13.2}) scale(1.1)`}
          stroke={c}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: ICONES_BADGE[badge.icone] }}
        />
      )}
    </svg>
  )
}
