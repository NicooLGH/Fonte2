/* ============================================================
   Notifications et annonces — vocabulaire partagé
   ============================================================
   Types seuls, utilisables des deux côtés. Le chargement vit
   dans `donnees-notifs.ts`, qui reste au serveur.
   ============================================================ */

export type Notification = {
  id: string
  type: string
  titre: string
  corps: string | null
  lue: boolean
  date: string
}

export type TonAnnonce = 'info' | 'succes' | 'alerte'

export type Annonce = {
  id: string
  titre: string
  corps: string
  ton: TonAnnonce
  active: boolean
  retirable: boolean
  epinglee: boolean
  couleur: string | null
  icone: string | null
  lienTexte: string | null
  lienUrl: string | null
  expireLe: string | null
  creeLe: string
}
