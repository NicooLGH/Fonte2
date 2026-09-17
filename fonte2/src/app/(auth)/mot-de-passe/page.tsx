'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { envoyerReinitialisation, type Etat } from '@/app/auth/actions'
import { ChampEpure } from '@/components/ui/ChampEpure'
import { Bouton, Erreur, Succes } from '@/components/ui'

const VIDE: Etat = {}

export default function MotDePasse() {
  const [etat, action, enCours] = useActionState(envoyerReinitialisation, VIDE)

  return (
    <form action={action} className="flex flex-col gap-6">
      <header>
        <h1 className="text-[32px] leading-none tracking-wide">
          Fonte<span className="text-accent">.</span>
        </h1>
        <p className="section-titre mt-1.5">Mot de passe oublié</p>
      </header>

      <p className="text-sm leading-relaxed text-encre-douce">
        Indique ton adresse : tu recevras un lien pour en choisir un nouveau.
      </p>

      <ChampEpure
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

      <p className="text-center text-[12.5px]">
        <Link
          href="/connexion"
          className="text-encre-douce transition-colors hover:text-encre"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  )
}
