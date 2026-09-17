'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { sInscrire, type Etat } from '@/app/auth/actions'
import { ChampEpure } from '@/components/ui/ChampEpure'
import { Bouton, Erreur, Succes } from '@/components/ui'

const VIDE: Etat = {}

export default function Inscription() {
  const [etat, action, enCours] = useActionState(sInscrire, VIDE)

  return (
    <form action={action} className="flex flex-col gap-6">
      <header>
        <h1 className="text-[32px] leading-none tracking-wide">
          Fonte<span className="text-accent">.</span>
        </h1>
        <p className="section-titre mt-1.5">Créer ton carnet</p>
      </header>

      <div className="flex flex-col gap-5">
        <ChampEpure
          libelle="Adresse email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="toi@exemple.fr"
        />
        <ChampEpure
          libelle="Mot de passe"
          name="motDePasse"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          aide="Au moins 8 caractères."
        />
      </div>

      <Erreur>{etat.erreur}</Erreur>
      <Succes>{etat.succes}</Succes>

      {!etat.succes && (
        <Bouton type="submit" disabled={enCours}>
          {enCours ? 'Création…' : 'Créer mon carnet'}
        </Bouton>
      )}

      <p className="text-center text-[12.5px] text-encre-douce">
        Déjà un carnet ?{' '}
        <Link href="/connexion" className="font-semibold text-accent">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
