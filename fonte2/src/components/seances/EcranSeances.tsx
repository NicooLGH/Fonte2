'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Modale } from '@/components/ui/Modale'
import { Erreur, Succes } from '@/components/ui'
import { Onglets } from '@/components/ui/Controles'
import type { Exercice, SeanceComplete } from '@/lib/carnet'
import type { Cardio } from '@/lib/cardio'
import type { Modele } from '@/lib/live'
import type { Jour, JourPlanning } from '@/lib/planning'
import { Historique } from './Seances'
import { Planning } from './Planning'
import { Modeles } from './Modeles'
import { Exercices } from './Exercices'
import { AjoutSeance } from './Saisie'
import { enregistrerSeance, enregistrerCardio } from '@/app/(carnet)/seances/actions'

/* ============================================================
   Page Séances
   ============================================================
   Quatre onglets : l'historique, la semaine prévue, les modèles
   et les exercices. Le bouton « Ajouter » ouvre la saisie après
   coup, muscu ou cardio.
   ============================================================ */

export type CleOnglet = 'historique' | 'semaine' | 'modeles' | 'exercices'

export function EcranSeances({
  exercices,
  seances,
  cardio,
  modeles,
  planning,
  faits,
  faitsLibelles = {},
  pseudo,
  ongletInitial,
  ajoutInitial,
}: {
  exercices: Exercice[]
  seances: SeanceComplete[]
  cardio: Cardio[]
  modeles: Modele[]
  planning: JourPlanning[]
  faits: Jour[]
  /** Ce qui a été fait chaque jour de la semaine (« Push + Course »). */
  faitsLibelles?: Record<number, string>
  pseudo: string
  ongletInitial: CleOnglet
  ajoutInitial: 'muscu' | 'cardio' | null
}) {
  const [onglet, setOnglet] = useState<CleOnglet>(ongletInitial)
  const [ajout, setAjout] = useState<'muscu' | 'cardio' | null>(ajoutInitial)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  function changerOnglet(cle: string) {
    setOnglet(cle as CleOnglet)
    // L'onglet reste dans l'adresse, pour revenir au même endroit.
    const url = new URL(window.location.href)
    url.searchParams.delete('ajout')
    if (cle === 'historique') url.searchParams.delete('onglet')
    else url.searchParams.set('onglet', cle)
    window.history.replaceState(null, '', url)
  }

  function fermerAjout() {
    setAjout(null)
    const url = new URL(window.location.href)
    if (url.searchParams.has('ajout')) {
      url.searchParams.delete('ajout')
      window.history.replaceState(null, '', url)
    }
  }

  function apres(r: { erreur?: string; succes?: string }) {
    if (r.erreur) setErreur(r.erreur)
    else {
      setSucces(r.succes ?? null)
      fermerAjout()
      setOnglet('historique')
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <header className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 px-0.5 pt-2">
        <h1 className="titre-page">Séances</h1>
        <div className="flex shrink-0 items-center gap-2">
          {modeles.length > 0 && (
            <Link
              href="/live"
              className="appui flex h-11 items-center rounded-pilule bg-verre px-4 text-[15px] font-semibold
                         transition-colors hover:bg-verre-fort"
            >
              Direct
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setErreur(null)
              setSucces(null)
              setAjout('muscu')
            }}
            className="appui flex h-11 items-center gap-1.5 rounded-pilule bg-accent px-4 text-[15px]
                       font-bold text-white transition-colors hover:bg-accent-clair"
          >
            <span aria-hidden className="text-[20px] leading-none">+</span> Ajouter
          </button>
        </div>
      </header>

      <Onglets
        etiquette="Rubriques des séances"
        actif={onglet}
        onChange={changerOnglet}
        onglets={[
          { cle: 'historique', libelle: 'Historique' },
          { cle: 'semaine', libelle: 'Semaine' },
          { cle: 'modeles', libelle: 'Modèles' },
          { cle: 'exercices', libelle: 'Exercices' },
        ]}
      />

      <Succes>{succes}</Succes>

      {onglet === 'historique' && (
        <Historique seances={seances} cardio={cardio} exercices={exercices} pseudo={pseudo} />
      )}
      {onglet === 'semaine' && <Planning planning={planning} modeles={modeles} faits={faits} faitsLibelles={faitsLibelles} />}
      {onglet === 'modeles' && <Modeles modeles={modeles} exercices={exercices} />}
      {onglet === 'exercices' && <Exercices exercices={exercices} />}

      <Modale titre="Ajouter une séance" ouverte={ajout !== null} onFermer={fermerAjout}>
        {ajout && (
          <div className="flex flex-col gap-4">
            <AjoutSeance
              exercices={exercices}
              seances={seances}
              typeInitial={ajout}
              enCours={enCours}
              onMuscu={(date, blocs, note) => {
                setErreur(null)
                demarrer(async () => apres(await enregistrerSeance(date, blocs, note)))
              }}
              onCardio={(c) => {
                setErreur(null)
                demarrer(async () => apres(await enregistrerCardio(c)))
              }}
            />
            <Erreur>{erreur}</Erreur>
          </div>
        )}
      </Modale>
    </div>
  )
}
