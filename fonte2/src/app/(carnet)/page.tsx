import { chargerSuiviComplet, chargerSeances, chargerExercices } from '@/lib/donnees'
import { chargerFil, chargerSignaux, chargerAmis } from '@/lib/donnees-social'
import { chargerAnnonces } from '@/lib/donnees-notifs'
import { bilanDisponible, calculerBilan, moisPrecedent } from '@/lib/bilan'
import { BanniereBilan } from '@/components/bilan/Banniere'
import { Annonces } from '@/components/social/Annonces'
import { Fil } from '@/components/social/Fil'
import { Presence } from '@/components/social/Presence'

/**
 * Accueil.
 *
 * Uniquement social : annonces, bilan du mois, fil d'actualité.
 * Le niveau et les statistiques vivent sur le profil — les
 * afficher aux deux endroits n'apprenait rien de plus.
 */
export default async function Accueil() {
  const [fil, signaux, amis, annonces] = await Promise.all([
    chargerFil(),
    chargerSignaux(),
    chargerAmis(),
    chargerAnnonces(),
  ])

  // Le bilan n'est calculé que pendant sa fenêtre d'affichage :
  // inutile de charger tout l'historique le reste du mois.
  const bilan = bilanDisponible()
    ? calculerBilan(
        moisPrecedent(),
        await chargerSeances(),
        await chargerSuiviComplet(),
        await chargerExercices()
      )
    : null

  return (
    <div className="flex flex-col gap-6 py-4">
      <Presence />

      {annonces.length > 0 && <Annonces annonces={annonces} />}

      {bilan && !bilan.vide && <BanniereBilan bilan={bilan} />}

      <Fil
        publications={fil}
        signaux={signaux}
        nbAmis={amis.amis.length}
        actifs={amis.actifsSemaine}
      />
    </div>
  )
}
