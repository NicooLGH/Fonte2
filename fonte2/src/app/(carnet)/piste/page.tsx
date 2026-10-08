import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerMonXP, chargerJournal } from '@/lib/donnees-xp'
import { chargerClassement } from '@/lib/donnees-social'
import { semaineCourante } from '@/lib/semaine'
import { EcranPiste } from '@/components/xp/EcranPiste'

/**
 * La piste complète des niveaux.
 *
 * Tous les niveaux, les récompenses, les amis à leur niveau. Un
 * niveau touché montre sa récompense sur ton profil, à équiper
 * s'il est atteint.
 */
export default async function PagePiste() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [total, journal, classement, { data: profil }] = await Promise.all([
    chargerMonXP(),
    chargerJournal(null),
    chargerClassement('niveau'),
    supabase
      .from('profiles')
      .select('pseudo, avatar, banniere, motif, cadre')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  // Rythme : moyenne des dernières semaines terminées (4 au plus),
  // pour estimer le temps avant un niveau.
  const enCours = semaineCourante()
  const parSemaine = new Map<string, number>()
  for (const e of journal.entrees)
    if (e.semaine !== enCours) parSemaine.set(e.semaine, (parSemaine.get(e.semaine) ?? 0) + e.montant)
  const recentes = [...parSemaine.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4)
  const rythme = recentes.length
    ? Math.round(recentes.reduce((t, [, v]) => t + v, 0) / recentes.length)
    : null

  return (
    <EcranPiste
      total={total}
      rythme={rythme && rythme > 0 ? rythme : null}
      profil={{
        pseudo: (profil?.pseudo as string) ?? '',
        avatar: (profil?.avatar as string | null) ?? '💪',
        teinte: (profil?.banniere as string | null) ?? 'braise',
        motif: (profil?.motif as string | null) ?? 'aucun',
        cadre: (profil?.cadre as string | null) ?? 'aucun',
      }}
      amis={classement.lignes
        .filter((l) => !l.moi)
        .map((l) => ({ id: l.id, pseudo: l.pseudo, avatar: l.avatar, niveau: l.niveau }))}
    />
  )
}
