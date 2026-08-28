'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Bouton, Erreur } from '@/components/ui'
import {
  anciennete,
  presenceLisible,
  estEnLigne,
  type ListeAmis,
  type Resultat,
} from '@/lib/social'
import {
  chercherUtilisateurs,
  demanderAmi,
  accepterAmi,
  retirerAmi,
} from '@/app/(carnet)/amis/actions'

const APERCU = 5

export function GestionAmis({ liste }: { liste: ListeAmis }) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  function agir(action: () => Promise<{ erreur?: string }>) {
    setErreur(null)
    demarrer(async () => {
      const r = await action()
      if (r.erreur) setErreur(r.erreur)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Recherche onAgir={agir} enCours={enCours} />

      <Erreur>{erreur}</Erreur>

      {liste.attente.length > 0 && (
        <section className="rounded-carte border border-accent/40 bg-accent/5 p-5">
          <h2 className="mb-4 text-2xl">
            Demandes reçues
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle font-mono text-xs text-white">
              {liste.attente.length}
            </span>
          </h2>
          <ul className="divide-y divide-filet">
            {liste.attente.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Avatar valeur={p.avatar} pseudo={p.pseudo} />
                <div className="min-w-0 flex-1">
                  <Nom pseudo={p.pseudo} />
                  <p className="font-mono text-[11px] text-encre-douce">
                    Souhaite devenir ton ami
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() => agir(() => accepterAmi(p.id))}
                    className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold
                               text-white transition-colors hover:bg-accent-clair"
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() => agir(() => retirerAmi(p.id))}
                    className="rounded-full border border-bordure px-4 py-1.5 text-xs
                               font-semibold text-encre-douce transition-colors hover:text-encre"
                  >
                    Refuser
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MesAmis liste={liste} onAgir={agir} enCours={enCours} />

      {liste.envoyes.length > 0 && (
        <section className="rounded-carte border border-bordure bg-verre p-5">
          <h2 className="mb-4 text-2xl">Demandes envoyées</h2>
          <ul className="divide-y divide-filet">
            {liste.envoyes.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Avatar valeur={p.avatar} pseudo={p.pseudo} />
                <div className="min-w-0 flex-1">
                  <Nom pseudo={p.pseudo} />
                  <p className="font-mono text-[11px] text-encre-douce">
                    En attente de réponse
                  </p>
                </div>
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => agir(() => retirerAmi(p.id))}
                  className="shrink-0 rounded-full border border-bordure px-4 py-1.5
                             text-xs font-semibold text-encre-douce transition-colors
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

/* ---- Recherche ---- */

function Recherche({
  onAgir,
  enCours,
}: {
  onAgir: (a: () => Promise<{ erreur?: string }>) => void
  enCours: boolean
}) {
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
    <section className="rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-1 text-2xl">Trouver quelqu&apos;un</h2>
      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Cherche par pseudo pour envoyer une demande. Sans être ton ami, une
        personne ne voit que ton pseudo, ton niveau et ta série — jamais tes
        mensurations ni ton poids.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              chercher()
            }
          }}
          placeholder="Pseudo à rechercher…"
          aria-label="Pseudo à rechercher"
          className="min-w-0 flex-1 rounded-full border border-bordure bg-verre px-5 py-2.5
                     text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={chercher}
          disabled={cherche}
          className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold
                     text-white transition-colors hover:bg-accent-clair disabled:opacity-50"
        >
          {cherche ? '…' : 'Chercher'}
        </button>
      </div>

      {resultats !== null &&
        (resultats.length === 0 ? (
          <p className="text-sm italic text-encre-douce">
            Aucun compte ne correspond à ce pseudo.
          </p>
        ) : (
          <ul className="divide-y divide-filet">
            {resultats.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <Avatar valeur={r.avatar} pseudo={r.pseudo} />
                <Nom pseudo={r.pseudo} className="min-w-0 flex-1" />

                {r.relation === 'ami' && (
                  <span className="shrink-0 font-mono text-[11px] text-encre-douce">
                    Déjà ami
                  </span>
                )}
                {r.relation === 'demande_envoyee' && (
                  <span className="shrink-0 font-mono text-[11px] text-encre-douce">
                    Demande envoyée
                  </span>
                )}
                {r.relation === 'demande_recue' && (
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() => onAgir(() => accepterAmi(r.id))}
                    className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-xs
                               font-semibold text-white hover:bg-accent-clair"
                  >
                    Accepter
                  </button>
                )}
                {r.relation === 'inconnu' && (
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() => onAgir(() => demanderAmi(r.id))}
                    className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-xs
                               font-semibold text-white hover:bg-accent-clair"
                  >
                    Ajouter
                  </button>
                )}
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}

/* ---- Liste d'amis ---- */

function MesAmis({
  liste,
  onAgir,
  enCours,
}: {
  liste: ListeAmis
  onAgir: (a: () => Promise<{ erreur?: string }>) => void
  enCours: boolean
}) {
  const [tout, setTout] = useState(false)
  const visibles = tout ? liste.amis : liste.amis.slice(0, APERCU)
  const reste = liste.amis.length - visibles.length

  return (
    <section className="rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-1 text-2xl">Mes amis</h2>
      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Leur régularité, pas leurs charges : comparer des poids entre gabarits
        différents n&apos;apprend rien d&apos;utile.
      </p>

      {liste.amis.length === 0 ? (
        <p className="text-sm italic text-encre-douce">
          Aucun ami pour l&apos;instant.
        </p>
      ) : (
        <ul className="divide-y divide-filet">
          {visibles.map((a) => {
            const presence = presenceLisible(a.presenceSec)
            return (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar valeur={a.avatar} pseudo={a.pseudo} />
                <div className="min-w-0 flex-1">
                  <Nom pseudo={a.pseudo} />
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-encre-douce">
                    {presence && (
                      <span className={estEnLigne(a.presenceSec) ? 'text-accent-2' : ''}>
                        {estEnLigne(a.presenceSec) && '● '}
                        {presence}
                      </span>
                    )}
                    <span className={a.actifSemaine ? 'text-accent-2' : ''}>
                      {a.actifSemaine
                        ? '● entraîné cette semaine'
                        : 'pas encore actif cette semaine'}
                    </span>
                    {a.streak > 0 && (
                      <span>
                        {a.streak} semaine{a.streak > 1 ? 's' : ''} d&apos;affilée
                      </span>
                    )}
                    {a.amiDepuis && <span>ami {anciennete(a.amiDepuis)}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => {
                    if (confirm(`Retirer ${a.pseudo} de tes amis ?`))
                      onAgir(() => retirerAmi(a.id))
                  }}
                  className="shrink-0 rounded-full border border-bordure px-4 py-1.5
                             text-xs font-semibold text-encre-douce transition-colors
                             hover:border-accent/50 hover:text-accent"
                >
                  Retirer
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {reste > 0 && (
        <Bouton
          type="button"
          variante="discret"
          className="mt-4"
          onClick={() => setTout(true)}
        >
          Voir {reste === 1 ? "l'autre" : `les ${reste} autres`}
        </Bouton>
      )}
    </section>
  )
}

/* ---- Pièces communes ---- */

function Avatar({ valeur, pseudo }: { valeur: string | null; pseudo: string }) {
  return (
    <Link
      href={`/u/${encodeURIComponent(pseudo)}`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                 border border-bordure bg-verre text-xl transition-colors
                 hover:border-accent-2/60"
    >
      {valeur ?? '💪'}
    </Link>
  )
}

function Nom({ pseudo, className }: { pseudo: string; className?: string }) {
  return (
    <div className={className}>
      <Link
        href={`/u/${encodeURIComponent(pseudo)}`}
        className="font-semibold transition-colors hover:text-accent-2"
      >
        {pseudo}
      </Link>
    </div>
  )
}
