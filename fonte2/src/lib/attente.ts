import type { BlocSaisi } from '@/app/(carnet)/seances/actions'

/* ============================================================
   Séance en attente d'envoi
   ============================================================
   En salle, le réseau manque souvent. Une séance terminée sans
   connexion est gardée sur le téléphone, puis envoyée dès que
   le réseau revient (composant EnvoiEnAttente). Son identifiant
   est choisi ici : la base refuse un doublon si l'envoi passe
   deux fois.
   ============================================================ */

export type SeanceEnAttente = {
  id: string
  date: string
  blocs: BlocSaisi[]
  note: string | null
  dureeSec: number
  nom: string | null
}

export function cleAttente(userId: string) {
  return `fonte-attente:${userId}`
}

export function lireAttente(userId: string): SeanceEnAttente[] {
  try {
    const brut = localStorage.getItem(cleAttente(userId))
    const liste = brut ? (JSON.parse(brut) as SeanceEnAttente[]) : []
    return Array.isArray(liste) ? liste : []
  } catch {
    return []
  }
}

export function ecrireAttente(userId: string, liste: SeanceEnAttente[]) {
  try {
    if (liste.length) localStorage.setItem(cleAttente(userId), JSON.stringify(liste))
    else localStorage.removeItem(cleAttente(userId))
  } catch {
    // Stockage plein ou refusé : rien de mieux à faire.
  }
}
