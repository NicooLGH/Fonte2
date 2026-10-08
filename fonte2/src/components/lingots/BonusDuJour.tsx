'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { BONUS_CYCLE, formatLingots, type EtatLingots } from '@/lib/lingots'
import { recupererBonus } from '@/app/(carnet)/lingots/actions'
import { IconeLingot } from './IconeLingot'

/* ============================================================
   Bonus du jour (accueil)
   ============================================================
   Sept cases, une par jour d'affilée. Le bouton récupère le bonus
   tout de suite à l'écran ; la base confirme derrière et refuse
   un second passage le même jour. Une fois récupéré, la carte se
   réduit à une ligne pour laisser la place à la séance.
   ============================================================ */

export function BonusDuJour({ etat }: { etat: EtatLingots }) {
  const [recu, setRecu] = useState(etat.bonus.recupere)
  const [juste, setJuste] = useState(false)
  const [solde, setSolde] = useState(etat.solde)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  const jour = etat.bonus.jour
  const gain = BONUS_CYCLE[jour - 1]
  const demain = BONUS_CYCLE[jour % 7]

  function recuperer() {
    setRecu(true)
    setJuste(true)
    setSolde(etat.solde + gain)
    setErreur(null)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(30)
    demarrer(async () => {
      const r = await recupererBonus()
      if (r.erreur) {
        setRecu(etat.bonus.recupere)
        setJuste(false)
        setSolde(etat.solde)
        setErreur(r.erreur)
      } else if (typeof r.solde === 'number') {
        setSolde(r.solde)
      }
    })
  }

  // Déjà récupéré en arrivant : une simple ligne.
  if (recu && !juste) {
    return (
      <Link
        href="/lingots"
        className="appui flex h-14 items-center gap-3 rounded-carte bg-verre px-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#f0c04a]/15 text-[#f0c04a]">
          <IconeLingot className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] text-encre-douce">
          Bonus récupéré · demain +{demain}
        </span>
        <span className="font-mono text-[15px] text-[#f0c04a]">{formatLingots(solde)}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-encre-douce">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    )
  }

  return (
    <section
      aria-label="Bonus du jour"
      className="bloc flex flex-col gap-3.5 p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 110% 90% at 100% 0%, rgb(240 192 74 / 0.16), transparent 60%)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span className="text-[17px] font-bold">Bonus du jour</span>
          <span className="font-mono text-[12px] text-encre-douce uppercase">jour {jour} / 7</span>
        </span>
        <Link
          href="/lingots"
          aria-label={`Mes Lingots : ${formatLingots(solde)}`}
          className="flex h-9 items-center gap-1.5 rounded-pilule bg-verre-fort pr-3 pl-2.5 font-mono text-[15px] text-[#f0c04a]"
        >
          <IconeLingot className="h-[18px] w-[18px]" />
          {formatLingots(solde)}
        </Link>
      </div>

      <ol className="grid grid-cols-7 gap-1.5">
        {BONUS_CYCLE.map((m, i) => {
          const n = i + 1
          const fait = n < jour || (n === jour && recu)
          const ajd = n === jour && !recu
          const septieme = n === 7
          return (
            <li
              key={n}
              aria-label={`Jour ${n} : ${m} Lingots${fait ? ', récupéré' : ''}`}
              className={`flex h-16 flex-col items-center justify-center gap-1 rounded-[12px] transition-colors ${
                fait
                  ? 'bg-[#f0c04a]/18 text-[#f0c04a]'
                  : ajd
                    ? 'bg-[#f0c04a] text-[#1a1406]'
                    : septieme
                      ? 'bg-[#f0c04a]/8 text-[#f0c04a] ring-[1.5px] ring-[#f0c04a]/45 ring-inset'
                      : 'bg-verre-fort text-encre-douce'
              } ${fait && n === jour ? 'eclat-bonus' : ''}`}
            >
              {fait ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <IconeLingot className="h-[18px] w-[18px]" plein={0.15} />
              )}
              <span className="font-mono text-[12px] font-medium">{m}</span>
            </li>
          )
        })}
      </ol>

      {recu ? (
        <div className="eclat-bonus relative flex h-[52px] items-center justify-center gap-2 rounded-bloc bg-[#f0c04a]/12 text-[15px] font-semibold text-[#f0c04a]">
          <span className="monte-lingot absolute top-1.5 right-5 font-mono text-[15px]">+{gain}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Récupéré · reviens demain pour +{demain}
        </div>
      ) : (
        <button
          type="button"
          onClick={recuperer}
          disabled={enCours}
          className="appui flex h-[52px] items-center justify-center gap-2 rounded-bloc bg-[#f0c04a] text-[16px] font-bold text-[#1a1406]"
        >
          Récupérer +{gain}
          <IconeLingot className="h-5 w-5" />
        </button>
      )}

      {erreur ? (
        <p className="font-mono text-[13px] text-accent">{erreur}</p>
      ) : (
        <p className="text-[13px] text-encre-douce">
          Un jour manqué fait repartir le cycle au jour 1. Le jour 7 vaut 40.
        </p>
      )}
    </section>
  )
}
