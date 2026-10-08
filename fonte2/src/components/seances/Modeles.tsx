'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { Champ, Bouton, Erreur } from '@/components/ui'
import type { Exercice } from '@/lib/carnet'
import type { Modele } from '@/lib/live'
import { creerModele, supprimerModele } from '@/app/(carnet)/seances/actions'

export function Modeles({
  modeles,
  exercices,
}: {
  modeles: Modele[]
  exercices: Exercice[]
}) {
  const [ouvert, setOuvert] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  const nomExo = (id: string) => exercices.find((e) => e.id === id)?.nom ?? '—'

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={exercices.length === 0}
        onClick={() => {
          setErreur(null)
          setOuvert(true)
        }}
        className="appui flex h-14 items-center justify-center gap-2 rounded-carte border-[1.5px] border-dashed
                   border-encre/25 text-[16px] font-semibold text-encre-douce hover:text-encre disabled:opacity-50"
      >
        <span aria-hidden className="text-[22px] leading-none">+</span>
        {exercices.length === 0 ? "Crée d'abord un exercice" : 'Nouveau modèle'}
      </button>

      {modeles.length === 0 ? (
        <p className="px-0.5 text-[15px] leading-relaxed text-encre-douce">
          Un modèle, c&apos;est ta séance type : enregistrée une fois, relancée en un geste.
        </p>
      ) : (
        modeles.map((m) => (
          <div key={m.id} className="bloc flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-[32px] leading-[0.9] [overflow-wrap:anywhere]">{m.nom}</p>
                <p className="mt-1 font-mono text-[13px] text-encre-douce">
                  {m.entrees.length} exercice{m.entrees.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={enCours}
                aria-label={`Supprimer le modèle ${m.nom}`}
                onClick={() => {
                  if (!confirm(`Supprimer le modèle « ${m.nom} » ?`)) return
                  demarrer(async () => {
                    const r = await supprimerModele(m.id)
                    if (r.erreur) setErreur(r.erreur)
                  })
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pilule text-encre-douce hover:text-accent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <ol className="flex flex-col gap-1">
              {m.entrees.map((e, i) => (
                <li key={e.id + i} className="flex items-baseline gap-2.5 text-[15px]">
                  <span className="w-4 font-mono text-[12px] text-encre-douce">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{nomExo(e.id)}</span>
                  {e.alternatives.length > 0 && (
                    <span className="shrink-0 font-mono text-[12px] text-accent-2">
                      +{e.alternatives.length} alt.
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <Link
              href={`/live?modele=${m.id}`}
              className="appui flex h-12 items-center justify-center gap-2 rounded-bloc bg-accent text-[16px] font-bold text-white hover:bg-accent-clair"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" />
              </svg>
              Démarrer
            </Link>
          </div>
        ))
      )}

      <Erreur>{erreur}</Erreur>

      <Modale titre="Nouveau modèle" ouverte={ouvert} onFermer={() => setOuvert(false)}>
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
    </div>
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
        <span className="mb-2 block px-0.5 text-[15px] font-semibold text-encre-douce">
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
                className={`h-10 rounded-pilule px-4 text-[14px] transition-colors ${
                    i >= 0
                      ? 'bg-encre font-semibold text-fond'
                      : 'bg-verre text-encre-douce hover:text-encre'
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
          <span className="mb-1 block px-0.5 text-[15px] font-semibold text-encre-douce">
            Alternatives
          </span>
          <p className="mb-3 px-0.5 text-[13px] leading-relaxed text-encre-douce">
            Pour chaque exercice, indique un ou deux remplaçants si la machine
            est prise. Facultatif.
          </p>
          <div className="flex flex-col gap-4">
            {choisis.map((id) => (
              <div key={id}>
                <p className="mb-2 text-[15px] font-semibold">
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
                        className={`h-9 rounded-pilule px-3.5 text-[13px] transition-colors ${
                            (alts[id] ?? []).includes(e.id)
                              ? 'bg-accent-2/20 font-semibold text-accent-2'
                              : 'bg-verre text-encre-douce'
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
