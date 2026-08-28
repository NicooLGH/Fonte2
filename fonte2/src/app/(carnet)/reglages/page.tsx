import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { Reglages } from '@/components/reglages/Reglages'
import type { Profil } from '@/types/database'

export default async function PageReglages() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('profiles')
    .select('pseudo, avatar, partage_seances, partage_presence')
    .eq('id', user.id)
    .maybeSingle()

  const profil = data as Pick<
    Profil,
    'pseudo' | 'avatar' | 'partage_seances' | 'partage_presence'
  > | null

  return (
    <Reglages
      pseudo={profil?.pseudo ?? ''}
      avatar={profil?.avatar ?? '💪'}
      email={user.email ?? '—'}
      partageSeances={profil?.partage_seances ?? false}
      partagePresence={profil?.partage_presence ?? true}
    />
  )
}
