import { banniere as trouverBanniere } from './bannieres'
import { peindreMotif } from './motifs'
import { cadre as trouverCadre } from './recompenses'
import { avatarTexte, imageAvatar } from './boutique'
import { meilleur1RM } from './rm'

/* ============================================================
   Carte de séance à partager (Story 9:16)
   ============================================================
   Une image de 1080 × 1920, dessinée sur l'appareil. La photo de
   fond, si on en choisit une, ne quitte jamais le téléphone :
   elle n'est lue que pour être dessinée ici.

   Tout se règle : le fond (ma teinte, ma photo, sans fond, une
   couleur), les blocs affichés, leur position et leur taille.
   ============================================================ */

export const L = 1080
export const H = 1920

/* ---- Données ---- */

export type ExerciceCarte = { nom: string; poids: number; reps: number; nbSeries: number }

export type DonneesCarte = {
  titre: string
  /** « 2026-10-07 » */
  date: string
  dureeSec: number | null
  volume: number
  nbSeries: number
  xp: number | null
  exercices: ExerciceCarte[]
  record: { exercice: string; poids: number; reps: number; rm: number | null } | null
}

export type IdentiteCarte = {
  pseudo: string
  avatar: string
  cadre: string
  teinte: string
  motif: string
  niveau: number
  rang: string
}

export type FondCarte = 'teinte' | 'photo' | 'transparent' | 'uni'
export type PositionCarte = 'haut' | 'centre' | 'bas'

export type OptionsCarte = {
  fond: FondCarte
  couleurFond: string
  titre: boolean
  chiffres: boolean
  exercices: boolean
  record: boolean
  identite: boolean
  poids: boolean
  position: PositionCarte
  grand: boolean
  accent: string
}

export const OPTIONS_DEFAUT: OptionsCarte = {
  fond: 'teinte',
  couleurFond: '#ff4b2b',
  titre: true,
  chiffres: true,
  exercices: true,
  record: true,
  identite: true,
  poids: true,
  position: 'bas',
  grand: true,
  accent: '#ff8a63',
}

export const ACCENTS = [
  { nom: 'Orange', couleur: '#ff8a63' },
  { nom: 'Bleu', couleur: '#4cc9f0' },
  { nom: 'Or', couleur: '#f0c04a' },
  { nom: 'Blanc', couleur: '#ffffff' },
]

export const COULEURS_FOND = [
  { nom: 'Braise', couleur: '#ff4b2b' },
  { nom: 'Nuit', couleur: '#0e0f11' },
  { nom: 'Bleu', couleur: '#1d4ed8' },
  { nom: 'Vert', couleur: '#15803d' },
]

/** Construit les données à partir des blocs d'une séance. */
export function carteDepuisBlocs({
  titre,
  date,
  dureeSec,
  blocs,
  xp = null,
  records = [],
}: {
  titre: string
  date: string
  dureeSec: number | null
  blocs: { nom: string; series: { poids: number; reps: number }[] }[]
  xp?: number | null
  /** Noms des exercices où un record a été battu. */
  records?: string[]
}): DonneesCarte {
  const exercices: ExerciceCarte[] = blocs
    .filter((b) => b.series.length > 0)
    .map((b) => {
      // La « meilleure série » : celle au meilleur 1RM estimé, sinon la plus lourde.
      const meilleure = [...b.series].sort(
        (x, y) => (meilleur1RM([y]) ?? y.poids) - (meilleur1RM([x]) ?? x.poids)
      )[0]
      return { nom: b.nom, poids: meilleure.poids, reps: meilleure.reps, nbSeries: b.series.length }
    })

  const volume = blocs.reduce((t, b) => t + b.series.reduce((x, s) => x + s.poids * s.reps, 0), 0)
  const nbSeries = blocs.reduce((t, b) => t + b.series.length, 0)

  const blocRecord = blocs.find((b) => records.some((r) => r.toLowerCase() === b.nom.toLowerCase()))
  const exRecord = blocRecord ? exercices.find((e) => e.nom === blocRecord.nom) : null

  return {
    titre: titre || 'Séance',
    date,
    dureeSec,
    volume,
    nbSeries,
    xp,
    exercices,
    record:
      blocRecord && exRecord
        ? { exercice: exRecord.nom, poids: exRecord.poids, reps: exRecord.reps, rm: meilleur1RM(blocRecord.series) }
        : null,
  }
}

/* ---- Dessin ---- */

async function chargerPolices() {
  try {
    await Promise.all([
      document.fonts.load('400 120px "Bebas Neue"'),
      document.fonts.load('400 30px "IBM Plex Mono"'),
      document.fonts.load('500 30px Inter'),
      document.fonts.load('700 30px Inter'),
    ])
  } catch {
    // On dessine quand même.
  }
}

function chargerImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = () => ok(null)
    img.src = src
  })
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + l, y, x + l, y + h, r)
  ctx.arcTo(x + l, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + l, y, r)
  ctx.closePath()
}

/** Réduit la police jusqu'à ce que le texte tienne dans la largeur. */
function ajuster(ctx: CanvasRenderingContext2D, texte: string, gabarit: (t: number) => string, max: number, largeur: number) {
  let t = max
  ctx.font = gabarit(t)
  while (t > 24 && ctx.measureText(texte).width > largeur) {
    t -= 4
    ctx.font = gabarit(t)
  }
  return t
}

function kg(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} kg`
}

function duree(sec: number | null): string | null {
  if (!sec) return null
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

function dateLongue(date: string): string {
  const d = new Date(date + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/**
 * Dessine la carte. `photo` : l'image choisie pour le fond photo.
 * Renvoie la toile ; le fond transparent donne un PNG, le reste un JPEG.
 */
export async function dessinerCarteSeance(
  d: DonneesCarte,
  id: IdentiteCarte,
  o: OptionsCarte,
  photo: CanvasImageSource | null = null
): Promise<HTMLCanvasElement> {
  await chargerPolices()
  const toile = document.createElement('canvas')
  toile.width = L
  toile.height = H
  const ctx = toile.getContext('2d')!
  const accent = o.fond === 'uni' ? '#ffffff' : o.accent
  const ombre = o.fond === 'photo' || o.fond === 'transparent'

  /* ---- Fond ---- */
  if (o.fond === 'teinte') {
    ctx.fillStyle = '#0e0f11'
    ctx.fillRect(0, 0, L, H)
    const [a, b] = trouverBanniere(id.teinte).canvas
    const sources: [string, number][] = b ? [[a, L * 0.2], [b, L * 0.9]] : [[a, L / 2]]
    for (const [rgb, x] of sources) {
      const g = ctx.createRadialGradient(x, 0, 0, x, 0, H * 0.55)
      g.addColorStop(0, `rgba(${rgb},0.42)`)
      g.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, L, H)
    }
    // Le motif dans le haut, fondu vers le bas.
    const m = document.createElement('canvas')
    m.width = L
    m.height = 900
    const mc = m.getContext('2d')!
    peindreMotif(mc, id.motif, L, 900)
    mc.globalCompositeOperation = 'destination-in'
    const fondu = mc.createLinearGradient(0, 0, 0, 900)
    fondu.addColorStop(0.5, 'rgba(0,0,0,1)')
    fondu.addColorStop(1, 'rgba(0,0,0,0)')
    mc.fillStyle = fondu
    mc.fillRect(0, 0, L, 900)
    ctx.drawImage(m, 0, 0)
  } else if (o.fond === 'uni') {
    ctx.fillStyle = o.couleurFond
    ctx.fillRect(0, 0, L, H)
  } else if (o.fond === 'photo') {
    ctx.fillStyle = '#121315'
    ctx.fillRect(0, 0, L, H)
    if (photo) {
      const pl = (photo as { width: number }).width
      const ph = (photo as { height: number }).height
      const s = Math.max(L / pl, H / ph)
      ctx.drawImage(photo, (L - pl * s) / 2, (H - ph * s) / 2, pl * s, ph * s)
    }
    const voile = ctx.createLinearGradient(0, 0, 0, H)
    voile.addColorStop(0, 'rgba(0,0,0,0.25)')
    voile.addColorStop(0.35, 'rgba(0,0,0,0)')
    voile.addColorStop(0.55, 'rgba(0,0,0,0.1)')
    voile.addColorStop(1, 'rgba(0,0,0,0.7)')
    ctx.fillStyle = voile
    ctx.fillRect(0, 0, L, H)
  }
  // Transparent : rien.

  /* ---- Mise en page des blocs ---- */
  const k = o.grand ? 1 : 0.76
  const marge = 88
  const largeur = L - marge * 2
  const ecart = Math.round(56 * k)

  type Bloc = { h: number; dessiner: (y: number) => void }
  const blocs: Bloc[] = []

  const texte = (t: string, x: number, y: number, police: string, couleur: string, align: CanvasTextAlign = 'left') => {
    ctx.save()
    ctx.font = police
    ctx.fillStyle = couleur
    ctx.textAlign = align
    if (ombre) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 3
    }
    ctx.fillText(t, x, y)
    ctx.restore()
  }
  const plaque = (y: number, h: number, bord: string | null = null) => {
    ctx.save()
    ctx.fillStyle =
      o.fond === 'transparent' ? 'rgba(0,0,0,0.38)' : o.fond === 'uni' ? 'rgba(0,0,0,0.18)' : o.fond === 'photo' ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.07)'
    rect(ctx, marge, y, largeur, h, 40)
    ctx.fill()
    if (bord) {
      ctx.strokeStyle = bord
      ctx.lineWidth = 4
      ctx.stroke()
    }
    ctx.restore()
  }

  if (o.titre) {
    ctx.font = '400 34px "IBM Plex Mono", monospace'
    const tTitre = ajuster(ctx, d.titre.toUpperCase(), (t) => `400 ${t}px "Bebas Neue", sans-serif`, Math.round(224 * k), largeur)
    const h = 34 + 20 + tTitre * 0.86
    blocs.push({
      h,
      dessiner: (y) => {
        texte(dateLongue(d.date).toUpperCase(), marge, y + 30, '500 34px "IBM Plex Mono", monospace', accent)
        texte(d.titre.toUpperCase(), marge, y + 54 + tTitre * 0.82, `400 ${tTitre}px "Bebas Neue", sans-serif`, '#ffffff')
      },
    })
  }

  if (o.chiffres) {
    const cases: [string, string, boolean][] = []
    const dur = duree(d.dureeSec)
    if (dur) cases.push([dur.toUpperCase(), 'durée', false])
    cases.push([o.poids ? kg(d.volume).toUpperCase() : `${d.exercices.length} EXOS`, o.poids ? 'volume' : 'exercices', false])
    cases.push([String(d.nbSeries), 'séries', false])
    if (d.xp) cases.push([`+${d.xp}`, 'XP', true])
    const tv = Math.round(120 * k)
    const lignes = Math.ceil(cases.length / 2)
    const hLigne = tv * 0.9 + 48
    blocs.push({
      h: lignes * hLigne - 8,
      dessiner: (y) => {
        cases.forEach(([v, lib, acc], i) => {
          const x = marge + (i % 2) * (largeur / 2 + 28)
          const yy = y + Math.floor(i / 2) * hLigne
          texte(v, x, yy + tv * 0.82, `400 ${tv}px "Bebas Neue", sans-serif`, acc ? accent : '#ffffff')
          texte(lib, x, yy + tv * 0.9 + 34, '500 32px Inter, sans-serif', 'rgba(255,255,255,0.68)')
        })
      },
    })
  }

  if (o.exercices && d.exercices.length) {
    const liste = d.exercices.slice(0, 5)
    const pas = Math.round(58 * k)
    const h = liste.length * pas + 72
    blocs.push({
      h,
      dessiner: (y) => {
        plaque(y, h)
        liste.forEach((e, i) => {
          const yy = y + 36 + pas * i + pas * 0.72
          ctx.save()
          ctx.font = `500 ${Math.round(40 * k)}px Inter, sans-serif`
          let nom = e.nom
          while (ctx.measureText(nom).width > largeur - 360 && nom.length > 4) nom = nom.slice(0, -2)
          if (nom !== e.nom) nom = nom.trimEnd() + '…'
          ctx.restore()
          texte(nom, marge + 48, yy, `500 ${Math.round(40 * k)}px Inter, sans-serif`, '#ffffff')
          texte(
            o.poids ? `${e.poids} × ${e.reps}` : `${e.nbSeries} série${e.nbSeries > 1 ? 's' : ''}`,
            L - marge - 48,
            yy,
            `500 ${Math.round(38 * k)}px "IBM Plex Mono", monospace`,
            '#ffffff',
            'right'
          )
        })
      },
    })
  }

  if (o.record && d.record) {
    const r = d.record
    const tn = Math.round(104 * k)
    const h = 40 + 32 + 18 + tn * 0.9 + 24 + 40 + 40
    blocs.push({
      h,
      dessiner: (y) => {
        plaque(y, h, accent)
        texte('NOUVEAU RECORD', marge + 48, y + 40 + 30, '500 32px "IBM Plex Mono", monospace', accent)
        const t = ajuster(ctx, r.exercice.toUpperCase(), (x) => `400 ${x}px "Bebas Neue", sans-serif`, tn, largeur - 96)
        texte(r.exercice.toUpperCase(), marge + 48, y + 40 + 32 + 18 + t * 0.82, `400 ${t}px "Bebas Neue", sans-serif`, '#ffffff')
        const detail = o.poids
          ? `${r.poids} kg × ${r.reps}${r.rm ? ` · 1RM estimé ${Math.round(r.rm)} kg` : ''}`
          : '1RM estimé en hausse'
        texte(detail, marge + 48, y + h - 44, '500 40px Inter, sans-serif', '#ffffff')
      },
    })
  }

  let imageAv: HTMLImageElement | null = null
  if (o.identite) {
    const src = imageAvatar(id.avatar)
    if (src) imageAv = await chargerImage(src)
    const c = 112
    blocs.push({
      h: c,
      dessiner: (y) => {
        const cad = trouverCadre(id.cadre)
        ctx.save()
        ctx.fillStyle = '#212428'
        rect(ctx, marge, y, c, c, 32)
        ctx.fill()
        if (cad.cle !== 'aucun') {
          ctx.strokeStyle = cad.couleur
          ctx.lineWidth = 6
          ctx.shadowColor = cad.couleur
          ctx.shadowBlur = 16
          ctx.stroke()
        }
        ctx.restore()
        if (imageAv) ctx.drawImage(imageAv, marge + 12, y + 12, c - 24, c - 24)
        else {
          ctx.save()
          ctx.font = '72px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(avatarTexte(id.avatar), marge + c / 2, y + c / 2 + 26)
          ctx.restore()
        }
        texte(id.pseudo.toUpperCase(), marge + c + 32, y + 62, '400 64px "Bebas Neue", sans-serif', '#ffffff')
        texte(`${id.rang} · niveau ${id.niveau}`.toUpperCase(), marge + c + 32, y + 104, '500 30px "IBM Plex Mono", monospace', 'rgba(255,255,255,0.72)')
      },
    })
  }

  const total = blocs.reduce((t, b) => t + b.h, 0) + ecart * Math.max(0, blocs.length - 1)
  const haut = 120
  const bas = H - 150
  let y =
    o.position === 'haut' ? haut : o.position === 'centre' ? (H - total) / 2 : Math.max(haut, bas - total)
  for (const b of blocs) {
    b.dessiner(y)
    y += b.h + ecart
  }

  /* ---- Logo ---- */
  ctx.save()
  ctx.font = '400 52px "Bebas Neue", sans-serif'
  ctx.textAlign = 'right'
  const point = ctx.measureText('.').width
  if (ombre) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 14
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText('FONTE', L - 56 - point, H - 56)
  ctx.fillStyle = o.fond === 'uni' && o.couleurFond === '#ff4b2b' ? '#ffffff' : '#ff4b2b'
  ctx.fillText('.', L - 56, H - 56)
  ctx.restore()

  return toile
}

/** La carte en fichier, prête à partager. */
export function carteEnFichier(toile: HTMLCanvasElement, transparent: boolean, nom: string): Promise<File | null> {
  return new Promise((ok) => {
    toile.toBlob(
      (b) => ok(b ? new File([b], `${nom}.${transparent ? 'png' : 'jpg'}`, { type: b.type }) : null),
      transparent ? 'image/png' : 'image/jpeg',
      0.92
    )
  })
}
