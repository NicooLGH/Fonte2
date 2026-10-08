'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Erreur } from '@/components/ui'
import { Modale } from '@/components/ui/Modale'
import {
  anciennete,
  presenceLisible,
  estEnLigne,
  type Demande,
  type ListeAmis,
  type Resultat,
} from '@/lib/social'
import {
  chercherUtilisateurs,
  demanderAmi,
  accepterAmi,
  retirerAmi,
} from '@/app/(carnet)/amis/actions'
import { Visage } from '@/components/Visage'

/* ============================================================
   Amis : demandes, recherche, liste
   ============================================================ */

type Agir = (a: () => Promise<{ erreur?: string }>) => void

function useAction() {
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  const agir: Agir = (action) => {
    setErreur(null)
    demarrer(async () => {
      const r = await action()
      if (r.erreur) setErreur(r.erreur)
    })
  }
  return { erreur, enCours, agir }
}

/* ---- Demandes reçues : une ligne chacune ---- */

export function Demandes({ attente }: { attente: Demande[] }) {
  const { erreur, enCours, agir } = useAction()
  if (attente.length === 0) return null

  return (
    <div className="flex flex-col">
      <Erreur>{erreur}</Erreur>
      {attente.map((p) => (
        <div key={p.id} className="flex min-h-16 items-center gap-3 px-0.5">
          <Pastille avatar={p.avatar} pseudo={p.pseudo} />
          <span className="min-w-0 flex-1 text-[16px]">
            <strong className="font-semibold">{p.pseudo}</strong>{' '}
            <span className="text-encre-douce">veut t&apos;ajouter</span>
          </span>
          <button
            type="button"
            disabled={enCours}
            onClick={() => agir(() => accepterAmi(p.id))}
            className="appui h-10 shrink-0 rounded-pilule bg-accent px-4 text-[14px] font-bold text-white
                       hover:bg-accent-clair disabled:opacity-50"
          >
            Accepter
          </button>
          <button
            type="button"
            disabled={enCours}
            onClick={() => agir(() => retirerAmi(p.id))}
            aria-label={`Refuser la demande de ${p.pseudo}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pilule bg-verre text-encre-douce
                       hover:text-encre disabled:opacity-50"
          >
            <Croix />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ---- Bouton « + » et recherche ---- */

export function AjouterAmi() {
  const [ouvert, setOuvert] = useState(false)
  const { erreur, enCours, agir } = useAction()
  const [requete, setRequete] = useState('')
  const [resultats, setResultats] = useState<Resultat[] | null>(null)
  const [cherche, demarrerRecherche] = useTransition()

  function chercher() {
    if (requete.trim().length < 2) {
      setResultats([])
      return
    }
    demarrerRecherche(async () => {
      const r = await chercherUtilisateurs(requete)
      setResultats(r.resultats)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Ajouter un ami"
        className="appui flex h-11 w-11 shrink-0 items-center justify-center rounded-bloc bg-verre"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
        </svg>
      </button>

      <Modale titre="Ajouter un ami" sousTitre="Cherche par pseudo" ouverte={ouvert} onFermer={() => setOuvert(false)}>
        <div className="flex flex-col gap-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              chercher()
            }}
          >
            <input
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              placeholder="Pseudo…"
              aria-label="Pseudo à rechercher"
              autoCapitalize="none"
              autoCorrect="off"
              className="h-12 min-w-0 flex-1 rounded-bloc border border-transparent bg-verre px-4 text-base
                         focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={cherche}
              className="appui h-12 shrink-0 rounded-bloc bg-accent px-5 text-[15px] font-bold text-white
                         hover:bg-accent-clair disabled:opacity-50"
            >
              {cherche ? '…' : 'Chercher'}
            </button>
          </form>

          <Erreur>{erreur}</Erreur>

          {resultats !== null &&
            (resultats.length === 0 ? (
              <p className="text-[15px] text-encre-douce">Aucun compte ne correspond à ce pseudo.</p>
            ) : (
              <ul className="flex flex-col">
                {resultats.map((r) => (
                  <li key={r.id} className="flex min-h-14 items-center gap-3">
                    <Pastille avatar={r.avatar} pseudo={r.pseudo} />
                    <Link
                      href={`/u/${encodeURIComponent(r.pseudo)}`}
                      className="min-w-0 flex-1 truncate text-[16px] font-semibold"
                    >
                      {r.pseudo}
                    </Link>
                    {r.relation === 'ami' && <Statut>Déjà ami</Statut>}
                    {r.relation === 'demande_envoyee' && <Statut>Demande envoyée</Statut>}
                    {r.relation === 'demande_recue' && (
                      <PetitBouton disabled={enCours} onClick={() => agir(() => accepterAmi(r.id))}>
                        Accepter
                      </PetitBouton>
                    )}
                    {r.relation === 'inconnu' && (
                      <PetitBouton
                        disabled={enCours}
                        onClick={() => {
                          agir(() => demanderAmi(r.id))
                          setResultats(
                            resultats.map((x) =>
                              x.id === r.id ? { ...x, relation: 'demande_envoyee' } : x
                            )
                          )
                        }}
                      >
                        Ajouter
                      </PetitBouton>
                    )}
                  </li>
                ))}
              </ul>
            ))}

          <p className="text-[13px] leading-relaxed text-encre-douce">
            Sans être ton ami, une personne ne voit que ton pseudo, ton niveau et ta série : jamais
            tes mensurations, ton poids ni tes photos.
          </p>
        </div>
      </Modale>
    </>
  )
}

/* ---- Mes amis ---- */

export function GestionAmis({ liste }: { liste: ListeAmis }) {
  const { erreur, enCours, agir } = useAction()

  return (
    <div className="flex flex-col gap-5">
      <Erreur>{erreur}</Erreur>

      {liste.amis.length === 0 ? (
        <p className="px-0.5 text-[15px] leading-relaxed text-encre-douce">
          Aucun ami pour l&apos;instant. Le bouton + en haut permet d&apos;en chercher un par son
          pseudo.
        </p>
      ) : (
        <section className="flex flex-col">
          <p className="px-0.5 pb-1 text-[15px] text-encre-douce">
            {liste.actifsSemaine} sur {liste.amis.length} entraîné
            {liste.actifsSemaine > 1 ? 's' : ''} cette semaine
          </p>
          <ul className="flex flex-col">
            {liste.amis.map((a) => {
              const presence = presenceLisible(a.presenceSec)
              const enLigne = estEnLigne(a.presenceSec)
              return (
                <li key={a.id} className="flex min-h-16 items-center gap-3 px-0.5">
                  <Pastille avatar={a.avatar} pseudo={a.pseudo} enLigne={enLigne} />
                  <Link
                    href={`/u/${encodeURIComponent(a.pseudo)}`}
                    className="flex min-w-0 flex-1 flex-col gap-0.5"
                  >
                    <span className="truncate text-[16px] font-semibold">{a.pseudo}</span>
                    <span className="truncate text-[13px] text-encre-douce">
                      {a.actifSemaine ? (
                        <span className="text-accent-2">Actif cette semaine</span>
                      ) : (
                        'Pas encore cette semaine'
                      )}
                      {a.streak > 0 && ` · ${a.streak} sem. d'affilée`}
                      {!enLigne && presence ? ` · ${presence}` : ''}
                    </span>
                  </Link>
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() => {
                      if (
                        confirm(
                          `Retirer ${a.pseudo} de tes amis ?\n\nAmis ${anciennete(a.amiDepuis)}.`
                        )
                      )
                        agir(() => retirerAmi(a.id))
                    }}
                    aria-label={`Retirer ${a.pseudo} de tes amis`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pilule text-encre-douce/60
                               hover:text-accent"
                  >
                    <Croix />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {liste.envoyes.length > 0 && (
        <section className="flex flex-col">
          <p className="section-titre px-0.5 pb-1">Demandes envoyées</p>
          <ul className="flex flex-col">
            {liste.envoyes.map((p) => (
              <li key={p.id} className="flex min-h-14 items-center gap-3 px-0.5">
                <Pastille avatar={p.avatar} pseudo={p.pseudo} />
                <span className="min-w-0 flex-1 truncate text-[16px]">{p.pseudo}</span>
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => agir(() => retirerAmi(p.id))}
                  className="h-10 shrink-0 rounded-pilule bg-verre px-4 text-[14px] font-semibold text-encre-douce
                             hover:text-encre"
                >
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/* ---- Pièces ---- */

export function Pastille({
  avatar,
  pseudo,
  enLigne = false,
}: {
  avatar: string | null
  pseudo: string
  enLigne?: boolean
}) {
  return (
    <Link
      href={`/u/${encodeURIComponent(pseudo)}`}
      aria-label={`Profil de ${pseudo}`}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-verre text-[22px]"
    >
      <Visage avatar={avatar} />
      {enLigne && (
        <span
          aria-label="En ligne"
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-fond bg-valide"
        />
      )}
    </Link>
  )
}

function Statut({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 text-[13px] text-encre-douce">{children}</span>
}

function PetitBouton(props: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className="appui h-10 shrink-0 rounded-pilule bg-accent px-4 text-[14px] font-bold text-white
                 hover:bg-accent-clair disabled:opacity-50"
    />
  )
}

function Croix() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
