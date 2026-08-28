'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { Champ, Bouton, Erreur } from '@/components/ui'
import type { Exercice } from '@/lib/carnet'
import type { Modele } from '@/lib/live'
import { creerModele, supprimerModele } from '@/app/(carnet)/seances/actions'

const APERCU = 2

export function Modeles({
  modeles,
  exercices,
}: {
  modeles: Modele[]
  exercices: Exercice[]
}) {
  const [ouvert, setOuvert] = useState(false)
  const [tout, setTout] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  const visibles = tout ? modeles : modeles.slice(0, APERCU)
  const reste = modeles.length - visibles.length
  const nomExo = (id: string) => exercices.find((e) => e.id === id)?.nom ?? '—'

  return (
    <section className="flex flex-col rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-1 text-2xl">Modèles</h2>
      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Tes séances types, enregistrées une fois et relancées en un geste.
      </p>

      <div className="flex-1">
        {modeles.length === 0 ? (
          <p className="text-sm italic text-encre-douce">
            Aucun modèle. Crée ta première séance type pour pouvoir la lancer en
            direct.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibles.map((m) => (
              <li
                key={m.id}
                className="rounded-2xl border border-bordure bg-verre px-4 py-3"
              >
                <p className="font-semibold">{m.nom}</p>
                <p className="mt-0.5 truncate font-mono text-[10.5px] text-encre-douce">
                  {m.entrees.map((e) => nomExo(e.id)).join(' · ')}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/live"
                    className="flex-1 rounded-full bg-accent px-3 py-1.5 text-center
                               text-xs font-semibold text-white hover:bg-accent-clair"
                  >
                    Démarrer
                  </Link>
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() => {
                      if (!confirm(`Supprimer le modèle « ${m.nom} » ?`)) return
                      demarrer(async () => {
                        const r = await supprimerModele(m.id)
                        if (r.erreur) setErreur(r.erreur)
                      })
                    }}
                    className="rounded-full px-3 py-1.5 text-xs text-encre-douce
                               transition-colors hover:text-accent"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {reste > 0 && (
          <button
            type="button"
            onClick={() => setTout(true)}
            className="mt-3 w-full rounded-full border border-bordure bg-verre py-2.5
                       text-xs font-semibold text-encre-douce hover:text-encre"
          >
            Voir {reste === 1 ? "l'autre" : `les ${reste} autres`}
          </button>
        )}
      </div>

      <Erreur>{erreur}</Erreur>

      <Bouton
        type="button"
        className="mt-4"
        disabled={exercices.length === 0}
        onClick={() => setOuvert(true)}
      >
        {exercices.length === 0 ? "Crée d'abord un exercice" : 'Créer un modèle'}
      </Bouton>

      <Modale
        titre="Nouveau modèle"
        ouverte={ouvert}
        onFermer={() => setOuvert(false)}
      >
        <FormulaireModele
          exercices={exercices}
          enCours={enCours}
          erreur={erreur}
          onCreer={(nom, entrees) => {
            setErreur(null)
            demarrer(async () => {
              const r = await creerModele(nom, entrees)
              if (r.erreur) setErreur(r.erreur)
              else setOuvert(false)
            })
          }}
        />
      </Modale>
    </section>
  )
}

function FormulaireModele({
  exercices,
  enCours,
  erreur,
  onCreer,
}: {
  exercices: Exercice[]
  enCours: boolean
  erreur: string | null
  onCreer: (nom: string, entrees: { id: string; alternatives: string[] }[]) => void
}) {
  const [nom, setNom] = useState('')
  const [choisis, setChoisis] = useState<string[]>([])
  const [alts, setAlts] = useState<Record<string, string[]>>({})

  function basculer(id: string) {
    if (choisis.includes(id)) {
      setChoisis(choisis.filter((x) => x !== id))
      const suite = { ...alts }
      delete suite[id]
      setAlts(suite)
    } else {
      setChoisis([...choisis, id])
    }
  }

  function basculerAlt(pour: string, id: string) {
    const actuelles = alts[pour] ?? []
    setAlts({
      ...alts,
      [pour]: actuelles.includes(id)
        ? actuelles.filter((x) => x !== id)
        : [...actuelles, id],
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Champ
        libelle="Nom"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        maxLength={40}
        placeholder="ex : Push A"
        aide="Un nom court que tu reconnaîtras en salle."
      />

      <div>
        <span className="mb-3 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
          Exercices, dans l&apos;ordre
        </span>
        <div className="flex flex-wrap gap-2">
          {exercices.map((e) => {
            const i = choisis.indexOf(e.id)
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => basculer(e.id)}
                aria-pressed={i >= 0}
                className={`rounded-full border px-3.5 py-2 text-xs font-semibold
                  transition-colors ${
                    i >= 0
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-bordure bg-verre text-encre-douce hover:text-encre'
                  }`}
              >
                {i >= 0 && <span className="mr-1.5 opacity-70">{i + 1}</span>}
                {e.nom}
              </button>
            )
          })}
        </div>
      </div>

      {choisis.length > 0 && (
        <div>
          <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
            Alternatives
          </span>
          <p className="mb-3 text-xs leading-relaxed text-encre-douce">
            Pour chaque exercice, indique un ou deux remplaçants si la machine
            est prise. Facultatif.
          </p>
          <div className="flex flex-col gap-4">
            {choisis.map((id) => (
              <div key={id}>
                <p className="mb-2 text-sm font-semibold">
                  {exercices.find((e) => e.id === id)?.nom}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {exercices
                    .filter((e) => e.id !== id)
                    .map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => basculerAlt(id, e.id)}
                        aria-pressed={(alts[id] ?? []).includes(e.id)}
                        className={`rounded-full border px-3 py-1.5 text-[11px]
                          transition-colors ${
                            (alts[id] ?? []).includes(e.id)
                              ? 'border-accent-2 bg-accent-2/15 text-accent-2'
                              : 'border-bordure bg-verre text-encre-douce'
                          }`}
                      >
                        {e.nom}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Erreur>{erreur}</Erreur>

      <Bouton
        type="button"
        disabled={enCours || choisis.length === 0}
        onClick={() =>
          onCreer(
            nom,
            choisis.map((id) => ({ id, alternatives: alts[id] ?? [] }))
          )
        }
      >
        {enCours ? 'Création…' : 'Créer le modèle'}
      </Bouton>
    </div>
  )
}
