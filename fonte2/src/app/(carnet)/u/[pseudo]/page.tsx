import Link from 'next/link'
import {
  chargerProfilParPseudo,
  chargerEncouragementsEnvoyes,
  chargerHistorique,
  compterSeances,
  chargerNiveauDe,
} from '@/lib/donnees-social'
import { Historique } from '@/components/social/Historique'
import { GrilleBadges } from '@/components/badges/GrilleBadges'
import { chargerBadges } from '@/lib/donnees-xp'
import { chargerBadgesDefis } from '@/lib/donnees-defis'
import type { BadgesDefis } from '@/lib/defis'
import type { EtatBadge } from '@/lib/badges'
import { VueProfil } from '@/components/social/ProfilPublic'
import type { Metadata } from 'next'

/**
 * Profil public.
 *
 * L'adresse est enfin lisible : `/u/maxime` au lieu du
 * `#/u/maxime` de l'ancienne version, qui n'existait que parce
 * qu'un site statique ne sait pas router.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ pseudo: string }>
}): Promise<Metadata> {
  const { pseudo } = await params
  return { title: `${decodeURIComponent(pseudo)} — FONTE` }
}

export default async function ProfilPublicPage({
  params,
}: {
  params: Promise<{ pseudo: string }>
}) {
  const { pseudo } = await params
  const nom = decodeURIComponent(pseudo)

  const [profil, envoyes] = await Promise.all([
    chargerProfilParPseudo(nom),
    chargerEncouragementsEnvoyes(),
  ])

  if (!profil)
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-[44px]">Profil introuvable</h1>
        <p className="text-[16px] text-encre-douce">
          Aucun carnet ne porte le pseudo « {nom} ».
        </p>
        <Link
          href="/amis"
          className="flex h-12 items-center rounded-pilule bg-accent px-6 text-[16px] font-bold text-white"
        >
          Chercher quelqu&apos;un
        </Link>
      </div>
    )

  // L'historique n'est chargé que si la base accepte de le
  // montrer : inutile de le demander pour un profil fermé.
  const [historique, total, badges, defis]: [
    Awaited<ReturnType<typeof chargerHistorique>>,
    number,
    EtatBadge[] | null,
    BadgesDefis | null,
  ] = profil.detail
    ? await Promise.all([
        chargerHistorique(profil.id),
        compterSeances(profil.id),
        chargerBadges(profil.id),
        chargerBadgesDefis(profil.id),
      ])
    : [[], 0, null, null]
  const niveauPublic = await chargerNiveauDe(profil.id)

  return (
    <VueProfil
      profil={profil}
      encouragementEnvoye={envoyes[profil.id] ?? null}
      niveauPublic={niveauPublic}
      nbSeances={profil.detail ? total : undefined}
      badges={
        badges && (
          <GrilleBadges
            etats={badges}
            moi={profil.relation === 'moi'}
            defis={defis}
          />
        )
      }
      historique={
        <Historique
          cible={profil.id}
          initiales={historique}
          total={total}
          moi={profil.relation === 'moi'}
        />
      }
    />
  )
}
