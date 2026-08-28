'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ============================================================
   Navigation
   ============================================================
   Barre haute sur grand écran, barre basse sur téléphone : le
   pouce atteint mieux le bas. Le composant est marqué client
   parce qu'il a besoin de savoir quelle page est ouverte.
   ============================================================ */

type Entree = { href: string; libelle: string; ico: string }

const ENTREES: Entree[] = [
  { href: '/', libelle: 'Accueil', ico: '🏠' },
  { href: '/seances', libelle: 'Séances', ico: '🏋️' },
  { href: '/suivi', libelle: 'Suivi', ico: '⚖️' },
  { href: '/analyse', libelle: 'Analyse', ico: '📊' },
  { href: '/amis', libelle: 'Amis', ico: '👥' },
]

export function BarreHaute({
  avatar,
  pseudo,
  notifications,
}: {
  avatar: string
  pseudo: string
  notifications: React.ReactNode
}) {
  const chemin = usePathname()

  return (
    <header
      className="sticky top-3 z-40 mx-auto mb-6 hidden max-w-5xl items-center gap-4
                 rounded-full border border-bordure bg-fond/80 px-5 py-2.5
                 backdrop-blur md:flex"
    >
      <Link href="/" className="shrink-0 font-display text-2xl tracking-wide">
        FONTE<span className="text-accent">.</span>
      </Link>

      <nav className="flex flex-1 justify-center gap-1">
        {ENTREES.map((e) => (
          <Lien key={e.href} entree={e} actif={estActif(chemin, e.href)} />
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        {notifications}
        <Link
          href="/profil"
          title={pseudo}
          className="flex h-9 w-9 items-center justify-center rounded-full
                     border border-bordure bg-verre text-base
                     transition-colors hover:border-accent-2/60"
        >
          {avatar}
        </Link>
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="flex h-9 w-9 items-center justify-center rounded-full
                     border border-bordure bg-verre text-encre-douce
                     transition-colors hover:text-encre"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
               className="h-4 w-4" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>
    </header>
  )
}

export function BarreBasse({
  avatar,
  notifications,
}: {
  avatar: string
  notifications: React.ReactNode
}) {
  const chemin = usePathname()

  return (
    <>
      {/* Cloche et réglages en haut : la barre basse n'a de place
          que pour les sections principales. */}
      <div className="fixed right-3 top-3 z-40 flex items-center gap-2 md:hidden">
        {notifications}
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="flex h-9 w-9 items-center justify-center rounded-full border
                     border-bordure bg-fond/90 text-encre-douce backdrop-blur"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
               className="h-4 w-4" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around
                   rounded-3xl border border-bordure bg-fond/90 px-2 py-2
                   backdrop-blur md:hidden"
      >
        {ENTREES.map((e) => (
          <LienBas key={e.href} entree={e} actif={estActif(chemin, e.href)} />
        ))}
        <LienBas
          entree={{ href: '/profil', libelle: 'Profil', ico: avatar }}
          actif={estActif(chemin, '/profil')}
        />
      </nav>
    </>
  )
}

/* ---- Pièces internes ---- */

function estActif(chemin: string, href: string): boolean {
  return href === '/' ? chemin === '/' : chemin.startsWith(href)
}

function Lien({ entree, actif }: { entree: Entree; actif: boolean }) {
  return (
    <Link
      href={entree.href}
      aria-current={actif ? 'page' : undefined}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        actif ? 'bg-encre text-fond' : 'text-encre-douce hover:text-encre'
      }`}
    >
      {entree.libelle}
    </Link>
  )
}

function LienBas({ entree, actif }: { entree: Entree; actif: boolean }) {
  return (
    <Link
      href={entree.href}
      aria-current={actif ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-1.5 transition-colors ${
        actif ? 'text-accent' : 'text-encre-douce'
      }`}
    >
      <span className="text-lg leading-none">{entree.ico}</span>
      <span className="text-[10px] font-semibold">{entree.libelle}</span>
    </Link>
  )
}
