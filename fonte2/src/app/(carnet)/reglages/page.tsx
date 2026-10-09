import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { Reglages } from '@/components/reglages/Reglages'
import { suisJeAdmin } from '@/lib/donnees-notifs'
import { chargerRappel } from '@/lib/donnees'
import { codeRequis } from '@/app/(carnet)/admin/verrou'
import type { Profil } from '@/types/database'
import { chargerMonXP } from '@/lib/donnees-xp'
import { calculerNiveau } from '@/lib/xp'
import { chargerPreferencesPush } from '@/lib/donnees-push'

export default async function PageReglages() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [admin, rappel, aUnCode, xp, preferencesPush] = await Promise.all([
    suisJeAdmin(),
    chargerRappel(),
    codeRequis(),
    chargerMonXP(),
    chargerPreferencesPush(),
  ])

  const { data } = await supabase
    .from('profiles')
    .select('pseudo, avatar, partage_seances, partage_presence, partage_live, bio, banniere, motif, cadre')
    .eq('id', user.id)
    .maybeSingle()

  const profil = data as
    | (Pick<Profil, 'pseudo' | 'avatar' | 'partage_seances' | 'partage_presence'> & {
        bio: string | null
        banniere: string | null
        motif: string | null
        partage_live: boolean | null
        cadre: string | null
      })
    | null

  return (
    <Reglages
      pseudo={profil?.pseudo ?? ''}
      avatar={profil?.avatar ?? '💪'}
      email={user.email ?? '—'}
      partageSeances={profil?.partage_seances ?? false}
      partagePresence={profil?.partage_presence ?? true}
      partageLive={profil?.partage_live ?? true}
      admin={admin}
      jourRappel={rappel.jour}
      bio={profil?.bio ?? ''}
      banniere={profil?.banniere ?? 'braise'}
      motif={profil?.motif ?? 'aucun'}
      cadre={profil?.cadre ?? 'aucun'}
      niveau={calculerNiveau(xp).niveau}
      aUnCode={aUnCode}
      preferencesPush={preferencesPush}
    />
  )
}
