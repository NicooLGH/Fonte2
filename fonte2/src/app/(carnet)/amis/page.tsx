import { chargerAmis, chargerFil, chargerClassement } from '@/lib/donnees-social'
import { GestionAmis, Demandes, AjouterAmi } from '@/components/social/Amis'
import { Fil } from '@/components/social/Fil'
import { Classement } from '@/components/social/Classement'
import { Onglets } from '@/components/ui/Controles'
import type { PeriodeClassement } from '@/lib/social'

type Onglet = 'fil' | 'classement' | 'amis'
const PERIODES: PeriodeClassement[] = ['semaine', 'mois', 'niveau']

/**
 * Amis.
 *
 * 3.0 : trois onglets. Le fil des séances, le classement et la
 * liste. Les demandes reçues restent en haut du fil.
 */
export default async function PageAmis({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; periode?: string }>
}) {
  const params = await searchParams
  const onglet: Onglet =
    params.onglet === 'classement' || params.onglet === 'amis' ? params.onglet : 'fil'
  const periode: PeriodeClassement = PERIODES.includes(params.periode as PeriodeClassement)
    ? (params.periode as PeriodeClassement)
    : 'semaine'

  const [liste, fil, classement] = await Promise.all([
    chargerAmis(),
    onglet === 'fil' ? chargerFil() : Promise.resolve([]),
    onglet === 'classement' ? chargerClassement(periode) : Promise.resolve(null),
  ])
  const demandes = liste.attente.length

  return (
    <div className="flex flex-col gap-5 py-4">
      <header className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 px-0.5 pt-2">
          <h1 className="titre-page">Amis</h1>
          <AjouterAmi />
        </div>
        <Onglets
          etiquette="Rubriques des amis"
          actif={onglet}
          onglets={[
            { cle: 'fil', libelle: demandes > 0 ? `Fil · ${demandes}` : 'Fil', href: '/amis' },
            { cle: 'classement', libelle: 'Classement', href: '/amis?onglet=classement' },
            { cle: 'amis', libelle: 'Mes amis', href: '/amis?onglet=amis' },
          ]}
        />
      </header>

      {onglet === 'fil' && (
        <>
          <Demandes attente={liste.attente} />
          <Fil publications={fil} nbAmis={liste.amis.length} />
        </>
      )}
      {onglet === 'classement' && classement && <Classement donnees={classement} />}
      {onglet === 'amis' && (
        <>
          <Demandes attente={liste.attente} />
          <GestionAmis liste={liste} />
        </>
      )}
    </div>
  )
}
