'use client'

import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { Bouton, Erreur } from '@/components/ui'
import {
  CHAMPS_SUIVI,
  CHAMPS_OBJECTIF,
  type ReleveComplet,
  type Objectifs,
  type CleSuivi,
} from '@/lib/suivi'
import {
  enregistrerReleve,
  enregistrerObjectifs,
  supprimerReleve,
} from '@/app/(carnet)/suivi/actions'

/* ============================================================
   Relevé de la semaine
   ============================================================
   3.0 : l'affichage des mesures vit dans CarteSuivi. Ici, le
   bouton et la fenêtre de saisie.
   ============================================================ */

export function Releve({
  releve,
  semaine,
}: {
  releve: ReleveComplet | null
  semaine: string
}) {
  const [ouvert, setOuvert] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  function envoyer(donnees: FormData) {
    setErreur(null)
    demarrer(async () => {
      const r = await enregistrerReleve(donnees)
      if (r.erreur) setErreur(r.erreur)
      else setOuvert(false)
    })
  }

  function supprimer() {
    if (!releve) return
    if (
      !confirm(
        `Supprimer le relevé de la semaine ${semaine} ?\n\n` +
          "L'XP qu'il a rapporté sera annulé."
      )
    )
      return
    demarrer(async () => {
      const r = await supprimerReleve(releve.id)
      if (r.erreur) setErreur(r.erreur)
      else setOuvert(false)
    })
  }

  return (
    <>
      <Bouton
        type="button"
        variante={releve ? 'discret' : 'principal'}
        onClick={() => {
          setErreur(null)
          setOuvert(true)
        }}
      >
        {releve ? 'Modifier mon relevé' : 'Ajouter mon relevé'}
      </Bouton>

      <Modale
        titre={releve ? 'Modifier le relevé' : 'Relevé de la semaine'}
        sousTitre={`Semaine ${semaine} · tout est facultatif`}
        ouverte={ouvert}
        onFermer={() => setOuvert(false)}
      >
        <form action={envoyer} className="flex flex-col gap-2.5">
          {CHAMPS_SUIVI.map((c) => (
            <LigneChamp
              key={c.cle}
              cle={c.cle}
              libelle={c.libelle}
              unite={c.unite}
              pas={c.pas}
              valeur={releve?.[c.cle] ?? null}
            />
          ))}

          <label className="mt-1.5 block">
            <span className="sr-only">Note de la semaine</span>
            <textarea
              name="note"
              rows={2}
              maxLength={280}
              defaultValue={releve?.note ?? ''}
              placeholder="Une note ? ex : semaine chargée, sommeil moyen"
              className="w-full resize-none rounded-carte border border-transparent bg-verre px-4 py-3.5
                         text-base placeholder:text-encre-douce/60 focus:border-accent focus:outline-none"
            />
            <span className="mt-1.5 block px-1 text-[13px] text-encre-douce">
              Privée : personne d&apos;autre ne la voit.
            </span>
          </label>

          <Erreur>{erreur}</Erreur>

          <Bouton type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>

          {releve && (
            <button
              type="button"
              onClick={supprimer}
              disabled={enCours}
              className="h-11 text-[15px] font-semibold text-encre-douce hover:text-accent"
            >
              Supprimer ce relevé
            </button>
          )}
        </form>
      </Modale>
    </>
  )
}

/* ============================================================
   Objectifs
   ============================================================ */

export function BlocObjectifs({ objectifs }: { objectifs: Objectifs }) {
  const [ouvert, setOuvert] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  const definis = CHAMPS_OBJECTIF.filter(
    (c) => objectifs[c.cle] !== undefined
  )

  function envoyer(donnees: FormData) {
    setErreur(null)
    demarrer(async () => {
      const r = await enregistrerObjectifs(donnees)
      if (r.erreur) setErreur(r.erreur)
      else setOuvert(false)
    })
  }

  return (
    <>
      <div className="flex min-h-14 items-center gap-3.5 px-0.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent/15 text-accent-clair">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="0.5" />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[16px] font-semibold">Objectifs</span>
          <span className="truncate text-[14px] text-encre-douce">
            {definis.length === 0
              ? 'Une ligne repère sur tes courbes'
              : definis.map((c) => `${c.cle === 'taille' ? 'Taille' : c.libelle} ${objectifs[c.cle]}`).join(' · ')}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            setErreur(null)
            setOuvert(true)
          }}
          className="appui h-10 shrink-0 rounded-pilule bg-verre px-3.5 text-[14px] font-semibold"
        >
          {definis.length ? 'Modifier' : 'Définir'}
        </button>
      </div>

      <Modale
        titre="Mes objectifs"
        sousTitre="Laisse vide pour retirer un objectif"
        ouverte={ouvert}
        onFermer={() => setOuvert(false)}
      >
        <form action={envoyer} className="flex flex-col gap-2.5">
          {CHAMPS_OBJECTIF.map((c) => (
            <LigneChamp
              key={c.cle}
              cle={c.cle}
              libelle={c.libelle}
              unite={c.unite}
              pas={c.pas}
              valeur={objectifs[c.cle] ?? null}
            />
          ))}

          <Erreur>{erreur}</Erreur>

          <Bouton type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
        </form>
      </Modale>
    </>
  )
}

/* ---- Champ commun aux deux formulaires ---- */

function LigneChamp({
  cle,
  libelle,
  unite,
  pas,
  valeur,
}: {
  cle: CleSuivi
  libelle: string
  unite: string
  pas: string
  valeur: number | null
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-bloc bg-verre py-1.5 pr-1.5 pl-4">
      <span className="min-w-0 text-[16px]">
        {libelle}
        <span className="ml-1.5 font-mono text-[12px] text-encre-douce">{unite}</span>
      </span>
      <input
        name={cle}
        type="number"
        step={pas}
        inputMode="decimal"
        defaultValue={valeur ?? ''}
        placeholder="—"
        className="h-12 w-28 shrink-0 rounded-[11px] border-2 border-transparent bg-fond px-3
                   text-center font-display text-[28px] leading-none placeholder:text-encre-douce/40
                   focus:border-accent focus:outline-none"
      />
    </label>
  )
}
