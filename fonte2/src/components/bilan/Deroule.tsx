'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { nomGroupe } from '@/lib/carnet'
import { dureeLisible } from '@/lib/social'
import { libelleCourt } from '@/lib/semaine'
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
  const dernier = index === ecrans.length - 1

  function avancer() {
    if (!dernier) setIndex(index + 1)
    else router.push('/')
  }

  return (
    // Toujours sombre, même en mode clair : c'est un moment à part.
    <main
      className="sombre securise relative flex min-h-dvh flex-col overflow-hidden text-encre"
      style={{ background: 'linear-gradient(170deg, #3a1309 0%, #1a0e0b 45%, #0e0f11 100%)' }}
    >
      <Cercles />

      <div className="relative z-20 mx-auto w-full max-w-xl px-[18px] pt-3.5">
        {/* Progression */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${ecrans.length}, minmax(0, 1fr))` }}
          aria-label={`Écran ${index + 1} sur ${ecrans.length}`}
        >
          {ecrans.map((_, i) => (
            <span
              key={i}
              className={`h-[3px] rounded-pilule ${
                i < index ? 'bg-encre' : i === index ? 'bg-encre/60' : 'bg-encre/20'
              }`}
            />
          ))}
        </div>
        <div className="flex h-[52px] items-center justify-between">
          <span className="font-mono text-[13px] tracking-[0.08em] text-accent-clair uppercase">
            Bilan de {bilan.nomCourt}
          </span>
          <button
            type="button"
            onClick={() => router.push('/')}
            aria-label="Fermer le bilan"
            className="-mr-2.5 flex h-11 w-11 items-center justify-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Zones de navigation : à gauche on revient, ailleurs on avance. */}
      {!dernier && (
        <>
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
        </>
      )}

      <div
        key={index}
        className="bilan-entree relative z-0 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-2 px-[18px] pb-6"
      >
        {ecrans[index].contenu}
      </div>

      {dernier ? (
        <Cartes
          bilan={bilan}
          pseudo={pseudo}
          avatar={avatar}
          onRetour={() => setIndex(index - 1)}
        />
      ) : (
        <p className="relative z-0 pb-8 text-center font-mono text-[13px] text-encre-douce">
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
        <Amorce>Ton mois de</Amorce>
        <h1 className="font-display text-[clamp(4rem,20vw,8rem)] leading-[0.8] text-accent">
          {b.nomCourt}
        </h1>
        <Suite>Voici ce que tu as accompli.</Suite>
      </>
    ),
  })

  if (b.nbSeances > 0 || b.nbCardio > 0)
    ecrans.push({
      contenu: (
        <>
          <Amorce>Tu t&apos;es entraîné</Amorce>
          <Grand>
            {b.nbSeances + b.nbCardio}
            <span className="ml-3 text-[0.4em] text-encre">fois</span>
          </Grand>
          <Suite>
            sur{' '}
            <strong className="text-encre">
              {b.semaines} semaine{b.semaines > 1 ? 's' : ''}
            </strong>
            {b.dureeTotale > 0 && (
              <>
                , soit <strong className="text-encre">{dureeLisible(b.dureeTotale)}</strong> en salle
              </>
            )}
            .
            {b.nbCardio > 0 && (
              <>
                {' '}
                Dont <strong className="text-encre">{b.nbCardio} cardio</strong>.
              </>
            )}
          </Suite>
        </>
      ),
    })

  if (b.volume > 0) {
    const evolution =
      b.volumePrecedent > 0 ? Math.round(((b.volume - b.volumePrecedent) / b.volumePrecedent) * 100) : null
    const max = Math.max(...b.semainesVolume.map((s) => s.volume), 1)
    // La meilleure semaine ressort en orange.
    const meilleure = b.semainesVolume.find((s) => s.volume === max)?.cle ?? null

    ecrans.push({
      contenu: (
        <>
          <Amorce>Tu as soulevé</Amorce>
          <Grand>{tonnage(b.volume)}</Grand>
          <Suite>
            {evolution === null ? (
              <>
                en <strong className="text-encre">{b.series} séries</strong>.
              </>
            ) : (
              <>
                soit{' '}
                <strong className="text-encre">
                  {evolution > 0 ? '+' : evolution < 0 ? '−' : ''}
                  {Math.abs(evolution)} %
                </strong>{' '}
                par rapport à {b.nomPrecedent}.
              </>
            )}
          </Suite>
          {b.semainesVolume.length > 1 && (
            <div
              className="mt-8 grid h-[120px] items-end gap-2.5"
              style={{ gridTemplateColumns: `repeat(${b.semainesVolume.length}, minmax(0, 1fr))` }}
              role="img"
              aria-label="Volume soulevé chaque semaine du mois"
            >
              {b.semainesVolume.map((s) => (
                <div key={s.cle} className="flex flex-col items-stretch gap-1.5">
                  <span
                    className={`rounded-[10px] ${s.cle === meilleure ? 'bg-accent' : 'bg-encre/[0.18]'}`}
                    style={{ height: `${Math.max(8, (s.volume / max) * 100)}px` }}
                  />
                  <span
                    className={`text-center font-mono text-[12px] ${
                      s.cle === meilleure ? 'text-encre' : 'text-encre-douce'
                    }`}
                  >
                    {libelleCourt(s.cle)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {b.groupeTop && (
            <p className="mt-6 text-[16px] text-encre-douce">
              Groupe le plus travaillé :{' '}
              <strong className="text-encre">{nomGroupe(b.groupeTop as Groupe)}</strong>
            </p>
          )}
        </>
      ),
    })
  }

  if (b.records.length > 0)
    ecrans.push({
      contenu: (
        <>
          <Amorce>Records battus</Amorce>
          <Grand>{b.records.length}</Grand>
          <Liste
            elements={b.records.slice(0, 5).map((r) => ({
              gauche: r.nom,
              droite: `${r.poids.toLocaleString('fr-FR')} kg`,
            }))}
          />
        </>
      ),
    })

  if (b.objectifs.length > 0)
    ecrans.push({
      contenu: (
        <>
          <Amorce>Objectifs atteints</Amorce>
          <Grand>{b.objectifs.length}</Grand>
          <Liste
            elements={b.objectifs.map((o) => ({
              gauche: o.nom,
              droite: `${o.objectif.toLocaleString('fr-FR')} kg`,
            }))}
          />
        </>
      ),
    })

  if (b.evolutions.length > 0 || b.caloriesMoyennes !== null)
    ecrans.push({
      contenu: (
        <>
          <Amorce>Ton corps</Amorce>
          <h2 className="font-display text-[clamp(3rem,15vw,5rem)] leading-[0.85]">Ce qui a bougé</h2>
          <Liste
            elements={[
              ...b.evolutions.map((e) => ({
                gauche: e.libelle,
                droite: `${e.ecart > 0 ? '+' : '−'}${Math.abs(e.ecart).toLocaleString('fr-FR')} ${e.unite}`,
              })),
              ...(b.caloriesMoyennes !== null
                ? [
                    {
                      gauche: 'Calories moy./jour',
                      droite: b.caloriesMoyennes.toLocaleString('fr-FR'),
                    },
                  ]
                : []),
            ]}
          />
          <p className="mt-3 text-[14px] text-encre-douce">Ces chiffres restent dans ton carnet.</p>
        </>
      ),
    })

  ecrans.push({
    contenu: (
      <>
        <Amorce>C&apos;est tout pour {b.nomCourt}</Amorce>
        <h2 className="font-display text-[clamp(3rem,15vw,5rem)] leading-[0.85]">Garde une trace</h2>
        <Suite>
          Deux cartes à télécharger : la complète pour toi, l&apos;autre sans ton poids ni tes
          mensurations, à partager sans arrière-pensée.
        </Suite>
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
  onRetour,
}: {
  bilan: Bilan
  pseudo: string
  avatar: string
  onRetour: () => void
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
    <div className="relative z-30 mx-auto flex w-full max-w-xl flex-col gap-2 px-[18px] pb-8">
      <button
        type="button"
        disabled={enCours !== null}
        onClick={() => telecharger(false)}
        className="appui h-[58px] rounded-carte bg-accent text-[17px] font-bold text-white
                   transition-colors hover:bg-accent-clair disabled:opacity-50"
      >
        {enCours === 'partage' ? 'Génération…' : 'Carte à partager'}
      </button>
      <button
        type="button"
        disabled={enCours !== null}
        onClick={() => telecharger(true)}
        className="appui h-[54px] rounded-carte bg-encre/10 text-[16px] font-semibold
                   transition-colors hover:bg-encre/15 disabled:opacity-50"
      >
        {enCours === 'complete' ? 'Génération…' : 'Carte complète, pour moi'}
      </button>
      <div className="grid grid-cols-2">
        <button type="button" onClick={onRetour} className="h-12 text-[15px] text-encre-douce hover:text-encre">
          Revenir
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="h-12 text-[15px] font-semibold text-encre-douce hover:text-encre"
        >
          Terminer
        </button>
      </div>
    </div>
  )
}

/* ---- Pièces ---- */

function Amorce({ children }: { children: React.ReactNode }) {
  return <p className="text-[22px] font-semibold">{children}</p>
}

function Grand({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[clamp(5rem,34vw,9.75rem)] leading-[0.8] text-accent">{children}</p>
  )
}

function Suite({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[20px] leading-snug text-encre/80">{children}</p>
}

function Liste({ elements }: { elements: { gauche: string; droite: string }[] }) {
  return (
    <ul className="mt-5 flex flex-col">
      {elements.map((e) => (
        <li
          key={e.gauche}
          className="flex min-h-[52px] items-center justify-between gap-4 border-b border-encre/10 last:border-0"
        >
          <span className="min-w-0 flex-1 truncate text-[17px]">{e.gauche}</span>
          <span className="font-mono text-[16px] text-accent-clair">{e.droite}</span>
        </li>
      ))}
    </ul>
  )
}

/** Les deux cercles de FONTE, en grand, derrière le contenu. */
function Cercles() {
  return (
    <svg
      viewBox="0 0 390 420"
      aria-hidden
      className="pointer-events-none absolute top-[260px] left-1/2 w-[390px] -translate-x-1/2"
    >
      <circle cx="300" cy="200" r="170" fill="none" stroke="rgb(255 75 43 / 0.10)" strokeWidth="40" />
      <circle cx="300" cy="200" r="80" fill="none" stroke="rgb(76 201 240 / 0.08)" strokeWidth="22" />
    </svg>
  )
}

/** « 52,4 t », « 840 kg » */
function tonnage(kg: number) {
  return kg >= 1000
    ? `${(kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`
    : `${Math.round(kg)} kg`
}
