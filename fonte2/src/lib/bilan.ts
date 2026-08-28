import { volumeSeance, type Seance } from './xp'
import { CHAMPS_SUIVI, type CleSuivi, type ReleveComplet } from './suivi'
import type { Exercice, SeanceComplete } from './carnet'

/* ============================================================
   Bilan mensuel
   ============================================================
   Calculé à partir des données déjà chargées : aucune requête
   supplémentaire. Fonctions pures, donc vérifiables sans lancer
   l'application.

   Le bilan porte sur le mois écoulé et s'affiche la première
   semaine du mois suivant.
   ============================================================ */

/** Nombre de jours pendant lesquels le bilan reste proposé. */
export const JOURS_AFFICHAGE = 7

export type Mois = { annee: number; mois: number } // mois : 1-12

export type Evolution = {
  cle: CleSuivi
  libelle: string
  unite: string
  ecart: number
  fin: number
}

export type Bilan = {
  mois: Mois
  nom: string
  nbSeances: number
  semaines: number
  dureeTotale: number
  volume: number
  series: number
  groupeTop: string | null
  records: { nom: string; poids: number }[]
  objectifs: { nom: string; objectif: number }[]
  caloriesMoyennes: number | null
  evolutions: Evolution[]
  vide: boolean
}

export function moisPrecedent(depuis: Date = new Date()): Mois {
  const d = new Date(depuis.getFullYear(), depuis.getMonth(), 1)
  d.setMonth(d.getMonth() - 1)
  return { annee: d.getFullYear(), mois: d.getMonth() + 1 }
}

export function cleMois(m: Mois): string {
  return `${m.annee}-${String(m.mois).padStart(2, '0')}`
}

export function lireCleMois(cle: string): Mois | null {
  const c = /^(\d{4})-(\d{2})$/.exec(cle)
  if (!c) return null
  const mois = Number(c[2])
  if (mois < 1 || mois > 12) return null
  return { annee: Number(c[1]), mois }
}

export function nomMois(m: Mois): string {
  return new Date(m.annee, m.mois - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

/** Le bilan reste proposé la première semaine du mois suivant. */
export function bilanDisponible(date: Date = new Date()): boolean {
  return date.getDate() <= JOURS_AFFICHAGE
}

export function calculerBilan(
  m: Mois,
  seances: SeanceComplete[],
  releves: ReleveComplet[],
  exercices: Exercice[]
): Bilan {
  const prefixe = cleMois(m)
  const dansLeMois = (d: string) => d.startsWith(prefixe)

  const duMois = seances.filter((s) => dansLeMois(s.date))
  const relevesDuMois = releves.filter((r) => dansLeMois(r.date))

  /* ---- Volume, séries, groupe le plus travaillé ---- */
  const groupeDe = new Map(exercices.map((e) => [e.id, e.groupe]))
  const parGroupe = new Map<string, number>()
  let volume = 0
  let series = 0

  for (const s of duMois) {
    for (const bloc of s.blocs) {
      const cle = groupeDe.get(bloc.exerciceId) ?? 'non_classe'
      for (const serie of bloc.series) {
        const v = serie.poids * serie.reps
        volume += v
        series += 1
        parGroupe.set(cle, (parGroupe.get(cle) ?? 0) + v)
      }
    }
  }

  const groupeTop =
    [...parGroupe.entries()]
      .filter(([cle]) => cle !== 'non_classe')
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  /* ---- Records battus pendant le mois ---- */
  const records: { nom: string; poids: number }[] = []
  const parDate = [...seances].sort((a, b) => a.date.localeCompare(b.date))

  for (const exo of exercices) {
    const passages = parDate
      .map((s) => {
        const bloc = s.blocs.find((b) => b.exerciceId === exo.id)
        if (!bloc?.series.length) return null
        return {
          date: s.date,
          max: Math.max(...bloc.series.map((x) => x.poids)),
        }
      })
      .filter((p): p is { date: string; max: number } => p !== null)

    if (passages.length < 2) continue

    let record = passages[0].max
    let meilleur: number | null = null

    for (let i = 1; i < passages.length; i++) {
      if (passages[i].max > record) {
        record = passages[i].max
        if (dansLeMois(passages[i].date)) meilleur = record
      }
    }
    if (meilleur !== null) records.push({ nom: exo.nom, poids: meilleur })
  }
  records.sort((a, b) => b.poids - a.poids)

  /* ---- Objectifs atteints ---- */
  const objectifs = exercices
    .filter((e) => e.objectif !== null)
    .map((e) => {
      const charges = duMois
        .flatMap((s) => s.blocs.filter((b) => b.exerciceId === e.id))
        .flatMap((b) => b.series.map((x) => x.poids))
      if (charges.length === 0) return null
      return Math.max(...charges) >= e.objectif!
        ? { nom: e.nom, objectif: e.objectif! }
        : null
    })
    .filter((o): o is { nom: string; objectif: number } => o !== null)

  /* ---- Évolution du corps : premier contre dernier relevé ---- */
  const tries = [...relevesDuMois].sort((a, b) => a.date.localeCompare(b.date))
  const evolutions: Evolution[] = []

  for (const champ of CHAMPS_SUIVI) {
    if (champ.cle === 'calories') continue
    const avec = tries.filter((r) => r[champ.cle] !== null)
    if (avec.length < 2) continue

    const debut = avec[0][champ.cle] as number
    const fin = avec[avec.length - 1][champ.cle] as number
    const ecart = Number((fin - debut).toFixed(1))
    if (ecart !== 0)
      evolutions.push({
        cle: champ.cle,
        libelle: champ.libelle,
        unite: champ.unite,
        ecart,
        fin,
      })
  }

  const avecCalories = relevesDuMois.filter((r) => r.calories !== null)
  const caloriesMoyennes = avecCalories.length
    ? Math.round(
        avecCalories.reduce((t, r) => t + (r.calories as number), 0) /
          avecCalories.length
      )
    : null

  return {
    mois: m,
    nom: nomMois(m),
    nbSeances: duMois.length,
    semaines: new Set(duMois.map((s) => s.semaine)).size,
    dureeTotale: duMois.reduce((t, s) => t + (s.dureeSec ?? 0), 0),
    volume: Math.round(volume),
    series,
    groupeTop,
    records,
    objectifs,
    caloriesMoyennes,
    evolutions,
    vide: duMois.length === 0 && relevesDuMois.length === 0,
  }
}

/** Volume d'un mois, utile pour la bannière. */
export function volumeDuMois(m: Mois, seances: Seance[]): number {
  const prefixe = cleMois(m)
  return Math.round(
    seances
      .filter((s) => s.date.startsWith(prefixe))
      .reduce((t, s) => t + volumeSeance(s), 0)
  )
}
