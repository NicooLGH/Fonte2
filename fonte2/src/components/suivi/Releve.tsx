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
    })
  }

  return (
    <section className="flex flex-col rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-1 text-2xl">Relevé de la semaine</h2>
      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Poids, calories et mensurations. Un seul relevé par semaine, tous les
        champs facultatifs.
      </p>

      <div className="flex-1">
        {releve ? (
          <>
            <dl className="divide-y divide-filet">
              {CHAMPS_SUIVI.map((c) => (
                <div
                  key={c.cle}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <dt className="text-sm text-encre-douce">{c.libelle}</dt>
                  <dd
                    className={
                      releve[c.cle] === null
                        ? 'text-sm text-encre-douce/50'
                        : 'font-display text-xl'
                    }
                  >
                    {releve[c.cle] === null ? (
                      '—'
                    ) : (
                      <>
                        {releve[c.cle]}
                        <span className="ml-1 font-corps text-[10px] text-encre-douce">
                          {c.unite}
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {releve.note && (
              <p className="mt-3 text-xs italic leading-relaxed text-encre-douce">
                📝 {releve.note}
              </p>
            )}
            {releve.bonusDimanche && (
              <p className="mt-3 font-mono text-[10.5px] text-accent-2">
                📅 Bilan fait le dimanche — bonus obtenu
              </p>
            )}
          </>
        ) : (
          <p className="text-sm italic text-encre-douce">
            Aucun relevé pour cette semaine.
          </p>
        )}
      </div>

      <Erreur>{erreur}</Erreur>

      <Bouton type="button" className="mt-4" onClick={() => setOuvert(true)}>
        {releve ? 'Modifier mon relevé' : 'Ajouter mon relevé'}
      </Bouton>

      {releve && (
        <button
          type="button"
          onClick={supprimer}
          className="mt-2 w-full rounded-full border border-bordure bg-verre py-2.5
                     text-xs font-semibold text-encre-douce transition-colors
                     hover:border-accent/50 hover:text-accent"
        >
          Supprimer ce relevé
        </button>
      )}

      <Modale
        titre={releve ? 'Modifier le relevé' : 'Relevé de la semaine'}
        sousTitre={`Semaine ${semaine}`}
        ouverte={ouvert}
        onFermer={() => setOuvert(false)}
      >
        <form action={envoyer} className="flex flex-col gap-4">
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

          <label className="block">
            <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
              Note de la semaine
            </span>
            <textarea
              name="note"
              rows={2}
              maxLength={280}
              defaultValue={releve?.note ?? ''}
              placeholder="ex : semaine chargée, sommeil moyen"
              className="w-full resize-y rounded-2xl border border-bordure bg-verre
                         px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
            <span className="mt-2 block font-mono text-[10.5px] leading-relaxed text-encre-douce">
              Elle reste privée : personne d&apos;autre ne la voit.
            </span>
          </label>

          <Erreur>{erreur}</Erreur>

          <Bouton type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
        </form>
      </Modale>
    </section>
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
    <section className="flex flex-col rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-1 text-2xl">Objectifs</h2>
      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Ce que tu vises. Une ligne repère apparaît alors sur tes graphiques.
      </p>

      <div className="flex-1">
        {definis.length === 0 ? (
          <p className="text-sm italic text-encre-douce">
            Aucun objectif défini. C&apos;est facultatif.
          </p>
        ) : (
          <dl className="divide-y divide-filet">
            {definis.map((c) => (
              <div
                key={c.cle}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <dt className="text-sm text-encre-douce">{c.libelle}</dt>
                <dd className="font-display text-xl">
                  {objectifs[c.cle]}
                  <span className="ml-1 font-corps text-[10px] text-encre-douce">
                    {c.unite}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <Erreur>{erreur}</Erreur>

      <Bouton type="button" className="mt-4" onClick={() => setOuvert(true)}>
        {definis.length ? 'Modifier mes objectifs' : 'Définir mes objectifs'}
      </Bouton>

      <Modale
        titre="Mes objectifs"
        ouverte={ouvert}
        onFermer={() => setOuvert(false)}
      >
        <form action={envoyer} className="flex flex-col gap-4">
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

          <p className="font-mono text-[10.5px] leading-relaxed text-encre-douce">
            Laisse un champ vide pour retirer son objectif.
          </p>

          <Erreur>{erreur}</Erreur>

          <Bouton type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
        </form>
      </Modale>
    </section>
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
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm text-encre-douce">
        {libelle}
        <span className="ml-1 font-mono text-[10px] opacity-70">({unite})</span>
      </span>
      <input
        name={cle}
        type="number"
        step={pas}
        inputMode="decimal"
        defaultValue={valeur ?? ''}
        placeholder="—"
        className="w-28 shrink-0 rounded-xl border border-bordure bg-fond px-3 py-2.5
                   text-center font-display text-xl focus:border-accent focus:outline-none"
      />
    </label>
  )
}
