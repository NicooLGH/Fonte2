'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { seConnecter, type Etat } from '@/app/auth/actions'
import { Champ, Bouton, Erreur } from '@/components/ui'

const VIDE: Etat = {}

function Formulaire() {
  const [etat, action, enCours] = useActionState(seConnecter, VIDE)
  const params = useSearchParams()

  // Erreurs renvoyées par un lien email périmé ou déjà utilisé
  const codeErreur = params.get('erreur')
  const erreurLien =
    codeErreur === 'lien-expire'
      ? "Ce lien a expiré ou a déjà servi. Demande-en un nouveau."
      : codeErreur === 'lien-invalide'
        ? "Ce lien est incomplet. Ouvre-le directement depuis l'email."
        : null

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="rounded-carte border border-bordure bg-verre p-6">
        <h2 className="mb-1 text-2xl">Connexion</h2>
        <p className="mb-6 text-sm text-encre-douce">
          Retrouve ton carnet et ta progression.
        </p>

        <div className="flex flex-col gap-4">
          <Champ
            libelle="Adresse email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="toi@exemple.fr"
          />
          <Champ
            libelle="Mot de passe"
            name="motDePasse"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />

          <Erreur>{etat.erreur ?? erreurLien}</Erreur>

          <Bouton type="submit" disabled={enCours}>
            {enCours ? 'Connexion…' : 'Se connecter'}
          </Bouton>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Link
          href="/mot-de-passe"
          className="text-encre-douce underline-offset-4 hover:text-encre hover:underline"
        >
          Mot de passe oublié
        </Link>
        <p className="text-encre-douce">
          Pas encore de carnet ?{' '}
          <Link href="/inscription" className="font-semibold text-accent">
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  )
}

export default function Connexion() {
  // useSearchParams impose une frontière de suspense.
  return (
    <Suspense>
      <Formulaire />
    </Suspense>
  )
}
