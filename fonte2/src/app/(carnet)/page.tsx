import {
  chargerSuiviComplet,
  chargerSeances,
  chargerExercices,
  chargerRappel,
  chargerModeles,
  chargerCardio,
  chargerPlanning,
} from '@/lib/donnees'
import { chargerMonXP } from '@/lib/donnees-xp'
import { aujourdhui, cleSemaine, semaineCourante } from '@/lib/semaine'
import { jourDe, joursDeLaSemaine, serieDeSemaines } from '@/lib/planning'
import { SeanceDuJour, NiveauEtSemaine } from '@/components/accueil/SeanceDuJour'
import { rappelAAfficher } from '@/lib/rappel'
import { Rappel } from '@/components/suivi/Rappel'
import {
  chargerFil,
  chargerSignaux,
  chargerAmis,
  chargerAmisEnSeance,
} from '@/lib/donnees-social'
import { chargerAnnonces } from '@/lib/donnees-notifs'
import { bilanDisponible, calculerBilan, moisPrecedent } from '@/lib/bilan'
import { BanniereBilan } from '@/components/bilan/Banniere'
import { Annonces } from '@/components/social/Annonces'
import { Fil } from '@/components/social/Fil'
import { Presence } from '@/components/social/Presence'
import { EnSeance } from '@/components/social/EnSeance'
import { chargerDefisEnCours } from '@/lib/donnees-defis'
import { DefisAccueil } from '@/components/defis/CartesDefis'

/**
 * Accueil.
 *
 * 3.0 : la séance du jour (tirée du planning), le niveau et la
 * semaine en haut ; le social en dessous.
 */
export default async function Accueil() {
  const [
    fil,
    signaux,
    amis,
    annonces,
    rappel,
    releves,
    enSeance,
    defis,
    seances,
    cardio,
    modeles,
    planning,
    xp,
  ] = await Promise.all([
    chargerFil(),
    chargerSignaux(),
    chargerAmis(),
    chargerAnnonces(),
    chargerRappel(),
    chargerSuiviComplet(),
    chargerAmisEnSeance(),
    chargerDefisEnCours(),
    chargerSeances(),
    chargerCardio(),
    chargerModeles(),
    chargerPlanning(),
    chargerMonXP(),
  ])

  // Séance du jour et semaine en cours.
  const auj = aujourdhui()
  const jour = jourDe(auj)
  const datesSemaine = joursDeLaSemaine(auj)
  const datesActives = new Set([...seances.map((s) => s.date), ...cardio.map((c) => c.date)])
  const joursFaits = datesSemaine
    .map((d, i) => (datesActives.has(d) ? i : -1))
    .filter((i) => i >= 0)
  const joursPrevus = planning.filter(
    (p) => p.type === 'cardio' || (p.type === 'modele' && p.modeleId)
  ).length
  const serie = serieDeSemaines(
    new Set([...datesActives].map((d) => cleSemaine(new Date(d + 'T12:00:00')))),
    auj
  )

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
        seances,
        releves,
        await chargerExercices(),
        cardio
      )
    : null

  return (
    <div className="flex flex-col gap-6 py-4">
      <Presence />

      <SeanceDuJour
        prevu={planning.find((p) => p.jour === jour) ?? null}
        modeles={modeles}
        seancesDuJour={seances.filter((s) => s.date === auj)}
        cardioDuJour={cardio.filter((c) => c.date === auj)}
        dernieres={seances}
      />

      <NiveauEtSemaine
        xp={xp}
        joursFaits={joursFaits}
        joursPrevus={joursPrevus}
        aujourdhuiIndex={jour - 1}
        serie={serie}
      />

      {/* Toujours monté : il se rafraîchit seul et n'affiche
          rien tant qu'aucun ami ne s'entraîne. */}
      <EnSeance initiaux={enSeance} />

      {/* Les défis en cours, le plus récent à la une. */}
      <DefisAccueil defis={defis} />

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
