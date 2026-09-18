import { creerClient } from './supabase/client'

/* ============================================================
   Photos de progression
   ============================================================
   Une par semaine, rangée sous `<user_id>/<semaine>.jpg`. Le
   chemin porte l'identifiant parce que c'est lui qui sert de
   clé aux règles de sécurité : chacun ne voit que son dossier.

   Elles ne sortent jamais du carnet — ni sur le profil public,
   ni entre amis. Même règle que les mensurations, et pour la
   même raison.
   ============================================================ */

const SEAU = 'photos'

/** Assez grand pour comparer, assez petit pour tenir. */
const COTE_MAX = 1200
const QUALITE = 0.8

export function cheminPhoto(userId: string, semaine: string): string {
  return `${userId}/${semaine}.jpg`
}

/**
 * Redimensionne avant l'envoi.
 *
 * Une photo de téléphone pèse 3 à 8 Mo ; réduite, elle tombe
 * sous 200 Ko sans perte visible à l'écran. Sans ça, l'envoi
 * serait lent en salle et le quota partirait en quelques mois.
 */
export async function preparerImage(fichier: File): Promise<Blob> {
  const image = await chargerImage(fichier)

  const ratio = Math.min(1, COTE_MAX / Math.max(image.width, image.height))
  const largeur = Math.round(image.width * ratio)
  const hauteur = Math.round(image.height * ratio)

  const toile = document.createElement('canvas')
  toile.width = largeur
  toile.height = hauteur

  const ctx = toile.getContext('2d')
  if (!ctx) throw new Error("Impossible de préparer l'image")

  ctx.drawImage(image, 0, 0, largeur, hauteur)
  URL.revokeObjectURL(image.src)

  return await new Promise<Blob>((resoudre, rejeter) => {
    toile.toBlob(
      (blob) => (blob ? resoudre(blob) : rejeter(new Error('Conversion échouée'))),
      'image/jpeg',
      QUALITE
    )
  })
}

function chargerImage(fichier: File): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const image = new Image()
    image.onload = () => resoudre(image)
    image.onerror = () => rejeter(new Error('Image illisible'))
    image.src = URL.createObjectURL(fichier)
  })
}

export async function envoyerPhoto(
  userId: string,
  semaine: string,
  fichier: File
): Promise<{ erreur?: string }> {
  try {
    const image = await preparerImage(fichier)
    const supabase = creerClient()

    const { error } = await supabase.storage
      .from(SEAU)
      .upload(cheminPhoto(userId, semaine), image, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) return { erreur: "L'envoi a échoué. Réessaie." }
    return {}
  } catch {
    return { erreur: 'Cette image ne peut pas être traitée.' }
  }
}

/**
 * Adresse temporaire d'une photo.
 *
 * Le rangement est privé : il n'existe pas d'adresse publique.
 * On demande un lien signé, valable une heure — assez pour la
 * consulter, trop court pour être partagé durablement.
 */
export async function lienPhoto(
  userId: string,
  semaine: string
): Promise<string | null> {
  const supabase = creerClient()
  const { data, error } = await supabase.storage
    .from(SEAU)
    .createSignedUrl(cheminPhoto(userId, semaine), 3600)

  if (error || !data) return null
  return data.signedUrl
}

export async function supprimerPhoto(
  userId: string,
  semaine: string
): Promise<{ erreur?: string }> {
  const supabase = creerClient()
  const { error } = await supabase.storage
    .from(SEAU)
    .remove([cheminPhoto(userId, semaine)])

  if (error) return { erreur: 'Suppression impossible.' }
  return {}
}
