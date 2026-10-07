'use client'

import { usePathname } from 'next/navigation'
import { Onglets } from '@/components/ui/Controles'

/** En-tête commun de la rubrique « Progrès » : Suivi et Analyse. */
export function OngletsProgres() {
  const chemin = usePathname()
  return (
    <Onglets
      etiquette="Progrès"
      actif={chemin.startsWith('/analyse') ? 'analyse' : 'suivi'}
      onglets={[
        { cle: 'suivi', libelle: 'Suivi', href: '/suivi' },
        { cle: 'analyse', libelle: 'Analyse', href: '/analyse' },
      ]}
    />
  )
}
