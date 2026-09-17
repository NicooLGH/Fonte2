'use client'

import Link from 'next/link'
import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { seConnecter, type Etat } from '@/app/auth/actions'
import { ChampEpure } from '@/components/ui/ChampEpure'
import { Bouton, Erreur } from '@/components/ui'

const VIDE: Etat = {}

function Formulaire() {
  const [etat, action, enCours] = useActionState(seConnecter, VIDE)
  const params = useSearchParams()

  const code = params.get('erreur')
  const erreurLien =
    code === 'lien-expire'
      ? 'Ce lien a expiré ou a déjà servi. Demande-en un nouveau.'
      : code === 'lien-invalide'
        ? "Ce lien est incomplet. Ouvre-le directement depuis l'email."
        : null

  return (
    <form action={action} className="flex flex-col gap-6">
      <header>
        <h1 className="text-[32px] leading-none tracking-wide">
          Fonte<span className="text-accent">.</span>
        </h1>
        <p className="section-titre mt-1.5">Carnet de performance</p>
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <Erreur>{etat.erreur ?? erreurLien}</Erreur>

      <Bouton type="submit" disabled={enCours}>
        {enCours ? 'Connexion…' : 'Se connecter'}
      </Bouton>

      <div className="flex items-center justify-between gap-4 text-[12.5px]">
        <Link
          href="/mot-de-passe"
          className="text-encre-douce transition-colors hover:text-encre"
        >
          Mot de passe oublié
        </Link>
        <Link href="/inscription" className="font-semibold text-accent">
          Créer un carnet
        </Link>
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
