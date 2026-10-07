/* ============================================================
   Cardio
   ============================================================
   Une saisie simple : activité, durée, distance facultative.
   FONTE reste un carnet de musculation ; le cardio sert à ne
   rien perdre de sa semaine, pas à analyser une course.

   Les clés DOIVENT rester identiques à la contrainte de la
   table `cardio` (fonte-design2.sql).
   ============================================================ */

export type CleActivite = 'course' | 'velo' | 'rameur' | 'natation' | 'marche' | 'autre'

export const ACTIVITES: { cle: CleActivite; nom: string; icone: string }[] = [
  {
    cle: 'course',
    nom: 'Course',
    icone: '<circle cx="14" cy="4" r="2"/><path d="M6 21l3-6 3 2v5M9 15l1-5 4 1 3 3M10 10l-3 2"/>',
  },
  {
    cle: 'velo',
    nom: 'Vélo',
    icone: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17l4-8h6l3 8M9.5 9L8 6h3"/>',
  },
  { cle: 'rameur', nom: 'Rameur', icone: '<path d="M3 18h18M6 18l4-8 4 3 4-6"/>' },
  {
    cle: 'natation',
    nom: 'Natation',
    icone: '<path d="M2 18c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-1M7 13l4-4 3 3 3-2"/>',
  },
  {
    cle: 'marche',
    nom: 'Marche',
    icone: '<circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 2 2v4M11 15l1-5-3 1-1 3M12 10l3 3h3"/>',
  },
  {
    cle: 'autre',
    nom: 'Autre',
    icone: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  },
]

export function activite(cle: string | null | undefined) {
  return ACTIVITES.find((a) => a.cle === cle) ?? ACTIVITES[ACTIVITES.length - 1]
}

export function estActivite(v: unknown): v is CleActivite {
  return ACTIVITES.some((a) => a.cle === v)
}

export type Cardio = {
  id: string
  date: string
  activite: CleActivite
  dureeMin: number
  distanceKm: number | null
  note: string | null
}

/** « 32 min · 5,4 km » */
export function resumeCardio(c: Pick<Cardio, 'dureeMin' | 'distanceKm'>): string {
  const km =
    c.distanceKm != null
      ? ` · ${c.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km`
      : ''
  return `${c.dureeMin} min${km}`
}

/** Bornes de saisie, identiques aux contraintes de la table. */
export const DUREE_MAX_MIN = 1440
export const DISTANCE_MAX_KM = 1000

/** Saisie après coup (muscu ou cardio) : jusqu'à six jours en arrière. */
export const JOURS_SAISIE = 7
