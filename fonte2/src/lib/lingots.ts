/* ============================================================
   Lingots
   ============================================================
   La monnaie de FONTE. Le solde et les gains sont tenus par la
   base (fonte-lingots.sql) : ces valeurs servent à l'affichage et
   DOIVENT rester identiques à celles du SQL.
   ============================================================ */

/** Bonus du jour, cycle de 7 jours. Un jour manqué : retour au jour 1. */
export const BONUS_CYCLE = [5, 5, 10, 10, 15, 15, 40] as const

/** Lingots versés en atteignant un niveau (0 : aucun). */
export function montantPalier(niveau: number): number {
  if (niveau === 2 || niveau === 4) return 50
  if (niveau === 7) return 75
  if (niveau === 12 || niveau === 15) return 100
  if (niveau === 18 || niveau === 22) return 150
  if (niveau === 27 || niveau === 33) return 200
  if (niveau === 38 || niveau === 43) return 250
  if (niveau === 48 || niveau === 53) return 300
  if (niveau === 58 || niveau === 63) return 350
  if (niveau === 68 || niveau === 73) return 400
  if (niveau === 78) return 500
  if (niveau > 80 && niveau % 5 === 0) return 500
  return 0
}

/** Lingots gagnés en passant du niveau `avant` au niveau `apres`. */
export function lingotsEntre(avant: number, apres: number): number {
  let total = 0
  for (let n = avant + 1; n <= apres; n++) total += montantPalier(n)
  return total
}

/* ---- Tarifs (la boutique arrive en session 10) ---- */

export const TARIFS_COSMETIQUES = [
  { nom: 'Commun', prix: 500 },
  { nom: 'Rare', prix: 1000 },
  { nom: 'Épique', prix: 2000 },
] as const

export const TARIFS_PREMIUM = [
  { nom: 'Premium · essai 7 jours', prix: 2500, limite: '1 fois par trimestre' },
  { nom: 'Premium · 1 mois', prix: 6000, limite: '1 fois par an' },
  { nom: 'Premium · 3 mois', prix: 15000, limite: '1 fois par an' },
  { nom: 'Premium · 1 an', prix: 45000, limite: null },
] as const

/* ---- État renvoyé par la base ---- */

export type SourceLingots = 'bonus' | 'palier' | 'achat' | 'remboursement' | 'ajustement'

export type LigneLingots = {
  source: SourceLingots
  montant: number
  libelle: string
  jour: string
  cree: string
}

export type EtatBonus = {
  /** Jour du cycle à récupérer (ou récupéré) aujourd'hui, de 1 à 7. */
  jour: number
  recupere: boolean
  montant: number
  /** Ce que vaudra le bonus de demain. */
  demain: number
}

export type EtatLingots = {
  solde: number
  gagne: number
  depense: number
  bonus: EtatBonus
  historique: LigneLingots[]
}

export const ETAT_VIDE: EtatLingots = {
  solde: 0,
  gagne: 0,
  depense: 0,
  bonus: { jour: 1, recupere: false, montant: BONUS_CYCLE[0], demain: BONUS_CYCLE[1] },
  historique: [],
}

export function formatLingots(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}
