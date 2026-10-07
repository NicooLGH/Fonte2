import { cleSemaine, lundiDe } from './semaine'
import type { CleActivite } from './cardio'

/* ============================================================
   Planning de la semaine
   ============================================================
   Ce qu'on prévoit chaque jour : un modèle, du cardio ou du
   repos. Il se répète d'une semaine à l'autre. L'accueil s'en
   sert pour proposer la séance du jour.
   ============================================================ */

/** 1 = lundi … 7 = dimanche */
export type Jour = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type TypePlanning = 'modele' | 'cardio' | 'repos'

export type JourPlanning = {
  jour: Jour
  type: TypePlanning
  modeleId: string | null
  activite: CleActivite | null
}

export const JOURS: { jour: Jour; court: string; long: string }[] = [
  { jour: 1, court: 'LUN', long: 'Lundi' },
  { jour: 2, court: 'MAR', long: 'Mardi' },
  { jour: 3, court: 'MER', long: 'Mercredi' },
  { jour: 4, court: 'JEU', long: 'Jeudi' },
  { jour: 5, court: 'VEN', long: 'Vendredi' },
  { jour: 6, court: 'SAM', long: 'Samedi' },
  { jour: 7, court: 'DIM', long: 'Dimanche' },
]

/** Jour de la semaine d'une date `2026-10-07` (1 = lundi). */
export function jourDe(iso: string): Jour {
  const d = new Date(iso + 'T12:00:00')
  return ((d.getDay() || 7) as Jour)
}

/** Les sept dates de la semaine qui contient `iso`, du lundi au dimanche. */
export function joursDeLaSemaine(iso: string): string[] {
  const lundi = lundiDe(cleSemaine(new Date(iso + 'T12:00:00')))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi.getTime() + i * 86400000)
    return d.toISOString().slice(0, 10)
  })
}

/**
 * Nombre de semaines d'affilée avec au moins une activité.
 * La semaine en cours compte si elle est déjà active ; sinon on
 * part de la précédente, pour ne pas afficher zéro un lundi matin.
 */
export function serieDeSemaines(semainesActives: Set<string>, aujourdhuiIso: string): number {
  let cle = cleSemaine(new Date(aujourdhuiIso + 'T12:00:00'))
  const reculer = (c: string) =>
    cleSemaine(new Date(lundiDe(c).getTime() - 7 * 86400000 + 12 * 3600000))

  if (!semainesActives.has(cle)) cle = reculer(cle)
  let n = 0
  while (semainesActives.has(cle)) {
    n++
    cle = reculer(cle)
  }
  return n
}
