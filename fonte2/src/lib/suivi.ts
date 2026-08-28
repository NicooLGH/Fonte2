/* ============================================================
   Le relevé hebdomadaire
   ============================================================
   Mensurations et suivi ont fusionné : le tour de taille était
   auparavant saisi dans deux pages différentes, sans qu'aucune
   ne prévienne en cas de valeurs contradictoires.

   Un seul relevé par semaine, tous les champs facultatifs.
   ============================================================ */

export type ChampSuivi = {
  cle: CleSuivi
  libelle: string
  unite: string
  pas: string
}

export type CleSuivi =
  | 'poids'
  | 'calories'
  | 'pec'
  | 'bras'
  | 'epaule'
  | 'jambe'
  | 'taille'

export const CHAMPS_SUIVI: ChampSuivi[] = [
  { cle: 'poids', libelle: 'Poids', unite: 'kg', pas: '0.1' },
  { cle: 'calories', libelle: 'Calories moy./jour', unite: 'kcal', pas: '1' },
  { cle: 'pec', libelle: 'Pectoraux', unite: 'cm', pas: '0.5' },
  { cle: 'bras', libelle: 'Bras', unite: 'cm', pas: '0.5' },
  { cle: 'epaule', libelle: 'Épaules', unite: 'cm', pas: '0.5' },
  { cle: 'jambe', libelle: 'Jambes', unite: 'cm', pas: '0.5' },
  { cle: 'taille', libelle: 'Tour de taille', unite: 'cm', pas: '0.5' },
]

/** Les objectifs portent sur les mêmes champs, hors calories :
 *  une moyenne quotidienne n'est pas une cible à atteindre. */
export const CHAMPS_OBJECTIF = CHAMPS_SUIVI.filter(
  (c) => c.cle !== 'calories'
)

export type ReleveComplet = {
  id: string
  date: string
  semaine: string
  bonusDimanche: boolean
  note: string | null
  aPhoto: boolean
} & { [K in CleSuivi]: number | null }

export type Objectifs = Partial<Record<CleSuivi, number>>

export function libelleChamp(cle: CleSuivi): string {
  return CHAMPS_SUIVI.find((c) => c.cle === cle)?.libelle ?? cle
}

export function uniteChamp(cle: CleSuivi): string {
  return CHAMPS_SUIVI.find((c) => c.cle === cle)?.unite ?? ''
}
