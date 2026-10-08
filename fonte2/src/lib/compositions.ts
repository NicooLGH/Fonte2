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
  // ---- Session 8 ----
  constellation: [
    { f: 'path', d: 'M296 38 L328 60 L364 44 L382 92 L344 112 L316 86 L328 60', so: 0.16, lw: 1 },
    { f: 'path', d: 'M236 150 L266 174 L298 160 L286 128 Z M344 112 L298 160', so: 0.16, lw: 1 },
    { f: 'path', d: 'M64 58 L98 44 L120 80', so: 0.1, lw: 1 },
    ...(
      [
        [296, 38, 2.2, 0.5], [328, 60, 2.8, 0.5], [364, 44, 2, 0.5], [382, 92, 2.4, 0.5],
        [344, 112, 2.2, 0.5], [316, 86, 1.6, 0.5], [236, 150, 1.8, 0.5], [266, 174, 1.6, 0.5],
        [298, 160, 2.2, 0.5], [286, 128, 1.4, 0.5], [64, 58, 1.4, 0.3], [98, 44, 1.8, 0.3],
        [120, 80, 1.2, 0.3], [350, 46, 0.7, 0.13], [165, 67, 0.8, 0.13], [99, 64, 0.6, 0.17],
        [368, 126, 0.7, 0.11], [71, 94, 0.9, 0.09], [281, 189, 0.7, 0.13], [152, 27, 0.7, 0.12],
        [190, 137, 0.7, 0.14], [129, 183, 0.6, 0.19], [105, 168, 0.5, 0.11], [334, 132, 1, 0.13],
        [218, 103, 0.8, 0.12], [123, 154, 0.6, 0.19], [119, 13, 0.5, 0.11], [245, 50, 0.6, 0.09],
        [24, 189, 0.7, 0.19],
      ] as const
    ).map(([x, y, r, fo]) => ({ f: 'cercle' as const, x, y, r, fo })),
  ],
  tempete: [
    { f: 'path', d: 'M170 34 C236 4 318 16 410 58', so: 0.22, lw: 1.3 },
    { f: 'path', d: 'M130 86 C222 44 330 64 412 116', so: 0.17, lw: 1.3 },
    { f: 'path', d: 'M190 140 C252 110 336 122 410 172', so: 0.13, lw: 1.3 },
    { f: 'path', d: 'M60 190 C120 168 170 176 220 196', so: 0.08, lw: 1.3 },
    {
      f: 'path',
      d: 'M321 92 a5 5 0 1 1 10 0 a10 10 0 1 1 -20 0 a17 17 0 1 1 34 0 a26 26 0 1 1 -52 0 a36 36 0 1 1 72 0',
      so: 0.2,
      lw: 1.3,
    },
    ...(
      [
        [132, 17, 0.23], [189, 165, 0.16], [53, 159, 0.22], [116, 43, 0.19], [141, 53, 0.25],
        [199, 16, 0.12], [111, 166, 0.2], [64, 82, 0.23], [137, 115, 0.21], [180, 165, 0.17],
        [59, 47, 0.15], [179, 127, 0.14], [198, 167, 0.25], [23, 110, 0.26],
      ] as const
    ).map(([x, y, so]) => ({ f: 'path' as const, d: `M${x} ${y} l-5 13`, so, lw: 1.2, c: '#4cc9f0' })),
  ],
  galaxie: [
    { f: 'path', d: 'M271 78 a34 16 0 1 0 68 0 a34 16 0 1 0 -68 0 Z', so: 0, fo: 0.1, c: '#b9a2ff' },
    { f: 'path', d: 'M293 78 a12 6 0 1 0 24 0 a12 6 0 1 0 -24 0 Z', so: 0, fo: 0.22 },
    ...(
      [
        [311, 76, 1.7, 0.55, 0], [320, 76, 1.6, 0.53, 0], [318, 80, 0.8, 0.52, 0], [326, 80, 1.5, 0.5, 0],
        [330, 86, 0.8, 0.49, 2], [327, 87, 1.4, 0.47, 0], [329, 90, 0.8, 0.45, 1], [330, 96, 0.8, 0.44, 0],
        [326, 100, 0.7, 0.42, 0], [324, 103, 1.3, 0.41, 1], [317, 109, 1, 0.39, 0], [312, 111, 0.9, 0.37, 1],
        [301, 114, 1.4, 0.36, 1], [291, 111, 1.1, 0.34, 0], [281, 113, 1, 0.33, 0], [271, 113, 1.1, 0.31, 1],
        [253, 113, 1, 0.29, 2], [238, 110, 0.7, 0.28, 0], [225, 111, 1.1, 0.26, 2], [215, 105, 1.1, 0.25, 0],
        [209, 99, 1, 0.23, 2], [192, 96, 0.5, 0.21, 0], [186, 89, 0.8, 0.2, 0], [180, 79, 1.1, 0.18, 2],
        [179, 69, 0.7, 0.17, 1], [176, 60, 0.5, 0.15, 0], [295, 76, 1.1, 0.55, 2], [295, 75, 1.1, 0.53, 0],
        [287, 75, 1.5, 0.52, 0], [286, 74, 1.6, 0.5, 0], [281, 73, 2, 0.49, 2], [279, 67, 1.3, 0.47, 2],
        [275, 62, 0.9, 0.45, 0], [283, 60, 1.4, 0.42, 0], [290, 54, 0.8, 0.41, 1], [296, 50, 1.2, 0.39, 0],
        [303, 50, 1.1, 0.37, 2], [308, 42, 1.4, 0.36, 1], [319, 43, 1.1, 0.34, 0], [334, 41, 0.7, 0.33, 0],
        [345, 40, 1.2, 0.31, 0], [357, 40, 0.9, 0.29, 0], [367, 42, 1, 0.28, 1], [382, 47, 1.2, 0.26, 0],
        [396, 53, 1.1, 0.25, 0], [210, 30, 0.7, 0.18, 0], [58, 172, 0.8, 0.17, 0], [31, 182, 0.9, 0.14, 0],
        [188, 24, 0.6, 0.22, 0], [17, 117, 0.8, 0.17, 0], [157, 118, 0.8, 0.21, 0], [47, 109, 0.5, 0.19, 0],
        [61, 100, 1, 0.13, 0], [141, 162, 0.5, 0.18, 0], [225, 130, 1, 0.15, 0], [133, 169, 1, 0.17, 0],
        [39, 19, 0.9, 0.15, 0], [244, 120, 0.6, 0.12, 0],
      ] as const
    ).map(([x, y, r, fo, t]) => ({
      f: 'cercle' as const,
      x,
      y,
      r,
      fo,
      c: ['#ffffff', '#b9a2ff', '#4cc9f0'][t],
    })),
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
