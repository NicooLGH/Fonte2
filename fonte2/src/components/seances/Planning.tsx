'use client'

import { useState, useTransition } from 'react'
import { Bouton, Erreur } from '@/components/ui'
import { Modale } from '@/components/ui/Modale'
import { Puce } from '@/components/ui/Controles'
import { ACTIVITES, activite, type CleActivite } from '@/lib/cardio'
import { JOURS, jourDe, type Jour, type JourPlanning } from '@/lib/planning'
import { aujourdhui } from '@/lib/semaine'
import type { Modele } from '@/lib/live'
import { planifierJour } from '@/app/(carnet)/seances/actions'

/* ============================================================
   Ma semaine
   ============================================================
   Ce qu'on prévoit chaque jour : un modèle, du cardio, du repos
   ou rien. Le planning se répète chaque semaine ; l'accueil le
   propose le jour venu.
   ============================================================ */

type Choix =
  | { type: 'modele'; modeleId: string }
  | { type: 'cardio'; activite: CleActivite }
  | { type: 'repos' }
  | null

export function Planning({
  planning,
  modeles,
  faits,
  faitsLibelles = {},
}: {
  planning: JourPlanning[]
  modeles: Modele[]
  /** Jours de la semaine en cours où une activité est déjà enregistrée. */
  faits: Jour[]
  /** Ce qui a été fait ces jours-là. */
  faitsLibelles?: Record<number, string>
}) {
  const [edite, setEdite] = useState<Jour | null>(null)
  const [choix, setChoix] = useState<Choix>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  const auj = jourDe(aujourdhui())

  const prevu = (j: Jour) => planning.find((p) => p.jour === j) ?? null

  function ouvrir(j: Jour) {
    const p = prevu(j)
    setErreur(null)
    setChoix(
      !p
        ? null
        : p.type === 'modele' && p.modeleId
          ? { type: 'modele', modeleId: p.modeleId }
          : p.type === 'cardio'
            ? { type: 'cardio', activite: p.activite ?? 'course' }
            : p.type === 'repos'
              ? { type: 'repos' }
              : null
    )
    setEdite(j)
  }

  function valider() {
    if (edite === null) return
    demarrer(async () => {
      const r = await planifierJour(edite, choix)
      if (r.erreur) setErreur(r.erreur)
      else setEdite(null)
    })
  }

  function libelle(p: JourPlanning | null) {
    if (!p) return null
    if (p.type === 'repos') return 'Repos'
    if (p.type === 'cardio') return `Cardio · ${activite(p.activite).nom.toLowerCase()}`
    return modeles.find((m) => m.id === p.modeleId)?.nom ?? null
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="px-1 text-[15px] leading-relaxed text-encre-douce">
        Ce que tu prévois chaque jour. L&apos;accueil te le propose le jour venu.
      </p>

      <ul className="flex flex-col gap-2">
        {JOURS.map(({ jour, court }) => {
          const p = prevu(jour)
          const texte = libelle(p)
          const actif = p && p.type !== 'repos' && texte
          const estAuj = jour === auj
          const fait = faits.includes(jour)
          const quoi = faitsLibelles[jour]

          return (
            <li key={jour}>
              <button
                type="button"
                onClick={() => ouvrir(jour)}
                aria-label={`${JOURS[jour - 1].long} : ${texte ?? 'rien de prévu'}${quoi ? `, fait : ${quoi}` : ''}. Modifier.`}
                className={`appui flex w-full items-center gap-3.5 rounded-bloc pl-4 pr-3.5 text-left transition-colors ${
                  actif || estAuj || fait ? 'min-h-[60px] bg-verre py-2' : 'h-[52px] hover:bg-verre'
                } ${estAuj ? 'ring-2 ring-accent ring-inset' : ''}`}
              >
                <span className="flex w-10 flex-col">
                  <span
                    className={`font-mono text-[13px] ${estAuj ? 'text-accent-clair' : 'text-encre-douce'}`}
                  >
                    {court}
                  </span>
                  {estAuj && <span className="font-mono text-[10px] text-accent-clair">auj.</span>}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  {texte || !fait ? (
                    <span
                      className={`truncate ${
                        actif
                          ? `text-[17px] font-semibold ${p?.type === 'cardio' ? 'text-accent-2' : ''}`
                          : 'text-[16px] text-encre-douce'
                      }`}
                    >
                      {texte ?? 'Rien de prévu'}
                    </span>
                  ) : null}
                  {fait && quoi && (
                    <span
                      className={`truncate ${
                        texte ? 'text-[13px] text-valide' : 'text-[17px] font-semibold text-valide'
                      }`}
                    >
                      {texte ? `Fait · ${quoi}` : quoi}
                    </span>
                  )}
                </span>
                {fait && (
                  <span
                    aria-label="Fait"
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#22c55e]/15 text-[#22c55e]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <Modale
        titre={edite ? JOURS[edite - 1].long : ''}
        sousTitre="Chaque semaine"
        ouverte={edite !== null}
        onFermer={() => setEdite(null)}
      >
        <div className="flex flex-col gap-5">
          {modeles.length > 0 ? (
            <div>
              <p className="mb-2 px-1 text-[15px] font-semibold text-encre-douce">Un modèle</p>
              <div className="flex flex-wrap gap-2">
                {modeles.map((m) => (
                  <Puce
                    key={m.id}
                    choisie={choix?.type === 'modele' && choix.modeleId === m.id}
                    onClick={() => setChoix({ type: 'modele', modeleId: m.id })}
                  >
                    {m.nom}
                  </Puce>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed text-encre-douce">
              Crée un modèle dans l&apos;onglet Modèles pour le prévoir ici.
            </p>
          )}

          <div>
            <p className="mb-2 px-1 text-[15px] font-semibold text-encre-douce">Du cardio</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITES.map((a) => (
                <Puce
                  key={a.cle}
                  choisie={choix?.type === 'cardio' && choix.activite === a.cle}
                  onClick={() => setChoix({ type: 'cardio', activite: a.cle })}
                >
                  {a.nom}
                </Puce>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Puce choisie={choix?.type === 'repos'} onClick={() => setChoix({ type: 'repos' })}>
              Repos
            </Puce>
            <Puce choisie={choix === null} onClick={() => setChoix(null)}>
              Rien de prévu
            </Puce>
          </div>

          <Erreur>{erreur}</Erreur>

          <Bouton type="button" disabled={enCours} onClick={valider}>
            {enCours ? 'Enregistrement…' : 'Valider'}
          </Bouton>
        </div>
      </Modale>
    </div>
  )
}
