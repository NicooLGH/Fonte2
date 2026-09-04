'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Modale } from '@/components/ui/Modale'

/* ============================================================
   Navigation
   ============================================================
   Barre haute sur grand écran, barre basse sur téléphone : le
   pouce atteint mieux le bas.

   La barre basse ne tient que quatre entrées plus le bouton
   central. « Plus » regroupe donc ce qui n'y rentre pas — sans
   lui, Suivi et Analyse deviendraient inaccessibles.
   ============================================================ */

type Entree = { href: string; libelle: string; ico: string }

const ONGLETS: Entree[] = [
  { href: '/', libelle: 'Accueil', ico: '🏠' },
  { href: '/seances', libelle: 'Séances', ico: '🏋️' },
  { href: '/suivi', libelle: 'Suivi', ico: '⚖️' },
  { href: '/analyse', libelle: 'Analyse', ico: '📊' },
  { href: '/amis', libelle: 'Amis', ico: '👥' },
]

const ENGRENAGE = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

/* ============================================================
   Barre haute — grand écran
   ============================================================ */

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
                 rounded-full border border-bordure bg-fond/85 px-5 py-2.5
                 backdrop-blur md:flex"
    >
      <Link href="/" className="shrink-0 font-display text-2xl tracking-wide">
        FONTE<span className="text-accent">.</span>
      </Link>

      <nav className="flex flex-1 justify-center gap-1">
        {ONGLETS.map((e) => {
          const actif = estActif(chemin, e.href)
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={actif ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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
          className="flex h-9 w-9 items-center justify-center rounded-full
                     border border-bordure bg-verre text-base transition-colors
                     hover:border-accent-2/60"
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
          {ENGRENAGE}
        </Link>
      </div>
    </header>
  )
}

/* ============================================================
   Barre basse — téléphone
   ============================================================ */

export function BarreBasse({
  avatar,
  notifications,
  aDesModeles,
}: {
  avatar: string
  notifications: React.ReactNode
  aDesModeles: boolean
}) {
  const chemin = usePathname()
  const [plus, setPlus] = useState(false)
  const [action, setAction] = useState(false)

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
          {ENGRENAGE}
        </Link>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around
                   gap-1 rounded-3xl border border-bordure bg-fond/90 px-2 py-2
                   backdrop-blur md:hidden"
      >
        <LienBas
          entree={ONGLETS[0]}
          actif={estActif(chemin, '/')}
        />
        <BoutonBas
          ico="☰"
          libelle="Plus"
          actif={['/suivi', '/analyse', '/amis'].some((h) =>
            chemin.startsWith(h)
          )}
          onClick={() => setPlus(true)}
        />

        <button
          type="button"
          onClick={() => setAction(true)}
          aria-label="Ajouter"
          className="mx-1 flex h-[52px] w-[52px] shrink-0 items-center justify-center
                     rounded-full bg-accent text-3xl font-light leading-none text-white
                     shadow-lg shadow-accent/40 transition-transform active:scale-95"
        >
          +
        </button>

        <LienBas entree={ONGLETS[1]} actif={estActif(chemin, '/seances')} />
        <LienBas
          entree={{ href: '/profil', libelle: 'Profil', ico: avatar }}
          actif={estActif(chemin, '/profil')}
        />
      </nav>

      <MenuPlus ouvert={plus} onFermer={() => setPlus(false)} />
      <ActionRapide
        ouvert={action}
        onFermer={() => setAction(false)}
        aDesModeles={aDesModeles}
      />
    </>
  )
}

/* ============================================================
   Menu « Plus »
   ============================================================ */

function MenuPlus({
  ouvert,
  onFermer,
}: {
  ouvert: boolean
  onFermer: () => void
}) {
  const router = useRouter()

  const entrees = [
    { href: '/suivi', ico: '⚖️', titre: 'Suivi hebdo', sous: 'Poids, calories et mensurations' },
    { href: '/analyse', ico: '📊', titre: 'Analyse', sous: 'Équilibre musculaire et assiduité' },
    { href: '/amis', ico: '👥', titre: 'Amis', sous: 'Fil, demandes et recherche' },
    { href: '/profil', ico: '👤', titre: 'Mon profil', sous: 'Niveau, statistiques et records' },
    { href: '/reglages', ico: '⚙️', titre: 'Réglages', sous: 'Compte, apparence, confidentialité' },
  ]

  return (
    <Modale titre="Naviguer" ouverte={ouvert} onFermer={onFermer}>
      <div className="flex flex-col gap-2.5">
        {entrees.map((e) => (
          <Choix
            key={e.href}
            ico={e.ico}
            titre={e.titre}
            sous={e.sous}
            onClick={() => {
              onFermer()
              router.push(e.href)
            }}
          />
        ))}
      </div>
    </Modale>
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
          ico="▶"
          titre={aDesModeles ? 'Séance en direct' : 'Créer un modèle'}
          sous={
            aDesModeles
              ? 'Le carnet te guide exercice par exercice'
              : 'Nécessaire pour lancer une séance en direct'
          }
          onClick={() => aller(aDesModeles ? '/live' : '/seances')}
        />
        <Choix
          ico="✏️"
          titre="Saisir une séance"
          sous="Sans mode direct, après coup"
          onClick={() => aller('/seances')}
        />
        <Choix
          ico="⚖️"
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

function estActif(chemin: string, href: string): boolean {
  return href === '/' ? chemin === '/' : chemin.startsWith(href)
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

function BoutonBas({
  ico,
  libelle,
  actif,
  onClick,
}: {
  ico: string
  libelle: string
  actif: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-1.5 transition-colors ${
        actif ? 'text-accent' : 'text-encre-douce'
      }`}
    >
      <span className="text-lg leading-none">{ico}</span>
      <span className="text-[10px] font-semibold">{libelle}</span>
    </button>
  )
}

function Choix({
  ico,
  titre,
  sous,
  onClick,
}: {
  ico: string
  titre: string
  sous: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-bordure
                 bg-verre px-5 py-4 text-left transition-colors
                 hover:border-accent hover:bg-verre-fort"
    >
      <span className="shrink-0 text-2xl leading-none">{ico}</span>
      <span className="min-w-0">
        <span className="block font-semibold">{titre}</span>
        <span className="mt-0.5 block font-mono text-[10.5px] text-encre-douce">
          {sous}
        </span>
      </span>
    </button>
  )
}
