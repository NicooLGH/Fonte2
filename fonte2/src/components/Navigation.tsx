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
]

export function BarreHaute({
  avatar,
  pseudo,
}: {
  avatar: string
  pseudo: string
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

      <Link
        href="/profil"
        title={pseudo}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                   border border-bordure bg-verre text-base
                   transition-colors hover:border-accent-2/60"
      >
        {avatar}
      </Link>
    </header>
  )
}

export function BarreBasse({ avatar }: { avatar: string }) {
  const chemin = usePathname()

  return (
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
