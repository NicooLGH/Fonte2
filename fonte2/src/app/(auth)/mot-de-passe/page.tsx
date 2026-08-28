'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { envoyerReinitialisation, type Etat } from '@/app/auth/actions'
import { Champ, Bouton, Erreur, Succes } from '@/components/ui'

const VIDE: Etat = {}

export default function MotDePasse() {
  const [etat, action, enCours] = useActionState(envoyerReinitialisation, VIDE)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="rounded-carte border border-bordure bg-verre p-6">
        <h2 className="mb-1 text-2xl">Mot de passe oublié</h2>
        <p className="mb-6 text-sm leading-relaxed text-encre-douce">
          Indique ton adresse : tu recevras un lien pour en choisir un nouveau.
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

          <Erreur>{etat.erreur}</Erreur>
          <Succes>{etat.succes}</Succes>

          {!etat.succes && (
            <Bouton type="submit" disabled={enCours}>
              {enCours ? 'Envoi…' : 'Envoyer le lien'}
            </Bouton>
          )}
        </div>
      </div>

      <p className="text-center text-sm">
        <Link
          href="/connexion"
          className="text-encre-douce underline-offset-4 hover:text-encre hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  )
}
