'use client'

import { useState } from 'react'
import { Onglets } from '@/components/ui/Controles'
import { GestionAmis, Demandes, AjouterAmi } from './Amis'
import { Fil } from './Fil'
import { Classement } from './Classement'
import type { Classement as DonneesClassement, ListeAmis, PeriodeClassement, PublicationSeance } from '@/lib/social'

type Onglet = 'fil' | 'classement' | 'amis'

/**
 * Page Amis : tout est chargé d'un coup, les onglets basculent
 * sans attendre le serveur.
 */
export function EcranAmis({
  liste,
  fil,
  classements,
  ongletInitial,
}: {
  liste: ListeAmis
  fil: PublicationSeance[]
  classements: Record<PeriodeClassement, DonneesClassement>
  ongletInitial: Onglet
}) {
  const [onglet, setOnglet] = useState<Onglet>(ongletInitial)
  const demandes = liste.attente.length

  function changer(cle: string) {
    setOnglet(cle as Onglet)
    // L'onglet reste dans l'adresse, sans recharger la page.
    const url = new URL(window.location.href)
    if (cle === 'fil') url.searchParams.delete('onglet')
    else url.searchParams.set('onglet', cle)
    window.history.replaceState(null, '', url)
  }

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
          onChange={changer}
          onglets={[
            { cle: 'fil', libelle: demandes > 0 ? `Fil · ${demandes}` : 'Fil' },
            { cle: 'classement', libelle: 'Classement' },
            { cle: 'amis', libelle: 'Mes amis' },
          ]}
        />
      </header>

      {onglet === 'fil' && (
        <>
          <Demandes attente={liste.attente} />
          <Fil publications={fil} nbAmis={liste.amis.length} />
        </>
      )}
      {onglet === 'classement' && <Classement classements={classements} />}
      {onglet === 'amis' && (
        <>
          <Demandes attente={liste.attente} />
          <GestionAmis liste={liste} />
        </>
      )}
    </div>
  )
}
