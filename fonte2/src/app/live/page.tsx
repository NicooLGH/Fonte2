import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerExercices, chargerSeances, chargerModeles, chargerPlanning } from '@/lib/donnees'
import { aujourdhui } from '@/lib/semaine'
import { jourDe } from '@/lib/planning'
import { EcranLive } from '@/components/live/EcranLive'

/**
 * Séance en direct.
 *
 * Cette page vit hors du groupe `(carnet)` : elle occupe tout
 * l'écran, sans navigation. En salle, entre deux séries, on ne
 * veut rien d'autre à l'écran.
 */
export default async function PageLive({
  searchParams,
}: {
  searchParams: Promise<{ modele?: string; reprendre?: string }>
}) {
  const { modele, reprendre } = await searchParams
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [modeles, exercices, seances, planning] = await Promise.all([
    chargerModeles(),
    chargerExercices(),
    chargerSeances(),
    chargerPlanning(),
  ])

  // Le modèle demandé dans l'adresse, sinon celui prévu aujourd'hui.
  const duJour = planning.find((p) => p.jour === jourDe(aujourdhui()) && p.type === 'modele')
  const prevuId =
    (modele && modeles.some((m) => m.id === modele) ? modele : null) ?? duJour?.modeleId ?? null

  return (
    <EcranLive
      userId={user.id}
      modeles={modeles}
      exercices={exercices}
      seances={seances}
      prevuId={prevuId}
      reprendre={reprendre === '1'}
    />
  )
}
