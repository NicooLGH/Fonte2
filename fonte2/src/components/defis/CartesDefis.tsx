'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { BadgeDefi } from './BadgeDefi'
import {
  avancement,
  libelleObjectif,
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
    <div className="flex flex-col gap-6">
      {une && <CarteUne defi={une} />}

      {autres.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between border-b border-bordure pb-1.5">
            <p className="section-titre">Défis en cours</p>
            <Link
              href="/defis"
              className="font-mono text-[11px] text-accent-2 transition-colors hover:text-encre"
            >
              Tout voir ›
            </Link>
          </div>
          {autres.slice(0, 4).map((d) => (
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
  const nouveau = Date.now() - new Date(defi.debut).getTime() < 3 * 86400000

  function rejoindre() {
    setErreur(null)
    demarrer(async () => {
      const r = await participer(defi.edition, true)
      if (r.erreur) setErreur(r.erreur)
      else vibrer(14)
    })
  }

  return (
    <section
      aria-label="Défi à la une"
      className="entree-page relative overflow-hidden rounded-[20px] border p-4.5"
      style={{
        borderColor: `${c}55`,
        background: `radial-gradient(ellipse 90% 80% at 85% 10%, ${c}33, transparent 60%), rgb(255 255 255 / 0.03)`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Pastille couleur={c}>
          {defi.participe ? 'Tu participes' : nouveau ? 'Nouveau défi' : 'Défi en cours'}
        </Pastille>
        <span className="font-mono text-[11px] text-encre-douce">
          {defi.portee === 'collectif' ? 'collectif · ' : ''}encore{' '}
          {tempsRestant(defi.fin)}
        </span>
      </div>

      <Link href={`/defis/${defi.edition}`} className="mt-3.5 flex items-center gap-3.5">
        <BadgeDefi badge={defi.badge} taille={84} />
        <div className="min-w-0">
          <h2 className="text-[34px] leading-[0.95]">{defi.titre}</h2>
          <p className="mt-1.5 text-[13.5px] leading-snug text-encre-douce">
            {defi.description || `Objectif : ${libelleObjectif(defi.objectif, defi.valeur)}.`}
          </p>
        </div>
      </Link>

      {defi.participe ? (
        <div className="mt-4">
          <div className="flex justify-between font-mono text-[11px] text-encre-douce">
            <span>
              <strong className="font-medium text-encre">{nombre(a.valeur)}</strong> /{' '}
              {nombre(a.cible)}{' '}
              {defi.objectif === 'seance_longue' ? '' : OBJECTIFS[defi.objectif].unite(a.cible)}
              {defi.portee === 'collectif' && ' · tous ensemble'}
            </span>
            <span className="text-accent-2">+{defi.xp} XP</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full" style={{ width: `${a.part * 100}%`, background: c }} />
          </div>
          <Link
            href={`/defis/${defi.edition}`}
            className="mt-3 block text-center font-mono text-[11px] text-accent-2 underline underline-offset-4"
          >
            {defi.type === 'honneur' ? 'Cocher ma journée' : 'Voir le défi'}
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={rejoindre}
            disabled={enCours}
            className="appui h-[50px] flex-1 rounded-bloc bg-accent text-[15px] font-semibold text-white
                       transition-colors hover:bg-accent-clair disabled:opacity-60"
          >
            {enCours ? '…' : 'Je participe'}
          </button>
          <span className="font-display text-[26px] leading-none text-accent-2">
            +{defi.xp}
            <span className="font-mono text-[11px] text-encre-douce"> XP</span>
          </span>
        </div>
      )}

      {erreur && <p className="mt-2 font-mono text-[11px] text-accent">{erreur}</p>}
    </section>
  )
}

/* ---- Une ligne de liste ---- */

export function LigneDefi({ defi }: { defi: Defi }) {
  const a = avancement(defi)
  const sousTitre = defi.reussiLe
    ? 'réussi'
    : !defi.participe
      ? `${defi.portee === 'collectif' ? 'collectif · ' : ''}pas encore rejoint`
      : defi.type === 'honneur'
        ? `sur l'honneur · ${nombre(a.valeur)} / ${nombre(a.cible)} jours cochés`
        : defi.portee === 'collectif'
          ? `collectif · ${nombre(a.valeur)} / ${nombre(a.cible)} ${OBJECTIFS[defi.objectif].unite(a.cible)}`
          : `${nombre(a.valeur)} / ${nombre(a.cible)} ${defi.objectif === 'seance_longue' ? '' : OBJECTIFS[defi.objectif].unite(a.cible)}`

  return (
    <Link
      href={`/defis/${defi.edition}`}
      className="flex items-center gap-3 border-b border-filet py-3 transition-colors last:border-0 hover:bg-verre"
    >
      <BadgeDefi badge={defi.badge} taille={48} verrouille={!defi.reussiLe && !defi.participe} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold">{defi.titre}</span>
          <span className="shrink-0 font-mono text-[11px] text-accent-2">+{defi.xp}</span>
        </div>
        <p className="mt-0.5 font-mono text-[10.5px] text-encre-douce">
          {sousTitre} · {defi.enCours ? `encore ${tempsRestant(defi.fin)}` : 'terminé'}
        </p>
        {defi.participe && !defi.reussiLe && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full"
              style={{ width: `${a.part * 100}%`, background: defi.badge.couleur }}
            />
          </div>
        )}
      </div>
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
      className="rounded-full border px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.08em]"
      style={{ color: couleur, borderColor: `${couleur}66` }}
    >
      {children}
    </span>
  )
}
