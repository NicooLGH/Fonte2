import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { BarreHaute, BarreBasse } from '@/components/Navigation'
import type { Profil } from '@/types/database'

/**
 * Mise en page commune aux pages du carnet.
 *
 * Le profil est chargé ici une seule fois pour toute la
 * navigation, plutôt que dans chaque page. Le proxy a déjà
 * vérifié la session ; on s'occupe seulement du carnet neuf,
 * qu'on renvoie au choix du pseudo.
 */
export default async function CarnetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await creerClientServeur()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('profiles')
    .select('pseudo, avatar, onboarded')
    .eq('id', user.id)
    .maybeSingle()

  const profil = data as Pick<
    Profil,
    'pseudo' | 'avatar' | 'onboarded'
  > | null

  if (!profil || !profil.onboarded || !profil.pseudo) redirect('/bienvenue')

  return (
    <>
      <BarreHaute avatar={profil.avatar ?? '💪'} pseudo={profil.pseudo} />
      {/* La marge basse laisse la place à la barre de navigation */}
      <div className="mx-auto max-w-5xl px-4 pb-28 md:px-6 md:pb-12">
        {children}
      </div>
      <BarreBasse avatar={profil.avatar ?? '💪'} />
    </>
  )
}
