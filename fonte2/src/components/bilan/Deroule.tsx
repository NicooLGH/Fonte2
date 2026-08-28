'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { nomGroupe } from '@/lib/carnet'
import { dureeLisible } from '@/lib/social'
import type { Bilan } from '@/lib/bilan'
import type { Groupe } from '@/types/database'
import { dessinerCarte } from './carte'

/* ============================================================
   Bilan mensuel
   ============================================================
   Plusieurs écrans qu'on parcourt en touchant : à droite pour
   avancer, à gauche pour revenir. Le nombre d'écrans dépend de
   ce que le mois contient — inutile d'afficher « 0 record ».
   ============================================================ */

export function DerouleBilan({
  bilan,
  pseudo,
  avatar,
}: {
  bilan: Bilan
  pseudo: string
  avatar: string
}) {
  const router = useRouter()
  const ecrans = construireEcrans(bilan)
  const [index, setIndex] = useState(0)

  function avancer() {
    if (index < ecrans.length - 1) setIndex(index + 1)
    else router.push('/')
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Halos, plus marqués que sur le reste du carnet */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 4%, rgb(255 75 43 / 0.28), transparent 52%),' +
            'radial-gradient(circle at 92% 60%, rgb(76 201 240 / 0.20), transparent 52%)',
        }}
      />

      {/* Progression */}
      <div className="absolute inset-x-4 top-4 z-20 flex gap-1.5">
        {ecrans.map((_, i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-full ${
              i <= index ? 'bg-accent-2' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push('/')}
        aria-label="Fermer"
        className="absolute right-3 top-8 z-30 flex h-9 w-9 items-center justify-center
                   rounded-full bg-white/10 text-xs text-encre"
      >
        ✕
      </button>

      {/* Zones de navigation */}
      <button
        type="button"
        aria-label="Écran précédent"
        onClick={() => setIndex(Math.max(0, index - 1))}
        className="absolute inset-y-0 left-0 z-10 w-1/3"
      />
      <button
        type="button"
        aria-label="Écran suivant"
        onClick={avancer}
        className="absolute inset-y-0 right-0 z-10 w-2/3"
      />

      {/* Contenu */}
      <div
        key={index}
        className="bilan-entree relative z-0 mx-auto flex min-h-dvh max-w-xl
                   flex-col justify-center gap-4 px-7 py-20"
      >
        {ecrans[index].contenu}
      </div>

      {index === ecrans.length - 1 && (
        <Cartes bilan={bilan} pseudo={pseudo} avatar={avatar} />
      )}

      {index === 0 && (
        <p className="absolute inset-x-0 bottom-10 z-0 text-center font-mono text-[11px] text-encre-douce">
          Touche pour continuer
        </p>
      )}
    </main>
  )
}

/* ---- Les écrans ---- */

function construireEcrans(b: Bilan): { contenu: React.ReactNode }[] {
  const ecrans: { contenu: React.ReactNode }[] = []

  ecrans.push({
    contenu: (
      <>
        <Surtitre>Bilan mensuel</Surtitre>
        <h1 className="text-6xl leading-[0.9] sm:text-7xl">{b.nom}</h1>
        <p className="text-base leading-relaxed text-encre-douce">
          Voici ce que tu as accompli ce mois-ci.
        </p>
      </>
    ),
  })

  ecrans.push({
    contenu: (
      <>
        <Surtitre>Tes séances</Surtitre>
        <Chiffre>{b.nbSeances}</Chiffre>
        <p className="text-base leading-relaxed text-encre-douce">
          séance{b.nbSeances > 1 ? 's' : ''} enregistrée
          {b.nbSeances > 1 ? 's' : ''}, réparties sur{' '}
          <strong className="text-encre">
            {b.semaines} semaine{b.semaines > 1 ? 's' : ''}
          </strong>
          .
          {b.dureeTotale > 0 && (
            <>
              <br />
              Soit{' '}
              <strong className="text-encre">
                {dureeLisible(b.dureeTotale)}
              </strong>{' '}
              passées à t&apos;entraîner.
            </>
          )}
        </p>
      </>
    ),
  })

  ecrans.push({
    contenu: (
      <>
        <Surtitre>Volume soulevé</Surtitre>
        <Chiffre unite="kg">{b.volume.toLocaleString('fr-FR')}</Chiffre>
        <p className="text-base leading-relaxed text-encre-douce">
          en <strong className="text-encre">{b.series} séries</strong>.
          {b.groupeTop && (
            <>
              <br />
              Groupe le plus travaillé :{' '}
              <strong className="text-encre">
                {nomGroupe(b.groupeTop as Groupe)}
              </strong>
              .
            </>
          )}
        </p>
      </>
    ),
  })

  if (b.records.length > 0)
    ecrans.push({
      contenu: (
        <>
          <Surtitre>Records battus</Surtitre>
          <Chiffre>{b.records.length}</Chiffre>
          <Liste
            elements={b.records.slice(0, 5).map((r) => ({
              gauche: r.nom,
              droite: `${r.poids} kg`,
            }))}
          />
        </>
      ),
    })

  if (b.objectifs.length > 0)
    ecrans.push({
      contenu: (
        <>
          <Surtitre>Objectifs atteints</Surtitre>
          <Chiffre>{b.objectifs.length}</Chiffre>
          <Liste
            elements={b.objectifs.map((o) => ({
              gauche: o.nom,
              droite: `${o.objectif} kg`,
            }))}
          />
        </>
      ),
    })

  if (b.evolutions.length > 0 || b.caloriesMoyennes !== null)
    ecrans.push({
      contenu: (
        <>
          <Surtitre>Ton corps</Surtitre>
          <h2 className="text-4xl sm:text-5xl">Ce qui a bougé</h2>
          <Liste
            elements={[
              ...b.evolutions.map((e) => ({
                gauche: e.libelle,
                droite: `${e.ecart > 0 ? '+' : ''}${e.ecart} ${e.unite}`,
                accent: e.ecart > 0,
              })),
              ...(b.caloriesMoyennes !== null
                ? [
                    {
                      gauche: 'Calories moy./jour',
                      droite: String(b.caloriesMoyennes),
                    },
                  ]
                : []),
            ]}
          />
          <p className="mt-2 font-mono text-[11px] text-encre-douce">
            Ces chiffres ne quittent pas ton carnet.
          </p>
        </>
      ),
    })

  ecrans.push({
    contenu: (
      <>
        <Surtitre>C&apos;est tout pour {b.nom}</Surtitre>
        <h2 className="text-4xl sm:text-5xl">Garde une trace</h2>
        <p className="text-base leading-relaxed text-encre-douce">
          Deux cartes à télécharger : l&apos;une complète pour toi,
          l&apos;autre sans ton poids ni tes mensurations, à partager sans
          arrière-pensée.
        </p>
      </>
    ),
  })

  return ecrans
}

/* ---- Cartes téléchargeables ---- */

function Cartes({
  bilan,
  pseudo,
  avatar,
}: {
  bilan: Bilan
  pseudo: string
  avatar: string
}) {
  const router = useRouter()
  const [enCours, setEnCours] = useState<'complete' | 'partage' | null>(null)

  async function telecharger(complete: boolean) {
    setEnCours(complete ? 'complete' : 'partage')
    try {
      await dessinerCarte({ bilan, pseudo, avatar, complete })
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 mx-auto max-w-xl px-7 pb-10">
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          disabled={enCours !== null}
          onClick={() => telecharger(true)}
          className="rounded-full bg-accent px-6 py-3.5 font-semibold text-white
                     transition-colors hover:bg-accent-clair disabled:opacity-50"
        >
          {enCours === 'complete' ? 'Génération…' : 'Carte complète'}
        </button>
        <button
          type="button"
          disabled={enCours !== null}
          onClick={() => telecharger(false)}
          className="rounded-full border border-bordure bg-verre px-6 py-3
                     text-sm font-semibold text-encre-douce transition-colors
                     hover:text-encre disabled:opacity-50"
        >
          {enCours === 'partage' ? 'Génération…' : 'Carte partageable'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-1 font-mono text-xs text-encre-douce underline underline-offset-4"
        >
          Terminer
        </button>
      </div>
    </div>
  )
}

/* ---- Pièces ---- */

function Surtitre({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
      {children}
    </p>
  )
}

function Chiffre({
  children,
  unite,
}: {
  children: React.ReactNode
  unite?: string
}) {
  return (
    <p className="font-display text-[clamp(5rem,20vw,9rem)] leading-[0.85] text-accent">
      {children}
      {unite && (
        <span className="ml-3 font-corps text-[0.22em] text-encre-douce">
          {unite}
        </span>
      )}
    </p>
  )
}

function Liste({
  elements,
}: {
  elements: { gauche: string; droite: string; accent?: boolean }[]
}) {
  return (
    <ul className="mt-2 flex flex-col">
      {elements.map((e) => (
        <li
          key={e.gauche}
          className="flex items-baseline justify-between gap-4 border-b
                     border-white/10 py-3 last:border-0"
        >
          <span className="min-w-0 flex-1 truncate text-[15px] text-encre-douce">
            {e.gauche}
          </span>
          <span
            className={`font-display text-2xl ${
              e.accent ? 'text-accent' : 'text-accent-2'
            }`}
          >
            {e.droite}
          </span>
        </li>
      ))}
    </ul>
  )
}
