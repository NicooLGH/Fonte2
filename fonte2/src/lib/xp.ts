import { cleSemaine } from './semaine'

/* ============================================================
   XP, niveaux et rangs
   ============================================================
   Fonctions pures : elles ne lisent rien, n'écrivent rien, et
   ne dépendent d'aucune variable globale. On peut donc vérifier
   le barème sans lancer l'application — ce qui manquait à
   l'ancienne version, où le calcul était éparpillé.
   ============================================================ */

export const BAREME = {
  seance: 15,
  streak: 10,
  /** Volume divisé par 10, plafonné par semaine. */
  volumeDiviseur: 10,
  volumePlafondSemaine: 250,
  record: 50,
  suivi: 15,
  bonusDimanche: 5,
  /** Semaine comportant à la fois une séance et un relevé. */
  combo: 25,
} as const

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

export type Repartition = {
  seances: number
  streak: number
  volume: number
  records: number
  suivi: number
  bonusDimanche: number
  combo: number
}

export const LIBELLES: Record<keyof Repartition, string> = {
  seances: 'Séance enregistrée',
  streak: "Semaine d'affilée",
  volume: 'Volume soulevé',
  records: 'Nouveau record',
  suivi: 'Relevé hebdo complété',
  bonusDimanche: 'Bilan du dimanche',
  combo: 'Semaine complète',
}

/** Volume total d'une séance, en kilos déplacés. */
export function volumeSeance(seance: Seance): number {
  return seance.blocs.reduce(
    (total, bloc) =>
      total + bloc.series.reduce((s, serie) => s + serie.poids * serie.reps, 0),
    0
  )
}

/** Charge la plus lourde d'une séance sur un exercice donné. */
function chargeMax(seance: Seance, exerciceId: string): number | null {
  const bloc = seance.blocs.find((b) => b.exerciceId === exerciceId)
  if (!bloc || bloc.series.length === 0) return null
  return Math.max(...bloc.series.map((s) => s.poids))
}

/**
 * Semaines consécutives avec au moins une séance, en remontant
 * depuis la plus récente.
 */
export function semainesDaffilee(seances: Seance[]): number {
  const semaines = [...new Set(seances.map((s) => s.semaine))].sort().reverse()
  if (semaines.length === 0) return 0

  let compte = 1
  for (let i = 1; i < semaines.length; i++) {
    if (semaineJuste_avant(semaines[i], semaines[i - 1])) compte++
    else break
  }
  return compte
}

/** `a` est-elle la semaine qui précède immédiatement `b` ? */
function semaineJuste_avant(a: string, b: string): boolean {
  const date = (cle: string) => {
    const [annee, sem] = cle.split('-W').map(Number)
    // Lundi de la semaine ISO
    const jan4 = new Date(Date.UTC(annee, 0, 4))
    const lundiS1 = new Date(jan4)
    lundiS1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1))
    lundiS1.setUTCDate(lundiS1.getUTCDate() + (sem - 1) * 7)
    return lundiS1.getTime()
  }
  return date(b) - date(a) === 7 * 86400000
}

/**
 * Volume converti en XP, plafonné semaine par semaine.
 *
 * Le plafond est le cœur du barème : sans lui, une séance
 * exceptionnelle écraserait des mois de régularité, ce qui va à
 * l'encontre de ce que le carnet cherche à récompenser.
 */
export function xpVolume(seances: Seance[]): number {
  const parSemaine = new Map<string, number>()
  for (const seance of seances) {
    parSemaine.set(
      seance.semaine,
      (parSemaine.get(seance.semaine) ?? 0) + volumeSeance(seance)
    )
  }

  let total = 0
  for (const volume of parSemaine.values()) {
    total += Math.min(
      Math.floor(volume / BAREME.volumeDiviseur),
      BAREME.volumePlafondSemaine
    )
  }
  return total
}

/**
 * Records battus, tous exercices confondus.
 *
 * La toute première séance sur un exercice ne compte pas : c'est
 * une référence, pas un dépassement.
 */
export function xpRecords(seances: Seance[], exerciceIds: string[]): number {
  const parDate = [...seances].sort((a, b) => a.date.localeCompare(b.date))
  let total = 0

  for (const id of exerciceIds) {
    const avecCharge = parDate
      .map((s) => chargeMax(s, id))
      .filter((c): c is number => c !== null)

    if (avecCharge.length < 2) continue

    let record = avecCharge[0]
    for (let i = 1; i < avecCharge.length; i++) {
      if (avecCharge[i] > record) {
        record = avecCharge[i]
        total += BAREME.record
      }
    }
  }
  return total
}

/** Répartition complète de l'XP, source par source. */
export function repartitionXP(
  seances: Seance[],
  releves: Releve[],
  exerciceIds: string[]
): Repartition {
  const semainesSeances = new Set(seances.map((s) => s.semaine))
  const semainesReleves = new Set(releves.map((r) => r.semaine))

  let combo = 0
  for (const semaine of semainesSeances) {
    if (semainesReleves.has(semaine)) combo += BAREME.combo
  }

  return {
    seances: seances.length * BAREME.seance,
    streak: semainesDaffilee(seances) * BAREME.streak,
    volume: xpVolume(seances),
    records: xpRecords(seances, exerciceIds),
    suivi: semainesReleves.size * BAREME.suivi,
    bonusDimanche:
      releves.filter((r) => r.bonusDimanche).length * BAREME.bonusDimanche,
    combo,
  }
}

export function totalXP(r: Repartition): number {
  return Object.values(r).reduce((a, b) => a + b, 0)
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

export function rang(niveau: number): string {
  if (niveau >= 80) return 'Légende'
  if (niveau >= 55) return 'Diamant'
  if (niveau >= 35) return 'Platine'
  if (niveau >= 20) return 'Or'
  if (niveau >= 10) return 'Argent'
  if (niveau >= 5) return 'Bronze'
  return 'Débutant'
}

/** Le dimanche vaut un bonus, calculé sur l'heure locale. */
export function estDimanche(date: Date = new Date()): boolean {
  return date.getDay() === 0
}

/** Semaine ISO d'une date au format `2026-08-27`. */
export function semaineDe(date: string): string {
  return cleSemaine(new Date(date + 'T12:00:00'))
}
