'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { BadgeDefi } from './BadgeDefi'
import {
  avancement,
  nombre,
  tempsRestant,
  OBJECTIFS,
  type Defi,
} from '@/lib/defis'
import { participer } from '@/app/(carnet)/defis/actions'
import { vibrer } from '@/lib/sons'

/* ============================================================
   Défis sur l'accueil
   ============================================================
   Le plus récent des défis non réussis passe à la une, dans une
   grande carte à la couleur de son badge. Les autres suivent en
   liste, avec leur barre de progression. Un défi mis de côté
   (« Pas cette fois ») quitte la une mais reste dans la liste.
   ============================================================ */

export function DefisAccueil({ defis }: { defis: Defi[] }) {
  if (defis.length === 0) return null

  const une = defis.find((d) => !d.reussiLe && !d.refuse) ?? null
  const autres = defis.filter((d) => d !== une)

  return (
    <div className="flex flex-col gap-2">
      {une && <CarteUne defi={une} />}

      {autres.length > 0 && (
        <section className="flex flex-col">
          <div className="flex items-baseline justify-between px-0.5 pb-1">
            <p className="section-titre">Défis en cours</p>
            <Link href="/defis" className="text-[14px] font-semibold text-encre-douce hover:text-encre">
              Tout voir ›
            </Link>
          </div>
          {autres.slice(0, 3).map((d) => (
            <LigneDefi key={d.edition} defi={d} />
          ))}
        </section>
      )}
    </div>
  )
}

/* ---- La une ---- */

export function CarteUne({ defi }: { defi: Defi }) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  const c = defi.badge.couleur
  const a = avancement(defi)
  const unite = defi.objectif === 'seance_longue' ? '' : ` ${OBJECTIFS[defi.objectif].unite(a.cible)}`

  function rejoindre() {
    setErreur(null)
    demarrer(async () => {
      const r = await participer(defi.edition, true)
      if (r.erreur) setErreur(r.erreur)
      else vibrer(14)
    })
  }

  return (
    <section aria-label="Défi à la une" className="bloc motif-cercles-bleu motif-cercles flex flex-col gap-4 p-[18px]">
      <Link href={`/defis/${defi.edition}`} className="flex items-center gap-3.5">
        <BadgeDefi badge={defi.badge} taille={72} verrouille={!defi.participe && !defi.reussiLe} />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase" style={{ color: c }}>
            À la une{defi.portee === 'collectif' ? ' · collectif' : ''}
          </span>
          <span className="font-display text-[36px] leading-[0.9]">{defi.titre}</span>
          <span className="text-[14px] text-encre-douce">
            {defi.portee === 'collectif' ? 'Tous ensemble · ' : ''}encore {tempsRestant(defi.fin)}
          </span>
        </span>
      </Link>

      {defi.participe ? (
        <div className="flex flex-col gap-2">
          <div className="h-2 overflow-hidden rounded-pilule bg-encre/[0.08]">
            <div className="h-full rounded-pilule" style={{ width: `${a.part * 100}%`, background: c }} />
          </div>
          <div className="flex justify-between font-mono text-[13px] text-encre-douce">
            <span>
              {nombre(a.valeur)} / {nombre(a.cible)}
              {unite}
            </span>
            <span className="text-accent-clair">+{defi.xp} XP</span>
          </div>
          {defi.type === 'honneur' && (
            <Link
              href={`/defis/${defi.edition}`}
              className="appui mt-1 flex h-12 items-center justify-center rounded-bloc bg-verre-fort text-[15px] font-semibold"
            >
              Cocher ma journée
            </Link>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={rejoindre}
            disabled={enCours}
            className="appui h-[52px] flex-1 rounded-bloc bg-accent text-[16px] font-bold text-white
                       transition-colors hover:bg-accent-clair disabled:opacity-60"
          >
            {enCours ? '…' : 'Je participe'}
          </button>
          <span className="font-mono text-[15px] text-accent-clair">+{defi.xp} XP</span>
        </div>
      )}

      {erreur && <p className="font-mono text-[12px] text-accent">{erreur}</p>}
    </section>
  )
}

/* ---- Une ligne de liste ---- */

export function LigneDefi({ defi }: { defi: Defi }) {
  const a = avancement(defi)
  const sousTitre = defi.reussiLe
    ? 'Réussi'
    : !defi.participe
      ? `${defi.portee === 'collectif' ? 'Collectif · ' : ''}pas encore rejoint`
      : defi.type === 'honneur'
        ? `Sur l'honneur · ${nombre(a.valeur)}/${nombre(a.cible)} j`
        : `Tu participes · ${nombre(a.valeur)}/${nombre(a.cible)}`

  return (
    <Link
      href={`/defis/${defi.edition}`}
      className="flex min-h-16 items-center gap-3 rounded-bloc px-0.5 transition-colors hover:bg-verre"
    >
      <BadgeDefi badge={defi.badge} taille={44} verrouille={!defi.reussiLe && !defi.participe} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[16px] font-semibold">{defi.titre}</span>
        <span className="truncate text-[13px] text-encre-douce">
          {sousTitre}
          {defi.enCours && !defi.reussiLe ? ` · ${tempsRestant(defi.fin)}` : ''}
        </span>
        {defi.participe && !defi.reussiLe && (
          <span className="block h-1 overflow-hidden rounded-pilule bg-encre/[0.08]">
            <span className="block h-full" style={{ width: `${a.part * 100}%`, background: defi.badge.couleur }} />
          </span>
        )}
      </span>
      <span className="font-mono text-[14px] text-accent-clair">+{defi.xp}</span>
    </Link>
  )
}

export function Pastille({
  couleur,
  children,
}: {
  couleur: string
  children: React.ReactNode
}) {
  return (
    <span
      className="flex h-7 items-center rounded-pilule px-2.5 font-mono text-[12px] uppercase tracking-[0.06em]"
      style={{ color: couleur, background: `${couleur}22` }}
    >
      {children}
    </span>
  )
}
