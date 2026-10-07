import { cleSemaine } from './semaine'
import type { ConfigBadge } from './defis'

/* ============================================================
   XP, niveaux et rangs
   ============================================================
   Fonctions pures : elles ne lisent rien, n'écrivent rien, et
   ne dépendent d'aucune variable globale. On peut donc vérifier
   le barème sans lancer l'application — ce qui manquait à
   l'ancienne version, où le calcul était éparpillé.
   ============================================================ */

/**
 * Barème.
 *
 * Le calcul lui-même vit dans la base (fonction `xp_recalculer`,
 * fichier fonte-xp.sql) : c'est elle qui remplit le journal. Ces
 * valeurs servent à l'affichage du barème et DOIVENT rester
 * identiques à celles du SQL.
 */
export const BAREME = {
  seance: 30,
  serieValidee: 2,
  seriesPlafondSeance: 40,
  record: 40,
  releve: 20,
  bonusDimanche: 5,
  semaineComplete: 30,
  serieSemaines: 10,
  serieSemainesPlafond: 100,
} as const

export type SourceXP = 'serie' | 'seance' | 'cardio' | 'record' | 'releve' | 'semaine' | 'badge' | 'defi'

/** Une ligne du journal. */
export type GainXP = {
  source: SourceXP
  libelle: string
  montant: number
  date: string
  semaine: string
  /** Pour un gain de badge : lequel, et quel palier (1 = premier). */
  badge?: string | null
  palier?: number | null
  /** Pour un défi réussi : son badge et son titre. */
  defiBadge?: ConfigBadge | null
  defiTitre?: string | null
}

/** Un paquet de semaines du journal. */
export type PageJournal = { entrees: GainXP[]; suite: boolean }

/** Ce qu'une séance vient de rapporter. */
export type XPSeance = { total: number; gains: GainXP[] }

export type Serie = { poids: number; reps: number }
export type BlocExercice = { exerciceId: string; series: Serie[] }

export type Seance = {
  id: string
  date: string
  semaine: string
  blocs: BlocExercice[]
}

export type Releve = {
  id: string
  semaine: string
  bonusDimanche: boolean
}

/** Volume total d'une séance, en kilos déplacés. */
export function volumeSeance(seance: Seance): number {
  return seance.blocs.reduce(
    (total, bloc) =>
      total + bloc.series.reduce((s, serie) => s + serie.poids * serie.reps, 0),
    0
  )
}

/* ---- Niveaux ---- */

/** XP cumulé nécessaire pour atteindre le niveau L. */
export function xpCumulePourNiveau(niveau: number): number {
  return 10 * niveau * (niveau + 1)
}

export type Niveau = {
  niveau: number
  xp: number
  xpDebut: number
  xpSuivant: number
  progression: number
  rang: string
}

export function calculerNiveau(xp: number): Niveau {
  let niveau = 0
  while (xpCumulePourNiveau(niveau + 1) <= xp) niveau++

  const xpDebut = xpCumulePourNiveau(niveau)
  const xpSuivant = xpCumulePourNiveau(niveau + 1)

  return {
    niveau,
    xp,
    xpDebut,
    xpSuivant,
    progression: (xp - xpDebut) / (xpSuivant - xpDebut),
    rang: rang(niveau),
  }
}

/** Rangs, du plus bas au plus haut. */
export const RANGS = [
  { nom: 'Débutant', niveau: 0 },
  { nom: 'Bronze', niveau: 5 },
  { nom: 'Argent', niveau: 10 },
  { nom: 'Or', niveau: 20 },
  { nom: 'Platine', niveau: 35 },
  { nom: 'Diamant', niveau: 55 },
  { nom: 'Légende', niveau: 80 },
] as const

export function rang(niveau: number): string {
  let nom: string = RANGS[0].nom
  for (const r of RANGS) if (niveau >= r.niveau) nom = r.nom
  return nom
}

/** Le rang suivant, ou null au sommet. */
export function rangSuivant(niveau: number): { nom: string; niveau: number } | null {
  return RANGS.find((r) => r.niveau > niveau) ?? null
}

/** Le dimanche vaut un bonus, calculé sur l'heure locale. */
export function estDimanche(date: Date = new Date()): boolean {
  return date.getDay() === 0
}

/** Semaine ISO d'une date au format `2026-08-27`. */
export function semaineDe(date: string): string {
  return cleSemaine(new Date(date + 'T12:00:00'))
}
