import { chargerLingots } from '@/lib/donnees-lingots'
import { EcranLingots } from '@/components/lingots/EcranLingots'

/**
 * Mes Lingots : solde, bonus du jour, tarifs à venir, historique.
 * Tout vient de la base ; rien n'est calculé ici.
 */
export default async function PageLingots() {
  const etat = await chargerLingots()
  return <EcranLingots etat={etat} />
}
