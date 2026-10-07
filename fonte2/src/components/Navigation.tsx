'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Modale } from '@/components/ui/Modale'
import { AvatarCadre } from '@/components/AvatarCadre'
import {
  IconeAccueil,
  IconeSeances,
  IconeSuivi,
  IconeAnalyse,
  IconeAmis,
  IconePlus,
  IconeReglages,
  IconeAdmin,
  IconeLecture,
  IconeCrayon,
  IconeCardio,
} from '@/components/Icones'

/* ============================================================
   Navigation
   ============================================================
   Barre haute sur grand écran, barre basse sur téléphone : le
   pouce atteint mieux le bas.

   3.0 : une bulle à quatre rubriques (Accueil, Séances, Progrès,
   Amis) et le bouton orange à côté. Le profil s'ouvre depuis
   l'avatar, en haut ; l'administration depuis les réglages.
   ============================================================ */

type Icone = (p: { className?: string }) => React.ReactNode
type Entree = { href: string; libelle: string; Ico: Icone; aussi?: string[] }

/** « Progrès » regroupe le suivi hebdo et l'analyse. */
const ONGLETS: Entree[] = [
  { href: '/', libelle: 'Accueil', Ico: IconeAccueil },
  { href: '/seances', libelle: 'Séances', Ico: IconeSeances },
  { href: '/suivi', libelle: 'Progrès', Ico: IconeAnalyse, aussi: ['/analyse'] },
  { href: '/amis', libelle: 'Amis', Ico: IconeAmis },
]

/** Réservé aux administrateurs, ajouté au bout de la barre. */
const ONGLET_ADMIN: Entree = {
  href: '/admin',
  libelle: 'Admin',
  Ico: IconeAdmin,
}

/* ============================================================
   Barre haute — grand écran
   ============================================================ */

export function BarreHaute({
  avatar,
  cadre,
  pseudo,
  notifications,
  admin,
}: {
  avatar: string
  cadre: string
  pseudo: string
  notifications: React.ReactNode
  admin: boolean
}) {
  const chemin = usePathname()

  return (
    <header
      className="sticky z-40 mx-auto mb-6 hidden max-w-5xl items-center gap-4
                 rounded-pilule bg-verre/85 px-5 py-2 backdrop-blur-md md:flex"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <Link href="/" className="shrink-0 font-display text-2xl tracking-wide">
        FONTE<span className="text-accent">.</span>
      </Link>

      <nav className="flex flex-1 justify-center gap-1">
        {[...ONGLETS, ...(admin ? [ONGLET_ADMIN] : [])].map((e) => {
          const actif = estActif(chemin, e)
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={actif ? 'page' : undefined}
              className={`rounded-pilule px-4 py-2 text-[15px] font-semibold transition-colors ${
                actif ? 'bg-encre text-fond' : 'text-encre-douce hover:text-encre'
              }`}
            >
              {e.libelle}
            </Link>
          )
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        {notifications}
        <Link
          href="/profil"
          title={pseudo}
          aria-label={`Mon profil (${pseudo})`}
          className="ml-1 flex h-10 w-10 items-center justify-center"
        >
          <AvatarCadre avatar={avatar} cadre={cadre} taille={34} />
        </Link>
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="flex h-9 w-9 items-center justify-center rounded-bloc
                     bg-verre text-encre-douce transition-colors
                     hover:bg-verre-fort hover:text-encre"
        >
          <IconeReglages className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  )
}

/* ============================================================
   Barre basse — téléphone
   ============================================================ */

/**
 * Barre du haut, sur téléphone : le logo, la cloche, les
 * réglages et l'avatar, qui mène au profil (3.0 : le profil a
 * quitté la barre basse pour laisser la place à « Progrès »).
 *
 * Flottante, avec un fond translucide et un flou léger : le
 * contenu passe dessous et se devine sur les bords.
 */
export function BarreMobile({
  notifications,
  avatar,
  cadre,
  pseudo,
}: {
  notifications: React.ReactNode
  avatar: string
  cadre: string
  pseudo: string
}) {
  return (
    <header
      className="sticky z-40 mx-3 mb-3 flex items-center justify-between
                 rounded-carte bg-fond/75 px-3 py-2 backdrop-blur-sm md:hidden"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <Link href="/" className="px-1 font-display text-[30px] leading-none tracking-wide">
        FONTE<span className="text-accent">.</span>
      </Link>

      <div className="flex items-center gap-1">
        {notifications}
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="appui flex h-11 w-11 items-center justify-center rounded-bloc
                     text-encre-douce transition-colors hover:text-encre"
        >
          <IconeReglages className="h-[21px] w-[21px]" />
        </Link>
        <Link
          href="/profil"
          aria-label={`Mon profil (${pseudo})`}
          className="appui ml-1 flex h-11 w-11 items-center justify-center"
        >
          <AvatarCadre avatar={avatar} cadre={cadre} taille={36} />
        </Link>
      </div>
    </header>
  )
}

/**
 * Barre basse 3.0 : une bulle avec les quatre rubriques, et le
 * bouton orange à côté pour lancer ou saisir une séance.
 */
export function BarreBasse({ aDesModeles }: { aDesModeles: boolean }) {
  const chemin = usePathname()
  const [action, setAction] = useState(false)

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-4 z-40 flex items-center gap-2.5 md:hidden"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="grid h-14 flex-1 grid-cols-4 items-center rounded-pilule
                     bg-verre/90 px-1.5 shadow-[0_8px_24px_rgb(0_0_0/0.25)] backdrop-blur-md"
        >
          {ONGLETS.map((e) => {
            const actif = estActif(chemin, e)
            const { Ico } = e
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-label={e.libelle}
                aria-current={actif ? 'page' : undefined}
                className={`appui mx-0.5 flex h-11 items-center justify-center rounded-pilule transition-colors ${
                  actif ? 'bg-encre text-fond' : 'text-encre-douce hover:text-encre'
                }`}
              >
                <Ico className="h-[22px] w-[22px]" />
              </Link>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setAction(true)}
          aria-label="Nouvelle séance"
          className="appui flex h-14 w-14 shrink-0 items-center justify-center
                     rounded-full bg-accent text-white shadow-[0_8px_24px_rgb(0_0_0/0.25)]"
        >
          <IconePlus className="h-6 w-6" />
        </button>
      </nav>

      <ActionRapide
        ouvert={action}
        onFermer={() => setAction(false)}
        aDesModeles={aDesModeles}
      />
    </>
  )
}

/* ============================================================
   Bouton central
   ============================================================ */

function ActionRapide({
  ouvert,
  onFermer,
  aDesModeles,
}: {
  ouvert: boolean
  onFermer: () => void
  aDesModeles: boolean
}) {
  const router = useRouter()

  function aller(href: string) {
    onFermer()
    router.push(href)
  }

  return (
    <Modale titre="Que veux-tu faire ?" ouverte={ouvert} onFermer={onFermer}>
      <div className="flex flex-col gap-2.5">
        <Choix
          Ico={IconeLecture}
          titre={aDesModeles ? 'Séance en direct' : 'Créer un modèle'}
          sous={
            aDesModeles
              ? 'Le carnet te guide exercice par exercice'
              : 'Nécessaire pour lancer une séance en direct'
          }
          onClick={() => aller(aDesModeles ? '/live' : '/seances?onglet=modeles')}
        />
        <Choix
          Ico={IconeCrayon}
          titre="Saisir une séance"
          sous="Sans mode direct, après coup"
          onClick={() => aller('/seances?ajout=muscu')}
        />
        <Choix
          Ico={IconeCardio}
          titre="Ajouter du cardio"
          sous="Course, vélo, rameur… +15 XP par jour"
          onClick={() => aller('/seances?ajout=cardio')}
        />
        <Choix
          Ico={IconeSuivi}
          titre="Mon relevé hebdo"
          sous="Poids, calories et mensurations"
          onClick={() => aller('/suivi')}
        />
      </div>
    </Modale>
  )
}

/* ============================================================
   Pièces
   ============================================================ */

function estActif(chemin: string, e: Entree): boolean {
  if (e.href === '/') return chemin === '/'
  return [e.href, ...(e.aussi ?? [])].some((h) => chemin.startsWith(h))
}

function Choix({
  Ico,
  titre,
  sous,
  onClick,
}: {
  Ico: Icone
  titre: string
  sous: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-bloc bg-verre px-5 py-4
                 text-left transition-colors hover:bg-verre-fort"
    >
      <span className="shrink-0 text-encre-douce">
        <Ico className="h-[22px] w-[22px]" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{titre}</span>
        <span className="mt-0.5 block font-mono text-[10.5px] text-encre-douce">
          {sous}
        </span>
      </span>
    </button>
  )
}
