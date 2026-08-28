import Link from 'next/link'
import { chargerProfilParPseudo, chargerEncouragementsEnvoyes } from '@/lib/donnees-social'
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
        <h1 className="text-3xl">Profil introuvable</h1>
        <p className="text-sm text-encre-douce">
          Aucun carnet ne porte le pseudo « {nom} ».
        </p>
        <Link
          href="/amis"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          Chercher quelqu&apos;un
        </Link>
      </div>
    )

  return (
    <VueProfil profil={profil} encouragementEnvoye={envoyes[profil.id] ?? null} />
  )
}
