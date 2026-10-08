import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerBoutique } from '@/lib/donnees-boutique'
import { EcranBoutique } from '@/components/boutique/EcranBoutique'

/** La boutique : collection Fonderie, à la une, boîtes mystère. */
export default async function PageBoutique() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [etat, { data: p }] = await Promise.all([
    chargerBoutique(),
    supabase.from('profiles').select('pseudo, avatar, banniere, motif, cadre').eq('id', user.id).maybeSingle(),
  ])

  return (
    <EcranBoutique
      etat={etat}
      profil={{
        pseudo: (p?.pseudo as string) ?? '',
        avatar: (p?.avatar as string | null) ?? '💪',
        teinte: (p?.banniere as string | null) ?? 'braise',
        motif: (p?.motif as string | null) ?? 'aucun',
        cadre: (p?.cadre as string | null) ?? 'aucun',
      }}
    />
  )
}
