/* ============================================================
   Modèles et séance en direct
   ============================================================
   Un modèle est une liste d'exercices nommée, créée une fois et
   relancée à chaque séance. Sans lui, le mode direct serait
   inutilisable : personne ne ressaisit sa liste en salle, sur
   téléphone, entre deux séries.

   Chaque exercice peut recevoir des alternatives — la machine
   est souvent prise, et chercher un remplaçant à ce moment-là
   fait perdre du temps.
   ============================================================ */

export type EntreeModele = {
  id: string
  alternatives: string[]
}

export type Modele = {
  id: string
  nom: string
  entrees: EntreeModele[]
}

export type SerieLive = {
  poids: string
  reps: string
  faite: boolean
}

export type BlocLive = {
  exerciceId: string
  alternatives: string[]
  series: SerieLive[]
  termine: boolean
}

export type SeanceLive = {
  nom: string
  debut: number
  /** Figé à la fin, pour que le chrono s'arrête. */
  fin: number | null
  reposDebut: number | null
  index: number
  note: string
  blocs: BlocLive[]
  /**
   * Fin prévue de l'échauffement, en horodatage absolu.
   * `null` quand il est terminé ou qu'il n'y en avait pas.
   */
  echauffementFin: number | null
}

/** Durées d'échauffement proposées, en minutes. */
export const DUREES_ECHAUFFEMENT = [0, 3, 5, 8, 10, 15] as const

export const CLE_ECHAUFFEMENT = 'fonte-echauffement'

/** Au-delà de douze heures, la séance est considérée oubliée. */
export const DUREE_MAX_MS = 12 * 3600 * 1000

export function cleLive(userId: string): string {
  return `fonte-live:${userId}`
}

/**
 * Durée écoulée.
 *
 * Calculée à partir d'horodatages absolus, jamais d'un compteur
 * qu'on incrémente : c'est ce qui permet au chrono de rester
 * juste même quand le navigateur suspend la page en
 * arrière-plan.
 */
export function dureeLive(live: SeanceLive): number {
  return (live.fin ?? Date.now()) - live.debut
}

export function mmss(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** Le modèle accepte deux formats : l'ancien carnet stockait
 *  une simple liste d'identifiants. */
export function lireEntrees(brut: unknown): EntreeModele[] {
  if (!Array.isArray(brut)) return []
  return brut.map((e) =>
    typeof e === 'string'
      ? { id: e, alternatives: [] }
      : {
          id: String((e as { id?: unknown }).id ?? ''),
          alternatives: (
            ((e as { alternatives?: unknown }).alternatives ?? []) as unknown[]
          ).map(String),
        }
  )
}
