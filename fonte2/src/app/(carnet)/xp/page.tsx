import { chargerMonXP, chargerJournal } from '@/lib/donnees-xp'
import { PageXP } from '@/components/xp/PageXP'

/**
 * XP et niveaux.
 *
 * On y arrive en touchant sa barre de niveau sur son profil, ou
 * depuis le récapitulatif de fin de séance. Deux onglets : le
 * barème (comment gagner de l'XP) et le journal (ce qu'on a
 * gagné, quand, et pourquoi).
 */
export default async function PageXPServeur({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string }>
}) {
  const [{ onglet }, total, journal] = await Promise.all([
    searchParams,
    chargerMonXP(),
    chargerJournal(null),
  ])

  return (
    <PageXP
      total={total}
      journal={journal}
      ongletInitial={onglet === 'journal' ? 'journal' : 'bareme'}
    />
  )
}
