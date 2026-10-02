'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { BadgeDefi } from './BadgeDefi'
import { Pastille } from './CartesDefis'
import {
  avancement,
  dernierJour,
  libelleObjectif,
  nombre,
  tempsRestant,
  OBJECTIFS,
  type Defi,
} from '@/lib/defis'
import { participer, cocherAujourdhui } from '@/app/(carnet)/defis/actions'
import { vibrer } from '@/lib/sons'

/* ============================================================
   Détail d'un défi
   ============================================================ */

export function DetailDefi({ defi }: { defi: Defi }) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  const c = defi.badge.couleur
  const a = avancement(defi)

  function agir(action: () => Promise<{ erreur?: string }>) {
    setErreur(null)
    demarrer(async () => {
      const r = await action()
      if (r.erreur) setErreur(r.erreur)
      else vibrer(14)
    })
  }

  const unite =
    defi.objectif === 'seance_longue' ? '' : ` ${OBJECTIFS[defi.objectif].unite(a.cible)}`

  return (
    <div
      className="-mx-4 flex min-h-[calc(100dvh-10rem)] flex-col px-4 pb-6 pt-1 md:-mx-6 md:px-6"
      style={{
        background: `radial-gradient(ellipse 100% 40% at 50% 0%, ${c}26, transparent 70%)`,
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Link
          href="/defis"
          className="flex min-h-11 items-center gap-1.5 self-start text-[13px] text-encre-douce
                     transition-colors hover:text-encre"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Défis
        </Link>

        <div className="mt-2 flex flex-col items-center text-center">
          <div className={defi.reussiLe ? 'impulsion' : ''}>
            <BadgeDefi badge={defi.badge} taille={128} verrouille={!defi.reussiLe && !defi.participe} />
          </div>
          <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
            {defi.reussiLe ? (
              <Pastille couleur={c}>Réussi</Pastille>
            ) : defi.participe ? (
              <Pastille couleur="#f4f3ee">Tu participes</Pastille>
            ) : null}
            <Pastille couleur={defi.type === 'honneur' ? '#3ddc84' : '#4cc9f0'}>
              {defi.type === 'honneur' ? "Sur l'honneur" : 'Vérifié automatiquement'}
            </Pastille>
            <Pastille couleur={defi.portee === 'collectif' ? '#a98bff' : '#8d9096'}>
              {defi.portee === 'collectif' ? 'Collectif' : 'Individuel'}
            </Pastille>
          </div>
          <h1 className="mt-3 text-[44px] leading-[0.95]">{defi.titre}</h1>
          {defi.description && (
            <p className="mt-2.5 max-w-[310px] text-[15px] leading-relaxed text-encre-douce">
              {defi.description}
            </p>
          )}
        </div>

        {/* Progression */}
        {(defi.participe || defi.portee === 'collectif') && (
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <p className="section-titre">
                {defi.portee === 'collectif' ? 'Tous ensemble' : 'Ta progression'}
              </p>
              <span className="font-mono text-[11px] text-encre-douce">
                {Math.round(a.part * 100)} %
              </span>
            </div>
            <p className="mt-2 font-display text-[44px] leading-[0.9]">
              {nombre(a.valeur)}{' '}
              <span className="text-[22px] text-encre-douce">
                / {nombre(a.cible)}
                {unite}
              </span>
            </p>
            <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full transition-[width] duration-700"
                style={{ width: `${a.part * 100}%`, background: c }}
              />
            </div>
            {defi.portee === 'collectif' && defi.participe && (
              <div className="mt-4 flex items-baseline justify-between border-y border-filet py-3">
                <span className="text-sm text-encre-douce">Ta contribution</span>
                <span className="font-display text-[26px] leading-none" style={{ color: c }}>
                  {nombre(defi.progression)}
                  {unite}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Jours à cocher */}
        {defi.type === 'honneur' && defi.participe && (
          <Jours defi={defi} enCours={enCours} agir={agir} />
        )}

        {/* Informations */}
        <dl className="mt-6 border-t border-filet">
          <Info terme="Objectif">
            {defi.type === 'honneur'
              ? `${nombre(defi.valeur)} jour${defi.valeur > 1 ? 's' : ''} cochés`
              : libelleObjectif(defi.objectif, defi.valeur)}
            {defi.portee === 'collectif' ? ', tous ensemble' : ''}
          </Info>
          <Info terme={defi.enCours ? 'Se termine' : 'Terminé'}>
            {dernierJour(defi.fin)}
            {defi.enCours && ` · encore ${tempsRestant(defi.fin)}`}
          </Info>
          <Info terme="Récompense" accent>
            {defi.xp > 0 ? `+${defi.xp} XP et ce badge` : 'Ce badge'}
            {defi.portee === 'collectif' ? ', pour chaque contributeur' : ''}
          </Info>
          {defi.repetition !== 'aucune' && (
            <Info terme="Revient">
              {defi.repetition === 'semaine' ? 'chaque semaine' : 'chaque mois'}
            </Info>
          )}
        </dl>

        <p className="mt-4 font-mono text-[10.5px] leading-relaxed text-encre-douce">
          {defi.portee === 'collectif'
            ? "Seul le total commun est affiché. Personne ne voit la part des autres. Ce qui compte : ce que tu fais à partir du jour où tu rejoins."
            : "Ta progression ne compte qu'à partir du jour où tu participes, et elle reste privée."}
        </p>

        {erreur && (
          <p className="mt-4 rounded-bloc border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-xs text-accent">
            {erreur}
          </p>
        )}

        {/* Actions */}
        {defi.enCours && !defi.participe && (
          <div className="mt-auto flex flex-col gap-2.5 pt-8">
            <button
              type="button"
              disabled={enCours}
              onClick={() => agir(() => participer(defi.edition, true))}
              className="appui h-[50px] rounded-bloc bg-accent text-[15px] font-semibold text-white
                         transition-colors hover:bg-accent-clair disabled:opacity-60"
            >
              Je participe
            </button>
            {!defi.refuse && (
              <button
                type="button"
                disabled={enCours}
                onClick={() => agir(() => participer(defi.edition, false))}
                className="h-[46px] rounded-bloc border border-bordure bg-verre text-sm font-semibold
                           text-encre transition-colors hover:bg-verre-fort disabled:opacity-60"
              >
                Pas cette fois
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Jours({
  defi,
  enCours,
  agir,
}: {
  defi: Defi
  enCours: boolean
  agir: (action: () => Promise<{ erreur?: string }>) => void
}) {
  // Les jours du défi, à l'heure de Paris, du premier au dernier.
  const jours = joursDuDefi(defi.debut, defi.fin)
  const aujourdhui = jourParis(new Date())
  const coche = defi.jours.includes(aujourdhui)
  const peutCocher = defi.enCours && jours.includes(aujourdhui)

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <p className="section-titre">Tes jours</p>
        <span className="font-mono text-[11px] text-encre-douce">
          <strong className="font-medium text-encre">{defi.jours.length}</strong> /{' '}
          {nombre(defi.valeur)} jours
        </span>
      </div>
      <div
        className="mt-3.5 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.min(7, jours.length)}, minmax(0, 1fr))` }}
      >
        {jours.map((j) => {
          const fait = defi.jours.includes(j)
          const estAujourdhui = j === aujourdhui
          const futur = j > aujourdhui
          const d = new Date(j + 'T12:00:00')
          return (
            <div
              key={j}
              className={`flex min-h-11 flex-col items-center gap-1.5 ${futur ? 'text-encre-douce' : ''}`}
              aria-label={`${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })} — ${
                fait ? 'fait' : estAujourdhui ? "aujourd'hui" : futur ? 'à venir' : 'non coché'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  fait
                    ? 'text-fond'
                    : estAujourdhui
                      ? 'border-2 border-dashed'
                      : 'border border-white/[0.12]'
                }`}
                style={{
                  background: fait ? defi.badge.couleur : undefined,
                  borderColor: estAujourdhui && !fait ? defi.badge.couleur : undefined,
                }}
              >
                {fait && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              <span className="font-mono text-[10px]">
                {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </span>
            </div>
          )
        })}
      </div>

      {peutCocher && !defi.reussiLe && (
        <button
          type="button"
          disabled={enCours}
          onClick={() => agir(() => cocherAujourdhui(defi.edition, !coche))}
          className={`appui mt-5 h-[50px] w-full rounded-bloc text-[15px] font-semibold transition-colors
            disabled:opacity-60 ${
              coche
                ? 'border border-bordure bg-verre text-encre hover:bg-verre-fort'
                : 'bg-accent text-white hover:bg-accent-clair'
            }`}
        >
          {coche ? "Décocher aujourd'hui" : "Cocher aujourd'hui"}
        </button>
      )}
      <p className="mt-2 text-center font-mono text-[10.5px] text-encre-douce">
        On ne coche que le jour même. Un jour coché par erreur se décoche avant minuit.
      </p>
    </div>
  )
}


function Info({
  terme,
  children,
  accent = false,
}: {
  terme: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-filet py-3">
      <dt className="text-sm text-encre-douce">{terme}</dt>
      <dd className={`text-right text-sm font-semibold ${accent ? 'text-accent-2' : ''}`}>
        {children}
      </dd>
    </div>
  )
}

/** « 2026-10-02 », à l'heure de Paris. */
function jourParis(d: Date): string {
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
}

/** Jours couverts par le défi (la fin est exclue), 31 au plus. */
function joursDuDefi(debut: string, fin: string): string[] {
  const jours: string[] = []
  const finMs = new Date(fin).getTime()
  let t = new Date(debut).getTime()
  while (t < finMs && jours.length < 31) {
    const j = jourParis(new Date(t))
    if (!jours.includes(j)) jours.push(j)
    t += 6 * 3600000
  }
  return jours
}
