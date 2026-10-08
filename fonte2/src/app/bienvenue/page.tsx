'use client'

import { useActionState, useEffect, useState } from 'react'
import { finirBienvenue, type Etat } from '@/app/auth/actions'
import { Erreur } from '@/components/ui'
import { REGLES_PSEUDO, validerPseudo } from '@/lib/messages'
import { AVATARS } from '@/lib/recompenses'
import { usePastille, Pastille } from '@/components/ui/Pastille'

/* ============================================================
   Arrivée
   ============================================================
   1/3 : pseudo et avatar. 2/3 : rythme, objectif, expérience
   (facultatifs). 3/3 : la première séance, guidée, dans l'écran
   de séance en direct.
   ============================================================ */

const VIDE: Etat = {}
const PREMIERS = ['💪', '🔥', '⚡', '🏋️', '🦾', '🐺', '🦁', '🚀', '🎯', '🥇']
const TOUS = AVATARS.flatMap((f) => f.liste)

const OBJECTIFS = [
  { cle: 'muscle', nom: 'Prendre du muscle', icone: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" /> },
  { cle: 'force', nom: 'Gagner en force', icone: <path d="M13 2L3 14h8l-1 8 10-12h-8z" /> },
  {
    cle: 'forme',
    nom: 'Rester en forme',
    icone: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />,
  },
]

export default function Bienvenue() {
  const [etat, action, enCours] = useActionState(finirBienvenue, VIDE)
  const [etape, setEtape] = useState<1 | 2>(1)
  const [pseudo, setPseudo] = useState('')
  const [avatar, setAvatar] = useState('💪')
  const [tous, setTous] = useState(false)
  const [rythme, setRythme] = useState<number | null>(3)
  const [objectif, setObjectif] = useState<string | null>(null)
  const [experience, setExperience] = useState<string | null>(null)
  const pastilleRythme = usePastille(rythme)
  const pastilleExperience = usePastille(experience)
  const [souci, setSouci] = useState<string | null>(null)

  // Le pseudo est refusé par la base (déjà pris) : retour à l'étape 1.
  useEffect(() => {
    if (etat.erreur) setEtape(1)
  }, [etat])

  const liste = tous ? TOUS : PREMIERS

  return (
    <main
      className="securise mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-7"
      style={{ background: 'radial-gradient(circle at 90% 0%, rgb(255 75 43 / 0.14), transparent 40%)' }}
    >
      <form action={action} className="flex flex-1 flex-col gap-5">
        <input type="hidden" name="pseudo" value={pseudo} />
        <input type="hidden" name="avatar" value={avatar} />
        <input type="hidden" name="rythme" value={rythme ?? ''} />
        <input type="hidden" name="objectif" value={objectif ?? ''} />
        <input type="hidden" name="experience" value={experience ?? ''} />

        <div className="flex h-11 items-center justify-between">
          {etape === 2 ? (
            <button
              type="button"
              onClick={() => setEtape(1)}
              aria-label="Étape précédente"
              className="-ml-2 flex h-11 w-11 items-center justify-center"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-2">
            <span className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1.5 w-6 rounded-pilule ${n <= etape ? 'bg-accent' : 'bg-encre/15'}`} />
              ))}
            </span>
            <span className="font-mono text-[13px] text-encre-douce">{etape}/3</span>
          </span>
        </div>

        {etape === 1 ? (
          <>
            <h1 className="titre-page px-0.5">Qui es-tu ?</h1>

            <label className="flex flex-col gap-2">
              <span className="px-0.5 text-[15px] font-semibold text-encre-douce">Pseudo</span>
              <span className="flex h-14 items-center gap-1 rounded-bloc border-2 border-transparent bg-verre px-4 focus-within:border-accent">
                <span className="text-[18px] text-encre-douce">@</span>
                <input
                  value={pseudo}
                  onChange={(e) => {
                    setPseudo(e.target.value)
                    setSouci(null)
                  }}
                  maxLength={16}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoFocus
                  placeholder="ton pseudo"
                  className="min-w-0 flex-1 bg-transparent text-[18px] focus:outline-none"
                />
              </span>
              <span className="px-0.5 text-[13px] text-encre-douce">{REGLES_PSEUDO} Il doit être unique.</span>
            </label>

            <div className="flex flex-col gap-2">
              <span className="px-0.5 text-[15px] font-semibold text-encre-douce">Avatar</span>
              <div className={`grid grid-cols-5 gap-2 ${tous ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                {liste.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    aria-pressed={avatar === a}
                    aria-label={`Avatar ${a}`}
                    className={`appui flex h-14 items-center justify-center rounded-bloc text-[28px] transition-colors ${
                      avatar === a ? 'bg-accent/20 ring-2 ring-accent' : 'bg-verre hover:bg-verre-fort'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {!tous && (
                <button
                  type="button"
                  onClick={() => setTous(true)}
                  className="h-11 self-start px-0.5 text-[15px] font-semibold text-encre-douce hover:text-encre"
                >
                  Voir les {TOUS.length} avatars
                </button>
              )}
            </div>

            <Erreur>{souci ?? etat.erreur}</Erreur>

            <div className="flex-1" />
            <button
              type="button"
              onClick={() => {
                const s = validerPseudo(pseudo)
                if (s) setSouci(s)
                else setEtape(2)
              }}
              className="appui h-[58px] rounded-carte bg-accent text-[17px] font-bold text-white hover:bg-accent-clair"
            >
              Continuer
            </button>
          </>
        ) : (
          <>
            <h1 className="titre-page px-0.5">Ton rythme</h1>

            <div className="flex flex-col gap-2">
              <span className="px-0.5 text-[15px] font-semibold text-encre-douce">Séances par semaine</span>
              <div ref={pastilleRythme.ref} className="relative grid grid-cols-5 gap-2">
                <Pastille pos={pastilleRythme.pos} arrondi="rounded-bloc" />
                {[2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRythme(n)}
                    aria-pressed={rythme === n}
                    data-actif={rythme === n}
                    className={`appui relative h-14 rounded-bloc font-display text-[28px] transition-colors duration-300 ${
                      rythme === n ? `${pastilleRythme.fond} text-fond` : 'bg-verre text-encre-douce hover:text-encre'
                    }`}
                  >
                    {n === 6 ? '6+' : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="px-0.5 text-[15px] font-semibold text-encre-douce">Objectif</span>
              {OBJECTIFS.map((o) => (
                <button
                  key={o.cle}
                  type="button"
                  onClick={() => setObjectif(o.cle)}
                  aria-pressed={objectif === o.cle}
                  className={`appui flex h-16 items-center gap-3.5 rounded-carte px-4 text-left transition-colors ${
                    objectif === o.cle ? 'bg-accent/15 ring-2 ring-accent' : 'bg-verre hover:bg-verre-fort'
                  }`}
                >
                  <span className={objectif === o.cle ? 'text-accent' : 'text-encre-douce'}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {o.icone}
                    </svg>
                  </span>
                  <span className="text-[17px] font-semibold">{o.nom}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <span className="px-0.5 text-[15px] font-semibold text-encre-douce">Expérience</span>
              <div ref={pastilleExperience.ref} className="relative grid grid-cols-3 gap-1 rounded-bloc bg-verre p-1">
                <Pastille pos={pastilleExperience.pos} arrondi="rounded-[11px]" />
                {[
                  ['debutant', 'Débutant'],
                  ['moyen', 'Moyen'],
                  ['confirme', 'Confirmé'],
                ].map(([cle, nom]) => (
                  <button
                    key={cle}
                    type="button"
                    onClick={() => setExperience(cle)}
                    aria-pressed={experience === cle}
                    data-actif={experience === cle}
                    className={`relative h-11 rounded-[11px] text-[15px] transition-colors duration-300 ${
                      experience === cle ? `${pastilleExperience.fond} font-semibold text-fond` : 'text-encre-douce hover:text-encre'
                    }`}
                  >
                    {nom}
                  </button>
                ))}
              </div>
            </div>

            <Erreur>{etat.erreur}</Erreur>

            <div className="flex-1" />
            <div className="flex flex-col gap-1">
              <button
                type="submit"
                name="suite"
                value="guidee"
                disabled={enCours}
                className="appui h-[58px] rounded-carte bg-accent text-[17px] font-bold text-white hover:bg-accent-clair disabled:opacity-60"
              >
                {enCours ? 'Préparation…' : 'Faire ma première séance'}
              </button>
              <button
                type="submit"
                name="suite"
                value="accueil"
                disabled={enCours}
                className="h-12 text-[16px] text-encre-douce hover:text-encre disabled:opacity-60"
              >
                Plus tard
              </button>
            </div>
          </>
        )}
      </form>
    </main>
  )
}
