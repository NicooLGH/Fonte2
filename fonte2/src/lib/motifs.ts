/* ============================================================
   Motifs de profil
   ============================================================
   Un motif habille l'en-tête du profil, pas la page entière :
   sous les statistiques, il les rendrait pénibles à lire.

   Chaque motif existe en deux formes — une valeur CSS pour
   l'écran, et un tracé pour le canvas de la carte partageable.
   Le canvas ne sait pas interpréter une image de fond CSS, il
   faut lui dessiner le motif.
   ============================================================ */

export type CleMotif =
  | 'aucun'
  | 'hachures'
  | 'points'
  | 'grille'
  | 'chevrons'
  | 'coeurs'
  | 'etoiles'

/** Les formes passent par une image SVG encodée dans l'adresse. */
function svg(contenu: string, cote: number): string {
  const brut =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cote}" height="${cote}" ` +
    `viewBox="0 0 ${cote} ${cote}">${contenu}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(brut)}")`
}

const TRAIT = 'rgba(255,255,255,0.075)'
const FORME = 'rgba(255,255,255,0.095)'

export const MOTIFS: { cle: CleMotif; nom: string; css: string }[] = [
  { cle: 'aucun', nom: 'Aucun', css: 'none' },
  {
    cle: 'hachures',
    nom: 'Hachures',
    css: `repeating-linear-gradient(135deg, ${TRAIT} 0 1px, transparent 1px 7px)`,
  },
  {
    cle: 'points',
    nom: 'Points',
    css: `radial-gradient(${TRAIT} 1.2px, transparent 1.2px)`,
  },
  {
    cle: 'grille',
    nom: 'Grille',
    css:
      `linear-gradient(${TRAIT} 1px, transparent 1px),` +
      `linear-gradient(90deg, ${TRAIT} 1px, transparent 1px)`,
  },
  {
    cle: 'chevrons',
    nom: 'Chevrons',
    css: svg(
      `<path d="M0 12 L8 4 L16 12" fill="none" stroke="${FORME}" stroke-width="1.4"/>`,
      16
    ),
  },
  {
    cle: 'coeurs',
    nom: 'Cœurs',
    css: svg(
      `<path d="M11 17.5 C6 13.8 3.5 11.4 3.5 8.6 C3.5 6.6 5 5.2 6.9 5.2 ` +
        `C8.1 5.2 9.3 5.8 11 7.6 C12.7 5.8 13.9 5.2 15.1 5.2 C17 5.2 18.5 6.6 ` +
        `18.5 8.6 C18.5 11.4 16 13.8 11 17.5 Z" fill="none" stroke="${FORME}" stroke-width="1.3"/>`,
      22
    ),
  },
  {
    cle: 'etoiles',
    nom: 'Étoiles',
    css: svg(
      `<path d="M11 4 L12.8 9 L18 9.4 L14 12.8 L15.3 18 L11 15.1 L6.7 18 ` +
        `L8 12.8 L4 9.4 L9.2 9 Z" fill="none" stroke="${FORME}" stroke-width="1.2"/>`,
      22
    ),
  },
]

/** La taille du carreau, quand le motif en a une. */
const TAILLES: Partial<Record<CleMotif, string>> = {
  points: '10px 10px',
  grille: '12px 12px',
  chevrons: '16px 16px',
  coeurs: '22px 22px',
  etoiles: '22px 22px',
}

export function motifCss(cle: string | null | undefined): {
  backgroundImage?: string
  backgroundSize?: string
} {
  const motif = MOTIFS.find((m) => m.cle === cle)
  if (!motif || motif.cle === 'aucun') return {}

  const taille = TAILLES[motif.cle]
  return {
    backgroundImage: motif.css,
    ...(taille ? { backgroundSize: taille } : {}),
  }
}

export function nomMotif(cle: string | null | undefined): string {
  return MOTIFS.find((m) => m.cle === cle)?.nom ?? 'Aucun'
}

/* ============================================================
   Le même motif, dessiné sur un canvas
   ============================================================ */

/**
 * Peint le motif sur la zone indiquée.
 *
 * Le pas est plus large que sur écran : la carte fait 900 px de
 * large, un motif à 10 px y serait un grain illisible.
 */
export function peindreMotif(
  ctx: CanvasRenderingContext2D,
  cle: string | null | undefined,
  l: number,
  h: number
): void {
  if (!cle || cle === 'aucun') return

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.085)'
  ctx.fillStyle = 'rgba(255,255,255,0.085)'
  ctx.lineWidth = 2

  const pas = 34

  switch (cle) {
    case 'hachures':
      for (let x = -h; x < l + h; x += pas) {
        ctx.beginPath()
        ctx.moveTo(x, h)
        ctx.lineTo(x + h, 0)
        ctx.stroke()
      }
      break

    case 'points':
      for (let y = pas / 2; y < h; y += pas)
        for (let x = pas / 2; x < l; x += pas) {
          ctx.beginPath()
          ctx.arc(x, y, 2.4, 0, Math.PI * 2)
          ctx.fill()
        }
      break

    case 'grille':
      for (let x = 0; x < l; x += pas) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += pas) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(l, y)
        ctx.stroke()
      }
      break

    case 'chevrons':
      for (let y = 0; y < h; y += pas)
        for (let x = 0; x < l; x += pas) {
          ctx.beginPath()
          ctx.moveTo(x, y + pas * 0.62)
          ctx.lineTo(x + pas * 0.5, y + pas * 0.28)
          ctx.lineTo(x + pas, y + pas * 0.62)
          ctx.stroke()
        }
      break

    case 'coeurs':
      for (let y = 0; y < h; y += pas)
        for (let x = 0; x < l; x += pas) coeur(ctx, x + pas / 2, y + pas / 2, 10)
      break

    case 'etoiles':
      for (let y = 0; y < h; y += pas)
        for (let x = 0; x < l; x += pas) etoile(ctx, x + pas / 2, y + pas / 2, 10)
      break
  }

  ctx.restore()
}

function coeur(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + t * 0.65)
  ctx.bezierCurveTo(cx - t * 1.5, cy - t * 0.2, cx - t * 0.6, cy - t, cx, cy - t * 0.35)
  ctx.bezierCurveTo(cx + t * 0.6, cy - t, cx + t * 1.5, cy - t * 0.2, cx, cy + t * 0.65)
  ctx.stroke()
}

function etoile(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rayon = i % 2 === 0 ? t : t * 0.44
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const x = cx + Math.cos(angle) * rayon
    const y = cy + Math.sin(angle) * rayon
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()
}
