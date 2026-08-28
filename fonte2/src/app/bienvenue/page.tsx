'use client'

import { useActionState, useState } from 'react'
import { finirBienvenue, type Etat } from '@/app/auth/actions'
import { Champ, Bouton, Erreur } from '@/components/ui'
import { REGLES_PSEUDO } from '@/lib/messages'

const AVATARS = [
  '💪', '🔥', '🏋️', '🦾', '⚡', '🐺', '🦁', '🐻',
  '🦍', '🚀', '⚙️', '🎯', '🥇', '🧊', '🌑', '🍀',
]

const VIDE: Etat = {}

export default function Bienvenue() {
  const [etat, action, enCours] = useActionState(finirBienvenue, VIDE)
  const [avatar, setAvatar] = useState('💪')

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <form action={action} className="w-full max-w-[440px]">
        <div className="rounded-carte border border-bordure bg-verre p-6">
          <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent-2">
            Bienvenue
          </p>
          <h1 className="mb-2 text-4xl">Choisis ton pseudo</h1>
          <p className="mb-6 text-sm leading-relaxed text-encre-douce">
            C&apos;est le nom qui s&apos;affichera sur ton carnet, et celui par
            lequel tes amis pourront te trouver. Il doit être unique.
          </p>

          <div className="flex flex-col gap-5">
            <Champ
              libelle="Pseudo"
              name="pseudo"
              type="text"
              required
              maxLength={24}
              autoComplete="off"
              placeholder="ex : Maxime"
              aide={REGLES_PSEUDO}
            />

            <div>
              <span className="mb-3 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
                Avatar
              </span>
              <input type="hidden" name="avatar" value={avatar} />
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    aria-pressed={avatar === a}
                    aria-label={`Avatar ${a}`}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl
                      transition-colors ${
                        avatar === a
                          ? 'border-accent bg-accent/15'
                          : 'border-bordure bg-verre hover:bg-verre-fort'
                      }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <Erreur>{etat.erreur}</Erreur>

            <Bouton type="submit" disabled={enCours}>
              {enCours ? 'Enregistrement…' : 'Ouvrir mon carnet'}
            </Bouton>
          </div>
        </div>
      </form>
    </main>
  )
}
