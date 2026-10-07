import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerStories } from '@/lib/donnees-stories'
import { Lecteur } from '@/components/stories/Lecteur'

/**
 * Lecteur de stories.
 *
 * Hors du groupe `(carnet)` : plein écran, sans navigation.
 * `?u=<id>` ouvre directement les stories de cette personne.
 */
export default async function PageStory({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>
}) {
  const { u } = await searchParams
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const groupes = await chargerStories()
  const depart = Math.max(0, groupes.findIndex((g) => g.userId === u))

  return <Lecteur groupes={groupes} depart={depart} />
}
