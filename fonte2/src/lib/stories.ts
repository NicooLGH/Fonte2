import { creerClient } from './supabase/client'

/* ============================================================
   Stories
   ============================================================
   Une photo par jour, visible par les amis pendant 24 h. Rangée
   dans le seau privé `stories`, sous `<user_id>/<uuid>.jpg` :
   la base n'autorise personne d'autre à écrire dans ce dossier,
   et ne laisse lire la photo qu'aux amis, tant qu'elle est en
   ligne (fonte-stories.sql).

   Ce fichier sert des deux côtés : types et préparation de
   l'image (navigateur).
   ============================================================ */

export const SEAU_STORIES = 'stories'

export type TypeEtiquette = 'seance' | 'record' | 'niveau' | 'aucune'

export type Etiquette =
  | { type: 'seance'; titre: string; dureeSec: number | null; volume: number; records: number }
  | { type: 'record'; titre: string }
  | { type: 'niveau'; niveau: number }
  | { type: 'aucune' }

export type Story = {
  id: string
  url: string | null
  etiquette: Etiquette
  position: number
  cree: string
  vue: boolean
  maReaction: string | null
  /** Seulement pour ses propres stories. */
  nbVues: number | null
  reactions: Record<string, number> | null
}

export type GroupeStories = {
  userId: string
  pseudo: string
  avatar: string | null
  cadre: string
  moi: boolean
  aVoir: boolean
  stories: Story[]
}

export const SIGNES_STORY = ['💪', '🔥', '👏', '🚀'] as const

export function lireEtiquette(v: unknown): Etiquette {
  const e = (v ?? {}) as Record<string, unknown>
  if (e.type === 'seance')
    return {
      type: 'seance',
      titre: typeof e.titre === 'string' ? e.titre : 'Séance',
      dureeSec: typeof e.duree_sec === 'number' ? e.duree_sec : null,
      volume: Number(e.volume) || 0,
      records: Number(e.records) || 0,
    }
  if (e.type === 'record') return { type: 'record', titre: typeof e.titre === 'string' ? e.titre : '' }
  if (e.type === 'niveau') return { type: 'niveau', niveau: Number(e.niveau) || 0 }
  return { type: 'aucune' }
}

/* ---- Préparation de l'image (navigateur) ---- */

/** Format portrait 9:16, assez net pour un téléphone, < 400 Ko. */
const LARGEUR = 1080
const HAUTEUR = 1920
const QUALITE = 0.82

/** Recadre une source (vidéo ou image) en 9:16, centré. */
export function recadrer(
  source: CanvasImageSource,
  largeurSource: number,
  hauteurSource: number,
  miroir = false
): Promise<Blob> {
  const toile = document.createElement('canvas')
  toile.width = LARGEUR
  toile.height = HAUTEUR
  const ctx = toile.getContext('2d')
  if (!ctx) return Promise.reject(new Error("Impossible de préparer l'image"))

  const echelle = Math.max(LARGEUR / largeurSource, HAUTEUR / hauteurSource)
  const l = largeurSource * echelle
  const h = hauteurSource * echelle
  if (miroir) {
    ctx.translate(LARGEUR, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, (LARGEUR - l) / 2, (HAUTEUR - h) / 2, l, h)

  return new Promise((resoudre, rejeter) =>
    toile.toBlob(
      (b) => (b ? resoudre(b) : rejeter(new Error('Conversion échouée'))),
      'image/jpeg',
      QUALITE
    )
  )
}

export function depuisFichier(fichier: File): Promise<Blob> {
  return new Promise((resoudre, rejeter) => {
    const image = new Image()
    image.onload = () => {
      recadrer(image, image.naturalWidth, image.naturalHeight).then(resoudre, rejeter)
      URL.revokeObjectURL(image.src)
    }
    image.onerror = () => rejeter(new Error('Image illisible'))
    image.src = URL.createObjectURL(fichier)
  })
}

/** Envoie la photo dans son dossier. Renvoie le chemin. */
export async function envoyerStory(userId: string, image: Blob): Promise<{ chemin?: string; erreur?: string }> {
  const chemin = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await creerClient()
    .storage.from(SEAU_STORIES)
    .upload(chemin, image, { contentType: 'image/jpeg', upsert: false })
  if (error) return { erreur: "L'envoi de la photo a échoué. Réessaie." }
  return { chemin }
}
