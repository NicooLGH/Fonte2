import type { Groupe } from '@/types/database'
import type { Seance } from './xp'

/* ============================================================
   Vocabulaire du carnet
   ============================================================
   Types et constantes utilisables des deux côtés, serveur comme
   navigateur. Ce fichier ne doit JAMAIS importer de code
   serveur : les composants marqués `'use client'` s'en servent,
   et tout ce qu'il touche part dans le navigateur.

   Le chargement des données vit à côté, dans `donnees.ts`.
   ============================================================ */

export type Exercice = {
  id: string
  nom: string
  objectif: number | null
  groupe: Groupe | null
}

export type SeanceComplete = Seance & {
  note: string | null
  dureeSec: number | null
}

export const GROUPES: { cle: Groupe; nom: string; ico: string }[] = [
  { cle: 'pectoraux', nom: 'Pectoraux', ico: '🫁' },
  { cle: 'dos', nom: 'Dos', ico: '🧗' },
  { cle: 'epaules', nom: 'Épaules', ico: '🏋️' },
  { cle: 'biceps', nom: 'Biceps', ico: '💪' },
  { cle: 'triceps', nom: 'Triceps', ico: '🦾' },
  { cle: 'jambes', nom: 'Jambes', ico: '🦵' },
  { cle: 'fessiers', nom: 'Fessiers', ico: '🍑' },
  { cle: 'abdos', nom: 'Abdos', ico: '🧍' },
  { cle: 'cardio', nom: 'Cardio', ico: '🏃' },
  { cle: 'autre', nom: 'Autre', ico: '⚙️' },
]

export function nomGroupe(cle: Groupe | null): string {
  return GROUPES.find((g) => g.cle === cle)?.nom ?? 'Non classé'
}

export function icoGroupe(cle: Groupe | null): string {
  return GROUPES.find((g) => g.cle === cle)?.ico ?? '❓'
}
