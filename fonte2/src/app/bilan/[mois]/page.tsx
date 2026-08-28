import { notFound, redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerExercices, chargerSeances, chargerSuiviComplet } from '@/lib/donnees'
import { calculerBilan, lireCleMois, nomMois } from '@/lib/bilan'
import { DerouleBilan } from '@/components/bilan/Deroule'
import type { Profil } from '@/types/database'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mois: string }>
}): Promise<Metadata> {
  const { mois } = await params
  const m = lireCleMois(mois)
  return { title: m ? `Bilan de ${nomMois(m)} — FONTE` : 'Bilan — FONTE' }
}

/**
 * Bilan mensuel.
 *
 * Hors du groupe `(carnet)` : plein écran, sans navigation.
 * L'adresse porte le mois, ce qui permet de revoir un bilan
 * passé ou d'en garder le lien.
 */
export default async function PageBilan({
  params,
}: {
  params: Promise<{ mois: string }>
}) {
  const { mois } = await params
  const m = lireCleMois(mois)
  if (!m) notFound()

  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: brut }, exercices, seances, releves] = await Promise.all([
    supabase
      .from('profiles')
      .select('pseudo, avatar')
      .eq('id', user.id)
      .maybeSingle(),
    chargerExercices(),
    chargerSeances(),
    chargerSuiviComplet(),
  ])

  const profil = brut as Pick<Profil, 'pseudo' | 'avatar'> | null
  const bilan = calculerBilan(m, seances, releves, exercices)

  if (bilan.vide)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl">Rien à raconter</h1>
        <p className="max-w-sm text-sm leading-relaxed text-encre-douce">
          Aucune séance ni relevé en {bilan.nom}. Le bilan apparaîtra dès que ce
          mois-là aura de quoi être résumé.
        </p>
        <a
          href="/"
          className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          Retour au carnet
        </a>
      </main>
    )

  return (
    <DerouleBilan
      bilan={bilan}
      pseudo={profil?.pseudo ?? 'Anonyme'}
      avatar={profil?.avatar ?? '💪'}
    />
  )
}
