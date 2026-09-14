'use server'

import { chargerHistorique } from '@/lib/donnees-social'
import type { PublicationSeance } from '@/lib/social'

/**
 * Charge une page supplémentaire de séances.
 *
 * Passe par le serveur plutôt que par le navigateur : les règles
 * de visibilité vivent dans la fonction SQL, et c'est elle qui
 * décide ce qui sort.
 */
export async function pageSuivante(
  cible: string,
  decalage: number
): Promise<PublicationSeance[]> {
  return await chargerHistorique(cible, decalage)
}
