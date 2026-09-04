import {
  chargerSuiviComplet,
  chargerSeances,
  chargerExercices,
  chargerRappel,
} from '@/lib/donnees'
import { rappelAAfficher } from '@/lib/rappel'
import { semaineCourante } from '@/lib/semaine'
import { Rappel } from '@/components/suivi/Rappel'
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
  const [fil, signaux, amis, annonces, rappel, releves] = await Promise.all([
    chargerFil(),
    chargerSignaux(),
    chargerAmis(),
    chargerAnnonces(),
    chargerRappel(),
    chargerSuiviComplet(),
  ])

  const semaine = semaineCourante()
  const montrerRappel = rappelAAfficher({
    rappel,
    releveFait: releves.some((r) => r.semaine === semaine),
    semaine,
  })

  // Le bilan n'est calculé que pendant sa fenêtre d'affichage :
  // inutile de charger tout l'historique le reste du mois.
  const bilan = bilanDisponible()
    ? calculerBilan(
        moisPrecedent(),
        await chargerSeances(),
        releves,
        await chargerExercices()
      )
    : null

  return (
    <div className="flex flex-col gap-6 py-4">
      <Presence />

      {annonces.length > 0 && <Annonces annonces={annonces} />}

      {montrerRappel && <Rappel />}

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
