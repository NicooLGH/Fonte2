'use client'

import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { Champ, Bouton, Erreur } from '@/components/ui'
import { GROUPES, icoGroupe, nomGroupe, type Exercice } from '@/lib/carnet'
import type { Groupe } from '@/types/database'
import {
  creerExercice,
  modifierExercice,
  supprimerExercice,
} from '@/app/(carnet)/seances/actions'

const APERCU = 3

export function Exercices({ exercices }: { exercices: Exercice[] }) {
  const [ouvert, setOuvert] = useState(false)
  const [edite, setEdite] = useState<Exercice | null>(null)
  const [tout, setTout] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  const visibles = tout ? exercices : exercices.slice(0, APERCU)
  const reste = exercices.length - visibles.length

  function envoyer(donnees: FormData) {
    setErreur(null)
    demarrer(async () => {
      const r = edite
        ? await modifierExercice(donnees)
        : await creerExercice(donnees)
      if (r.erreur) setErreur(r.erreur)
      else {
        setOuvert(false)
        setEdite(null)
      }
    })
  }

  function supprimer(exo: Exercice) {
    const passages = 'Ses passages enregistrés seront effacés avec lui.'
    if (!confirm(`Supprimer « ${exo.nom} » ?\n\n${passages}`)) return
    demarrer(async () => {
      const r = await supprimerExercice(exo.id)
      if (r.erreur) setErreur(r.erreur)
    })
  }

  return (
    <section className="flex flex-col rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-1 text-2xl">Mes exercices</h2>
      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Les mouvements que tu pratiques. Ils deviennent sélectionnables dans tes
        séances.
      </p>

      <div className="flex-1">
        {exercices.length === 0 ? (
          <p className="text-sm italic text-encre-douce">
            Aucun exercice. Crée le premier pour pouvoir enregistrer une séance.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibles.map((exo) => (
              <li
                key={exo.id}
                className="rounded-2xl border border-bordure bg-verre px-4 py-3"
              >
                <p className="font-semibold">{exo.nom}</p>
                <p className="mt-0.5 font-mono text-[10.5px] text-encre-douce">
                  {icoGroupe(exo.groupe)} {nomGroupe(exo.groupe)}
                  {exo.objectif !== null && ` · objectif ${exo.objectif} kg`}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEdite(exo)
                      setOuvert(true)
                    }}
                    className="flex-1 rounded-full border border-bordure bg-verre
                               px-3 py-1.5 text-xs font-semibold text-encre-douce
                               transition-colors hover:text-encre"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => supprimer(exo)}
                    aria-label={`Supprimer ${exo.nom}`}
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
            className="mt-3 w-full rounded-full border border-bordure bg-verre
                       py-2.5 text-xs font-semibold text-encre-douce
                       transition-colors hover:text-encre"
          >
            {reste === 1 ? "Voir l'autre" : `Voir les ${reste} autres`}
          </button>
        )}
      </div>

      <Erreur>{erreur}</Erreur>

      <Bouton
        type="button"
        className="mt-4"
        onClick={() => {
          setEdite(null)
          setOuvert(true)
        }}
      >
        Ajouter un exercice
      </Bouton>

      <Modale
        titre={edite ? 'Modifier' : 'Nouvel exercice'}
        sousTitre={edite?.nom}
        ouverte={ouvert}
        onFermer={() => {
          setOuvert(false)
          setEdite(null)
        }}
      >
        <FormulaireExercice
          exercice={edite}
          enCours={enCours}
          erreur={erreur}
          onEnvoyer={envoyer}
        />
      </Modale>
    </section>
  )
}

function FormulaireExercice({
  exercice,
  enCours,
  erreur,
  onEnvoyer,
}: {
  exercice: Exercice | null
  enCours: boolean
  erreur: string | null
  onEnvoyer: (d: FormData) => void
}) {
  const [groupe, setGroupe] = useState<Groupe | ''>(exercice?.groupe ?? '')

  return (
    <form action={onEnvoyer} className="flex flex-col gap-5">
      {exercice && <input type="hidden" name="id" value={exercice.id} />}
      <input type="hidden" name="groupe" value={groupe} />

      {!exercice && (
        <Champ
          libelle="Nom"
          name="nom"
          required
          maxLength={40}
          autoFocus
          placeholder="ex : Développé couché"
        />
      )}

      <Champ
        libelle="Objectif de charge (kg)"
        name="objectif"
        type="number"
        step="0.5"
        inputMode="decimal"
        defaultValue={exercice?.objectif ?? ''}
        placeholder="—"
        aide="Facultatif. Sert à afficher ta progression vers cette charge."
      />

      <div>
        <span className="mb-3 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
          Groupe musculaire
        </span>
        <div className="flex flex-wrap gap-2">
          {GROUPES.map((g) => (
            <button
              key={g.cle}
              type="button"
              onClick={() => setGroupe(groupe === g.cle ? '' : g.cle)}
              aria-pressed={groupe === g.cle}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold
                transition-colors ${
                  groupe === g.cle
                    ? 'border-accent-2 bg-accent-2/15 text-accent-2'
                    : 'border-bordure bg-verre text-encre-douce hover:text-encre'
                }`}
            >
              {g.ico} {g.nom}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-encre-douce">
          Le groupe principal sollicité. Facultatif, mais il alimente la vue
          d&apos;équilibre.
        </p>
      </div>

      <Erreur>{erreur}</Erreur>

      <Bouton type="submit" disabled={enCours}>
        {enCours ? 'Enregistrement…' : exercice ? 'Enregistrer' : 'Ajouter'}
      </Bouton>
    </form>
  )
}
