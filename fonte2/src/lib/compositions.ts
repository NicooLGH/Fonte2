/* ============================================================
   Compositions — les motifs « libres » de la collection
   ============================================================
   Contrairement aux motifs d'origine (un carreau répété), une
   composition est un seul dessin de 400 × 200 posé sur l'en-tête,
   recadré pour le remplir. Formes de tailles variées, plus
   denses d'un côté : rien de régulier.

   Une seule description sert deux rendus :
   - en SVG, comme image de fond à l'écran ;
   - sur canvas, pour la carte de partage.
   ============================================================ */

/** Transformation : position, rotation (degrés), échelle x, échelle y. */
type T = [number, number, number, number, number?]

export type Element =
  | { f: 'path'; d: string; t?: T; so?: number; fo?: number; c?: string; lw?: number }
  | { f: 'poly'; pts: string; t?: T; so?: number; fo?: number; c?: string; lw?: number }
  | { f: 'cercle'; x: number; y: number; r: number; fo: number; c?: string }
  | { f: 'rect'; w: number; h: number; t: T; fo: number; c: string }

const HEX = '0,-1 0.87,-0.5 0.87,0.5 0,1 -0.87,0.5 -0.87,-0.5'
const TRI = '0,-1 0.87,0.5 -0.87,0.5'
const ECLAIR = 'M2,-10 L-5,2 L0,2 L-2,10 L5,-2 L0,-2 Z'
const BLOB =
  'M1 0 C1 0.6 0.5 1 -0.1 0.95 C-0.7 0.9 -1 0.4 -0.95 -0.1 C-0.9 -0.7 -0.3 -1 0.2 -0.95 C0.7 -0.9 1 -0.5 1 0 Z'

export const COMPOSITIONS: Record<string, Element[]> = {
  houle: [
    { f: 'path', d: 'M-10 60 C80 20 160 100 260 50 S380 30 420 70', so: 0.26, lw: 1.4 },
    { f: 'path', d: 'M-10 108 C60 78 140 150 240 104 S360 88 420 128', so: 0.17, lw: 1.4 },
    { f: 'path', d: 'M-10 164 C90 140 200 200 300 160 S390 150 420 176', so: 0.1, lw: 1.4 },
    { f: 'path', d: 'M150 -10 C180 26 250 18 300 -10', so: 0.12, lw: 1.4 },
  ],
  eclats: [
    { f: 'poly', pts: HEX, t: [320, 48, 12, 30], so: 0.24, fo: 0.035 },
    { f: 'poly', pts: HEX, t: [368, 118, -8, 15], so: 0.19 },
    { f: 'poly', pts: HEX, t: [262, 92, 20, 10], so: 0.16 },
    { f: 'poly', pts: HEX, t: [305, 165, 30, 12], so: 0.14 },
    { f: 'poly', pts: HEX, t: [395, 38, 0, 9], so: 0.12 },
    { f: 'poly', pts: HEX, t: [58, 150, 5, 19], so: 0.1 },
    { f: 'poly', pts: HEX, t: [142, 42, -15, 7], so: 0.1 },
    { f: 'poly', pts: HEX, t: [205, 172, -20, 6], so: 0.09 },
  ],
  prismes: [
    { f: 'poly', pts: TRI, t: [335, 50, 15, 95], so: 0.15, fo: 0.045 },
    { f: 'poly', pts: TRI, t: [388, 135, -25, 62], so: 0.12, fo: 0.035 },
    { f: 'poly', pts: TRI, t: [262, 12, 40, 48], so: 0.1, fo: 0.03 },
    { f: 'poly', pts: TRI, t: [62, 178, 10, 30], so: 0.08, fo: 0.02 },
  ],
  sommets: [
    // Remplissage sans contour, puis la crête seule : sinon les
    // bords de la forme dessineraient un cadre autour de l'en-tête.
    {
      f: 'path',
      d: 'M0 200 L0 125 L60 90 L95 110 L150 60 L195 100 L240 75 L300 115 L345 70 L400 95 L400 200 Z',
      so: 0,
      fo: 0.025,
    },
    { f: 'path', d: 'M0 125 L60 90 L95 110 L150 60 L195 100 L240 75 L300 115 L345 70 L400 95', so: 0.09 },
    {
      f: 'path',
      d: 'M0 200 L0 152 L40 132 L70 146 L110 106 L140 126 L170 96 L210 136 L250 111 L290 141 L330 91 L370 121 L400 106 L400 200 Z',
      so: 0,
      fo: 0.04,
    },
    {
      f: 'path',
      d: 'M0 152 L40 132 L70 146 L110 106 L140 126 L170 96 L210 136 L250 111 L290 141 L330 91 L370 121 L400 106',
      so: 0.17,
    },
    { f: 'path', d: 'M150 60 L160 74 L170 70 M345 70 L352 82 L360 78', so: 0.14 },
  ],
  orage: [
    { f: 'path', d: ECLAIR, t: [330, 62, 10, 3.6], so: 0.24, fo: 0.045 },
    { f: 'path', d: ECLAIR, t: [252, 132, -12, 2.1], so: 0.17 },
    { f: 'path', d: ECLAIR, t: [374, 152, 4, 1.5], so: 0.14 },
    { f: 'path', d: ECLAIR, t: [92, 52, 20, 1.3], so: 0.1 },
    { f: 'path', d: ECLAIR, t: [182, 166, -6, 0.9], so: 0.09 },
  ],
  relief: [
    { f: 'path', d: BLOB, t: [318, 58, 0, 26], so: 0.24, lw: 1.1 },
    { f: 'path', d: BLOB, t: [314, 60, 8, 52, 46], so: 0.19, lw: 1.1 },
    { f: 'path', d: BLOB, t: [310, 64, -6, 80, 70], so: 0.15, lw: 1.1 },
    { f: 'path', d: BLOB, t: [304, 70, 12, 110, 94], so: 0.11, lw: 1.1 },
    { f: 'path', d: BLOB, t: [298, 76, -4, 142, 120], so: 0.08, lw: 1.1 },
    { f: 'path', d: BLOB, t: [56, 178, 20, 20, 16], so: 0.1, lw: 1.1 },
    { f: 'path', d: BLOB, t: [58, 180, 10, 40, 32], so: 0.07, lw: 1.1 },
  ],
  braises: (
    [
      [300, 172, 3, 0.38], [332, 140, 2, 0.32], [280, 120, 1.5, 0.26], [352, 95, 2.5, 0.22],
      [310, 70, 1.2, 0.2], [372, 40, 1.8, 0.16], [250, 160, 1.2, 0.26], [392, 130, 1, 0.22],
      [270, 60, 1, 0.13], [342, 20, 1.4, 0.1], [220, 140, 0.9, 0.18], [362, 182, 1.6, 0.32],
      [322, 190, 2.2, 0.36], [190, 178, 1, 0.16], [388, 70, 1.1, 0.12], [298, 98, 0.8, 0.16],
    ] as const
  ).map(([x, y, r, fo]) => ({ f: 'cercle' as const, x, y, r, fo, c: '#ffc8a6' })),
  fete: [
    { f: 'rect', w: 9, h: 3.5, t: [300, 30, 25, 1], fo: 0.6, c: '#ff8a63' },
    { f: 'rect', w: 7, h: 3, t: [352, 58, -35, 1], fo: 0.55, c: '#4cc9f0' },
    { f: 'rect', w: 8, h: 3, t: [268, 78, 60, 1], fo: 0.55, c: '#f0c04a' },
    { f: 'rect', w: 6, h: 2.5, t: [380, 100, 15, 1], fo: 0.5, c: '#a98bff' },
    { f: 'rect', w: 9, h: 3.5, t: [320, 122, -50, 1], fo: 0.45, c: '#3ddc84' },
    { f: 'rect', w: 5, h: 2.2, t: [240, 40, 80, 1], fo: 0.45, c: '#ff5fa2' },
    { f: 'rect', w: 8, h: 3, t: [360, 162, 40, 1], fo: 0.4, c: '#f0c04a' },
    { f: 'rect', w: 6, h: 2.4, t: [210, 110, -20, 1], fo: 0.35, c: '#4cc9f0' },
    { f: 'rect', w: 5, h: 2, t: [150, 30, 35, 1], fo: 0.3, c: '#ff8a63' },
    { f: 'rect', w: 6, h: 2.4, t: [280, 172, -70, 1], fo: 0.35, c: '#a98bff' },
    { f: 'rect', w: 4, h: 1.8, t: [120, 140, 10, 1], fo: 0.25, c: '#3ddc84' },
    { f: 'rect', w: 4, h: 1.8, t: [60, 60, -40, 1], fo: 0.2, c: '#f0c04a' },
    { f: 'cercle', x: 335, y: 85, r: 2, fo: 0.5, c: '#ff5fa2' },
    { f: 'cercle', x: 255, y: 150, r: 1.6, fo: 0.4, c: '#4cc9f0' },
    { f: 'cercle', x: 190, y: 70, r: 1.4, fo: 0.3, c: '#f0c04a' },
  ],
}

/* ---- Rendu SVG (écran) ---- */

function transform(t?: T): string {
  if (!t) return ''
  const [x, y, r, sx, sy] = t
  return ` transform="translate(${x} ${y}) rotate(${r}) scale(${sx} ${sy ?? sx})"`
}

function elementSvg(e: Element): string {
  const blanc = '#ffffff'
  if (e.f === 'cercle')
    return `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="${e.c ?? blanc}" fill-opacity="${e.fo}"/>`
  if (e.f === 'rect')
    return `<rect x="${-e.w / 2}" y="${-e.h / 2}" width="${e.w}" height="${e.h}" rx="1"${transform(e.t)} fill="${e.c}" fill-opacity="${e.fo}"/>`

  const c = e.c ?? blanc
  const commun =
    `${transform(e.t)} stroke="${c}" stroke-opacity="${e.so ?? 0}" stroke-width="${e.lw ?? 1.2}" ` +
    `stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" ` +
    (e.fo ? `fill="${c}" fill-opacity="${e.fo}"` : 'fill="none"')
  return e.f === 'path' ? `<path d="${e.d}"${commun}/>` : `<polygon points="${e.pts}"${commun}/>`
}

/** Image de fond CSS d'une composition, ou null si inconnue. */
export function compositionCss(cle: string): string | null {
  const elements = COMPOSITIONS[cle]
  if (!elements) return null
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">` +
    elements.map(elementSvg).join('') +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/* ---- Rendu canvas (carte de partage) ---- */

function cheminPoly(pts: string): Path2D {
  const p = new Path2D()
  pts
    .trim()
    .split(/\s+/)
    .map((c) => c.split(',').map(Number))
    .forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)))
  p.closePath()
  return p
}

/** Dessine la composition en remplissant l × h (recadrée comme à l'écran). */
export function peindreComposition(
  ctx: CanvasRenderingContext2D,
  cle: string,
  l: number,
  h: number
): boolean {
  const elements = COMPOSITIONS[cle]
  if (!elements) return false

  // Équivalent de « slice » : on remplit, on recadre au centre.
  const s = Math.max(l / 400, h / 200)
  const dx = (l - 400 * s) / 2
  const dy = (h - 200 * s) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, l, h)
  ctx.clip()
  ctx.translate(dx, dy)
  ctx.scale(s, s)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  for (const e of elements) {
    ctx.save()
    if (e.f === 'cercle') {
      ctx.globalAlpha = e.fo
      ctx.fillStyle = e.c ?? '#ffffff'
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      continue
    }

    const [x, y, r, sx, sy] = e.t ?? [0, 0, 0, 1]
    ctx.translate(x, y)
    ctx.rotate((r * Math.PI) / 180)
    ctx.scale(sx, sy ?? sx)

    if (e.f === 'rect') {
      ctx.globalAlpha = e.fo
      ctx.fillStyle = e.c
      ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h)
      ctx.restore()
      continue
    }

    const chemin = e.f === 'path' ? new Path2D(e.d) : cheminPoly(e.pts)
    const c = e.c ?? '#ffffff'
    if (e.fo) {
      ctx.globalAlpha = e.fo
      ctx.fillStyle = c
      ctx.fill(chemin)
    }
    // Trait d'épaisseur constante malgré l'échelle de la forme.
    ctx.globalAlpha = e.so ?? 0
    ctx.strokeStyle = c
    ctx.lineWidth = ((e.lw ?? 1.2) * 1.1) / ((Math.abs(sx) + Math.abs(sy ?? sx)) / 2)
    ctx.stroke(chemin)
    ctx.restore()
  }

  ctx.restore()
  return true
}
