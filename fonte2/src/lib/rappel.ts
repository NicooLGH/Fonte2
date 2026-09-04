/* ============================================================
   Rappel hebdomadaire
   ============================================================
   Un jour choisi dans la semaine : si le relevé n'a pas encore
   été rempli ce jour-là, un bandeau le rappelle à l'ouverture.

   Volontairement discret : ce n'est pas une alerte, seulement un
   pense-bête qu'on peut écarter. Il ne revient pas avant la
   semaine suivante.
   ============================================================ */

export const JOURS = [
  { valeur: 1, nom: 'Lundi' },
  { valeur: 2, nom: 'Mardi' },
  { valeur: 3, nom: 'Mercredi' },
  { valeur: 4, nom: 'Jeudi' },
  { valeur: 5, nom: 'Vendredi' },
  { valeur: 6, nom: 'Samedi' },
  { valeur: 0, nom: 'Dimanche' },
] as const

export type Rappel = {
  jour: number | null
  semaineEcartee: string | null
}

export function nomJour(valeur: number | null): string {
  if (valeur === null) return 'Aucun'
  return JOURS.find((j) => j.valeur === valeur)?.nom ?? 'Aucun'
}

/**
 * Le rappel doit-il s'afficher ?
 *
 * Trois conditions : un jour est choisi, on y est, et le relevé
 * de la semaine n'existe pas encore. Une quatrième s'ajoute : ne
 * pas l'avoir écarté cette semaine.
 */
export function rappelAAfficher({
  rappel,
  releveFait,
  semaine,
  date = new Date(),
}: {
  rappel: Rappel
  releveFait: boolean
  semaine: string
  date?: Date
}): boolean {
  if (rappel.jour === null) return false
  if (releveFait) return false
  if (rappel.semaineEcartee === semaine) return false
  return date.getDay() === rappel.jour
}
