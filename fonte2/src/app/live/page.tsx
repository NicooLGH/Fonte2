import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerExercices, chargerSeances, chargerModeles } from '@/lib/donnees'
import { EcranLive } from '@/components/live/EcranLive'

/**
 * Séance en direct.
 *
 * Cette page vit hors du groupe `(carnet)` : elle occupe tout
 * l'écran, sans navigation. En salle, entre deux séries, on ne
 * veut rien d'autre à l'écran.
 */
export default async function PageLive() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [modeles, exercices, seances] = await Promise.all([
    chargerModeles(),
    chargerExercices(),
    chargerSeances(),
  ])

  return (
    <EcranLive
      userId={user.id}
      modeles={modeles}
      exercices={exercices}
      seances={seances}
    />
  )
}
