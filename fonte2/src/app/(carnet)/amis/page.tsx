import { chargerAmis, chargerFil, chargerClassement } from '@/lib/donnees-social'
import { EcranAmis } from '@/components/social/EcranAmis'

/**
 * Amis : fil, classement et liste, chargés ensemble pour que les
 * onglets basculent instantanément.
 */
export default async function PageAmis({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string }>
}) {
  const { onglet } = await searchParams

  // Le classement de la semaine remet d'abord l'XP de chacun à
  // jour ; les deux autres lisent ensuite des totaux déjà frais,
  // sans recalculer deux fois la même personne en même temps.
  const [liste, fil, semaine] = await Promise.all([
    chargerAmis(),
    chargerFil(),
    chargerClassement('semaine'),
  ])
  const [mois, niveau] = await Promise.all([chargerClassement('mois'), chargerClassement('niveau')])

  return (
    <EcranAmis
      liste={liste}
      fil={fil}
      classements={{ semaine, mois, niveau }}
      ongletInitial={onglet === 'classement' || onglet === 'amis' ? onglet : 'fil'}
    />
  )
}
