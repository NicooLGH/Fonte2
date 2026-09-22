'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Modale } from '@/components/ui/Modale'
import {
  IconeAccueil,
  IconeSeances,
  IconeSuivi,
  IconeAnalyse,
  IconeAmis,
  IconeProfil,
  IconePlus,
  IconeMenu,
  IconeReglages,
  IconeLecture,
  IconeCrayon,
} from '@/components/Icones'

/* ============================================================
   Navigation
   ============================================================
   Barre haute sur grand écran, barre basse sur téléphone : le
   pouce atteint mieux le bas.

   La barre basse ne tient que quatre entrées plus le bouton
   central. « Plus » regroupe donc ce qui n'y rentre pas — sans
   lui, Suivi et Analyse deviendraient inaccessibles.
   ============================================================ */

type Icone = (p: { className?: string }) => React.ReactNode
type Entree = { href: string; libelle: string; Ico: Icone }

const ONGLETS: Entree[] = [
  { href: '/', libelle: 'Accueil', Ico: IconeAccueil },
  { href: '/seances', libelle: 'Séances', Ico: IconeSeances },
  { href: '/suivi', libelle: 'Suivi', Ico: IconeSuivi },
  { href: '/analyse', libelle: 'Analyse', Ico: IconeAnalyse },
  { href: '/amis', libelle: 'Amis', Ico: IconeAmis },
]

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
      className="sticky z-40 mx-auto mb-6 hidden max-w-5xl items-center gap-4
                 rounded-carte border border-bordure bg-fond/70 px-5 py-2.5
                 backdrop-blur-sm md:flex"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
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
              className={`rounded-bloc px-4 py-2 text-sm font-semibold transition-colors ${
                actif ? 'bg-verre-fort text-encre' : 'text-encre-douce hover:text-encre'
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
          className="flex h-9 w-9 items-center justify-center rounded-bloc
                     bg-verre text-base transition-colors hover:bg-verre-fort"
        >
          {avatar}
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
 * Barre du haut, sur téléphone.
 *
 * Flottante, avec un fond translucide et un flou léger : le
 * contenu passe dessous et se devine sur les bords, ce qui
 * détache la barre de la page au lieu de l'y fondre.
 *
 * Le flou reste discret. Plus prononcé, il transformait le fond
 * en voile laiteux et on ne devinait plus rien derrière — ce qui
 * lui faisait perdre sa raison d'être.
 *
 * La règle « pas de blocs flottants » visait le contenu. La
 * navigation n'en est pas : c'est de l'habillage, qui reste
 * au-dessus pendant que le reste défile.
 *
 * Elle porte la cloche et les réglages, à droite du logo.
 */
export function BarreMobile({
  notifications,
}: {
  notifications: React.ReactNode
}) {
  return (
    <header
      className="sticky z-40 mx-3 mb-3 flex items-center justify-between
                 rounded-carte border border-bordure bg-fond/70 px-4 py-2.5
                 backdrop-blur-sm md:hidden"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <Link href="/" className="font-display text-xl tracking-wide">
        FONTE<span className="text-accent">.</span>
      </Link>

      <div className="flex items-center gap-1">
        {notifications}
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="appui flex h-9 w-9 items-center justify-center rounded-bloc
                     text-encre-douce transition-colors hover:text-encre"
        >
          <IconeReglages className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  )
}

export function BarreBasse({
  aDesModeles,
}: {
  aDesModeles: boolean
}) {
  const chemin = usePathname()
  const [plus, setPlus] = useState(false)
  const [action, setAction] = useState(false)

  return (
    <>
      <nav
        className="fixed inset-x-3 z-40 flex items-center justify-around gap-1
                   rounded-carte border border-bordure bg-fond/70 px-2 py-2
                   backdrop-blur-sm md:hidden"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <LienBas entree={ONGLETS[0]} actif={estActif(chemin, '/')} />
        <BoutonBas
          Ico={IconeMenu}
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
          className="appui mx-1 flex h-12 w-12 shrink-0 items-center justify-center
                     rounded-carte bg-accent text-white"
        >
          <IconePlus className="h-6 w-6" />
        </button>

        <LienBas entree={ONGLETS[1]} actif={estActif(chemin, '/seances')} />
        <LienBas
          entree={{ href: '/profil', libelle: 'Profil', Ico: IconeProfil }}
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
    { href: '/suivi', Ico: IconeSuivi, titre: 'Suivi hebdo', sous: 'Poids, calories et mensurations' },
    { href: '/analyse', Ico: IconeAnalyse, titre: 'Analyse', sous: 'Équilibre musculaire et assiduité' },
    { href: '/amis', Ico: IconeAmis, titre: 'Amis', sous: 'Fil, demandes et recherche' },
    { href: '/profil', Ico: IconeProfil, titre: 'Mon profil', sous: 'Niveau, statistiques et records' },
  ]

  return (
    <Modale titre="Naviguer" ouverte={ouvert} onFermer={onFermer}>
      <div className="flex flex-col gap-2.5">
        {entrees.map((e) => (
          <Choix
            key={e.href}
            Ico={e.Ico}
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
          Ico={IconeLecture}
          titre={aDesModeles ? 'Séance en direct' : 'Créer un modèle'}
          sous={
            aDesModeles
              ? 'Le carnet te guide exercice par exercice'
              : 'Nécessaire pour lancer une séance en direct'
          }
          onClick={() => aller(aDesModeles ? '/live' : '/seances')}
        />
        <Choix
          Ico={IconeCrayon}
          titre="Saisir une séance"
          sous="Sans mode direct, après coup"
          onClick={() => aller('/seances')}
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

function estActif(chemin: string, href: string): boolean {
  return href === '/' ? chemin === '/' : chemin.startsWith(href)
}

function LienBas({ entree, actif }: { entree: Entree; actif: boolean }) {
  const { Ico } = entree
  return (
    <Link
      href={entree.href}
      aria-current={actif ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-1.5 transition-colors ${
        actif ? 'text-encre' : 'text-encre-douce'
      }`}
    >
      <Ico className="h-[21px] w-[21px]" />
      <span className="text-[10px] font-semibold">{entree.libelle}</span>
    </Link>
  )
}

function BoutonBas({
  Ico,
  libelle,
  actif,
  onClick,
}: {
  Ico: Icone
  libelle: string
  actif: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-1.5 transition-colors ${
        actif ? 'text-encre' : 'text-encre-douce'
      }`}
    >
      <Ico className="h-[21px] w-[21px]" />
      <span className="text-[10px] font-semibold">{libelle}</span>
    </button>
  )
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
