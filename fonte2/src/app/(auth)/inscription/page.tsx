'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { sInscrire, type Etat } from '@/app/auth/actions'
import { Champ, Bouton, Erreur, Succes } from '@/components/ui'

const VIDE: Etat = {}

export default function Inscription() {
  const [etat, action, enCours] = useActionState(sInscrire, VIDE)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="rounded-carte border border-bordure bg-verre p-6">
        <h2 className="mb-1 text-2xl">Créer un carnet</h2>
        <p className="mb-6 text-sm text-encre-douce">
          Tes séances, tes mensurations et ta progression, au même endroit.
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
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            aide="Au moins 8 caractères."
          />

          <Erreur>{etat.erreur}</Erreur>
          <Succes>{etat.succes}</Succes>

          {!etat.succes && (
            <Bouton type="submit" disabled={enCours}>
              {enCours ? 'Création…' : 'Créer mon carnet'}
            </Bouton>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-encre-douce">
        Déjà un carnet ?{' '}
        <Link href="/connexion" className="font-semibold text-accent">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
