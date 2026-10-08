'use client'

import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { Champ, Bouton, Erreur } from '@/components/ui'
import { GROUPES, type Exercice } from '@/lib/carnet'
import type { Groupe } from '@/types/database'
import {
  creerExercice,
  modifierExercice,
  supprimerExercice,
} from '@/app/(carnet)/seances/actions'

export function Exercices({ exercices }: { exercices: Exercice[] }) {
  const [ouvert, setOuvert] = useState(false)
  const [edite, setEdite] = useState<Exercice | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

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

  // Rangés par groupe musculaire, les non classés à la fin.
  const groupes = [
    ...GROUPES.map((g) => ({ cle: g.cle as string, nom: g.nom, liste: exercices.filter((e) => e.groupe === g.cle) })),
    { cle: 'aucun', nom: 'Sans groupe', liste: exercices.filter((e) => !e.groupe) },
  ].filter((g) => g.liste.length > 0)

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => {
          setEdite(null)
          setErreur(null)
          setOuvert(true)
        }}
        className="appui flex h-14 items-center justify-center gap-2 rounded-carte border-[1.5px] border-dashed
                   border-encre/25 text-[16px] font-semibold text-encre-douce hover:text-encre"
      >
        <span aria-hidden className="text-[22px] leading-none">+</span>
        Ajouter un exercice
      </button>

      {exercices.length === 0 && (
        <p className="px-0.5 text-[15px] leading-relaxed text-encre-douce">
          Aucun exercice pour l&apos;instant. Ils deviennent ensuite sélectionnables dans tes séances.
        </p>
      )}

      {groupes.map((g) => (
        <section key={g.cle} className="flex flex-col">
          <p className="etiquette px-0.5 pb-1">{g.nom}</p>
          <ul className="flex flex-col">
            {g.liste.map((exo) => (
              <li key={exo.id} className="flex min-h-14 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEdite(exo)
                    setErreur(null)
                    setOuvert(true)
                  }}
                  className="flex min-w-0 flex-1 flex-col items-start rounded-bloc px-0.5 py-2 text-left hover:bg-verre"
                >
                  <span className="w-full truncate text-[16px] font-semibold">{exo.nom}</span>
                  {exo.objectif !== null && (
                    <span className="text-[13px] text-encre-douce">Objectif {exo.objectif} kg</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => supprimer(exo)}
                  aria-label={`Supprimer ${exo.nom}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pilule text-encre-douce/60 hover:text-accent"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Erreur>{erreur}</Erreur>

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
    </div>
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
        <span className="mb-2 block px-0.5 text-[15px] font-semibold text-encre-douce">
          Groupe musculaire
        </span>
        <div className="flex flex-wrap gap-2">
          {GROUPES.map((g) => (
            <button
              key={g.cle}
              type="button"
              onClick={() => setGroupe(groupe === g.cle ? '' : g.cle)}
              aria-pressed={groupe === g.cle}
              className={`h-10 rounded-pilule px-4 text-[14px] transition-colors ${
                  groupe === g.cle
                    ? 'bg-encre font-semibold text-fond'
                    : 'bg-verre text-encre-douce hover:text-encre'
                }`}
            >
              {g.nom}
            </button>
          ))}
        </div>
        <p className="mt-2 px-0.5 text-[13px] leading-relaxed text-encre-douce">
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
