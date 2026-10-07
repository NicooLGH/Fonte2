import { chargerMonXP, chargerJournal } from '@/lib/donnees-xp'
import { chargerClassement } from '@/lib/donnees-social'
import { PageXP } from '@/components/xp/PageXP'

/**
 * XP et niveaux.
 *
 * 3.0 : le niveau, la piste (avec les amis à leur niveau), l'XP
 * de la semaine en barres et le journal. Le barème est à un
 * appui, en haut à droite.
 */
export default async function PageXPServeur({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string }>
}) {
  const [{ onglet }, total, journal, classement] = await Promise.all([
    searchParams,
    chargerMonXP(),
    chargerJournal(null),
    chargerClassement('niveau'),
  ])

  return (
    <PageXP
      total={total}
      journal={journal}
      ongletInitial={onglet === 'bareme' ? 'bareme' : 'journal'}
      amis={classement.lignes
        .filter((l) => !l.moi)
        .map((l) => ({ id: l.id, pseudo: l.pseudo, avatar: l.avatar, niveau: l.niveau }))}
    />
  )
}
