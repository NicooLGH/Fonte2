'use client'

import { useActionState } from 'react'
import { deverrouiller, type Reponse } from '@/app/(carnet)/admin/verrou'
import { Bouton, Erreur } from '@/components/ui'

const VIDE: Reponse = {}

/**
 * Saisie du code d'accès.
 *
 * Champ numérique et clavier chiffres : on tape un code à quatre
 * chiffres avec le pouce, pas au clavier complet.
 */
export function Verrou() {
  const [etat, action, enCours] = useActionState(deverrouiller, VIDE)

  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="border-b border-filet pb-5">
        <h1 className="text-4xl sm:text-5xl">Administration</h1>
      </header>

      <form action={action} className="flex max-w-sm flex-col gap-5">
        <p className="text-sm leading-relaxed text-encre-douce">
          Saisis ton code pour ouvrir l&apos;administration. L&apos;accès reste
          ouvert une demi-heure.
        </p>

        <label className="block">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-encre-douce">
            Code
          </span>
          <input
            name="code"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={8}
            placeholder="••••"
            className="w-full rounded-bloc border border-bordure bg-verre px-4 py-3.5
                       text-center font-display text-3xl tracking-[0.4em]
                       focus:border-accent focus:outline-none"
          />
        </label>

        <Erreur>{etat.erreur}</Erreur>

        <Bouton type="submit" disabled={enCours}>
          {enCours ? 'Vérification…' : 'Ouvrir'}
        </Bouton>
      </form>
    </div>
  )
}
