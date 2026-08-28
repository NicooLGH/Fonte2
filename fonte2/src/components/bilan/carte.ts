import { cleMois, type Bilan } from '@/lib/bilan'
import { dureeLisible } from '@/lib/social'

/* ============================================================
   Cartes téléchargeables
   ============================================================
   Deux versions : l'une complète pour soi, l'autre sans le poids
   ni les mensurations. La distinction n'est pas cosmétique — ce
   sont des données de santé, et on ne les partage pas par
   inadvertance.

   Le dessin se fait sur un canvas, dans le navigateur : aucune
   image ne transite par le serveur.
   ============================================================ */

const L = 1080
const H = 1350
const M = 86

export async function dessinerCarte({
  bilan,
  pseudo,
  avatar,
  complete,
}: {
  bilan: Bilan
  pseudo: string
  avatar: string
  complete: boolean
}): Promise<void> {
  // Sans cette attente, le premier rendu utilise une police de
  // repli et le résultat ne ressemble pas au carnet.
  try {
    await Promise.all([
      document.fonts.load('400 90px "Bebas Neue"'),
      document.fonts.load('400 30px "IBM Plex Mono"'),
      document.fonts.load('600 30px Inter'),
    ])
  } catch {
    // Polices indisponibles : on dessine quand même
  }

  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  /* ---- Fond ---- */
  const fond = ctx.createLinearGradient(0, 0, L, H)
  fond.addColorStop(0, '#131519')
  fond.addColorStop(1, '#0b0c0e')
  ctx.fillStyle = fond
  ctx.fillRect(0, 0, L, H)

  halo(ctx, L * 0.12, H * 0.04, 780, '255,75,43', 0.3)
  halo(ctx, L * 0.94, H * 0.46, 700, '76,201,240', 0.2)

  /* ---- En-tête ---- */
  display(ctx, 'FONTE', M, 104, 50, '#f4f3ee')
  ctx.font = '400 50px "Bebas Neue", sans-serif'
  display(ctx, '.', M + ctx.measureText('FONTE').width, 104, 50, '#ff4b2b')
  mono(ctx, 'BILAN MENSUEL', L - M, 100, 24, '#8d9096', 'right')

  ctx.font = '56px sans-serif'
  ctx.fillText(avatar, M, 196)

  display(ctx, bilan.nom.toUpperCase(), M, 288, 84, '#f4f3ee')
  mono(ctx, pseudo.toUpperCase(), M, 330, 26, '#4cc9f0')

  /* ---- Quatre chiffres ---- */
  const cases: [string, string][] = [
    [String(bilan.nbSeances), 'SÉANCES'],
    [bilan.volume.toLocaleString('fr-FR'), 'KG SOULEVÉS'],
    [String(bilan.series), 'SÉRIES'],
    [String(bilan.records.length), 'RECORDS BATTUS'],
  ]

  const largeur = (L - M * 2 - 22) / 2
  const hauteur = 146
  cases.forEach(([valeur, libelle], i) => {
    const x = M + (i % 2) * (largeur + 22)
    const y = 380 + Math.floor(i / 2) * (hauteur + 22)
    carte(ctx, x, y, largeur, hauteur, 26)
    display(ctx, valeur, x + 34, y + 90, 68, '#ff4b2b')
    mono(ctx, libelle, x + 34, y + 122, 20, '#8d9096')
  })

  let y = 380 + 2 * (hauteur + 22) + 16

  /* ---- Records ---- */
  if (bilan.records.length > 0) {
    const n = Math.min(bilan.records.length, 4)
    carte(ctx, M, y, L - M * 2, 74 + n * 62, 28)
    mono(ctx, 'RECORDS DU MOIS', M + 34, y + 48, 21, '#8d9096')

    let ligne = y + 106
    for (const r of bilan.records.slice(0, n)) {
      inter(ctx, tronquer(r.nom, 24), M + 34, ligne, 28, '#f4f3ee')
      display(ctx, `${r.poids} KG`, L - M - 34, ligne + 5, 42, '#4cc9f0', 'right')
      ligne += 62
    }
    y += 74 + n * 62 + 22
  }

  /* ---- Bloc sensible, carte complète uniquement ---- */
  if (complete && bilan.evolutions.length > 0) {
    const n = Math.min(bilan.evolutions.length, 4)
    carte(ctx, M, y, L - M * 2, 74 + n * 58, 28)
    mono(ctx, 'ÉVOLUTION', M + 34, y + 48, 21, '#8d9096')

    let ligne = y + 104
    for (const e of bilan.evolutions.slice(0, n)) {
      inter(ctx, e.libelle, M + 34, ligne, 26, '#f4f3ee')
      display(
        ctx,
        `${e.ecart > 0 ? '+' : ''}${e.ecart} ${e.unite}`,
        L - M - 34,
        ligne + 5,
        38,
        e.ecart > 0 ? '#ff4b2b' : '#4cc9f0',
        'right'
      )
      ligne += 58
    }
    y += 74 + n * 58 + 22
  }

  /* ---- Pied ---- */
  ctx.beginPath()
  ctx.moveTo(M, H - 132)
  ctx.lineTo(L - M, H - 132)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  mono(
    ctx,
    complete ? 'CARTE PERSONNELLE' : 'CARTE PARTAGEABLE',
    M,
    H - 88,
    22,
    '#8d9096'
  )
  if (bilan.dureeTotale > 0)
    mono(
      ctx,
      String(dureeLisible(bilan.dureeTotale)).toUpperCase(),
      L - M,
      H - 88,
      20,
      'rgba(141,144,150,0.7)',
      'right'
    )

  await telecharger(canvas, bilan, complete)
}

/* ---- Outils de dessin ---- */

function halo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rayon: number,
  rgb: string,
  opacite: number
) {
  const g = ctx.createRadialGradient(x, y, 40, x, y, rayon)
  g.addColorStop(0, `rgba(${rgb},${opacite})`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, L, H)
}

function carte(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  l: number,
  h: number,
  r: number
) {
  ctx.save()
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, l, h, r)
  else ctx.rect(x, y, l, h)
  ctx.fillStyle = 'rgba(255,255,255,0.045)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

type Align = 'left' | 'right'

function ecrire(
  ctx: CanvasRenderingContext2D,
  police: string,
  texte: string,
  x: number,
  y: number,
  couleur: string,
  align: Align = 'left'
) {
  ctx.fillStyle = couleur
  ctx.textAlign = align
  ctx.font = police
  ctx.fillText(texte, x, y)
  ctx.textAlign = 'left'
}

function display(
  ctx: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  taille: number,
  couleur: string,
  align: Align = 'left'
) {
  ecrire(ctx, `400 ${taille}px "Bebas Neue", sans-serif`, t, x, y, couleur, align)
}

function mono(
  ctx: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  taille: number,
  couleur: string,
  align: Align = 'left'
) {
  ecrire(ctx, `400 ${taille}px "IBM Plex Mono", monospace`, t, x, y, couleur, align)
}

function inter(
  ctx: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  taille: number,
  couleur: string
) {
  ecrire(ctx, `600 ${taille}px Inter, sans-serif`, t, x, y, couleur)
}

function tronquer(t: string, max: number): string {
  return t.length > max ? `${t.slice(0, max)}…` : t
}

function telecharger(
  canvas: HTMLCanvasElement,
  bilan: Bilan,
  complete: boolean
): Promise<void> {
  return new Promise((resoudre) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resoudre()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `fonte-bilan-${cleMois(bilan.mois)}${complete ? '' : '-partage'}.jpg`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        resoudre()
      },
      'image/jpeg',
      0.92
    )
  })
}
