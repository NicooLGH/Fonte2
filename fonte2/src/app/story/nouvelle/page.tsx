import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerSeances } from '@/lib/donnees'
import { chargerMonXP } from '@/lib/donnees-xp'
import { chargerStories } from '@/lib/donnees-stories'
import { calculerNiveau, volumeSeance } from '@/lib/xp'
import { Createur, type Apercus } from '@/components/stories/Createur'
import type { TypeEtiquette } from '@/lib/stories'
import Link from 'next/link'

/** Date du jour à Paris, `2026-10-07` : la règle « une par jour » suit ce calendrier. */
function jourParis(d: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d)
}

/**
 * Créer une story. Plein écran, toujours sombre.
 * `?etiquette=seance|record|niveau` présélectionne l'étiquette.
 */
export default async function PageNouvelleStory({
  searchParams,
}: {
  searchParams: Promise<{ etiquette?: string }>
}) {
  const { etiquette } = await searchParams
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const auj = jourParis()
  const hier = jourParis(new Date(Date.now() - 86400000))

  const [stories, seances, xp, { data: rec }] = await Promise.all([
    chargerStories(),
    chargerSeances(),
    chargerMonXP(),
    supabase
      .from('xp_journal')
      .select('libelle, date')
      .eq('user_id', user.id)
      .eq('source', 'record')
      .gte('date', hier)
      .order('date', { ascending: false })
      .limit(1),
  ])

  // Une story par jour : si la mienne est déjà publiée, on la montre.
  const mienne = stories.find((g) => g.moi)
  const dejaPubliee = mienne?.stories.some((s) => jourParis(new Date(s.cree)) === auj)
  if (dejaPubliee) {
    return (
      <main className="sombre flex min-h-dvh flex-col items-center justify-center gap-4 bg-fond px-6 text-center text-encre">
        <p className="font-display text-[44px] leading-none">Déjà publiée</p>
        <p className="max-w-xs text-[16px] leading-relaxed text-encre-douce">
          Une story par jour. La prochaine, ce sera demain.
        </p>
        <Link
          href={`/story?u=${user.id}`}
          className="mt-2 flex h-12 items-center rounded-full bg-accent px-6 text-[16px] font-bold text-white"
        >
          Voir ma story
        </Link>
        <Link href="/" className="h-11 text-[15px] text-encre-douce">
          Retour
        </Link>
      </main>
    )
  }

  const derniere = seances.find((s) => s.date >= hier)
  const ligne = (rec ?? [])[0] as { libelle?: string } | undefined
  const apercus: Apercus = {
    seance: derniere
      ? {
          type: 'seance',
          titre: derniere.nom || 'Séance',
          dureeSec: derniere.dureeSec,
          volume: volumeSeance(derniere),
          records: 0,
        }
      : null,
    record: ligne?.libelle
      ? { type: 'record', titre: ligne.libelle.replace('Record 1RM · ', '') }
      : null,
    niveau: { type: 'niveau', niveau: calculerNiveau(xp).niveau },
  }

  const types: TypeEtiquette[] = ['seance', 'record', 'niveau', 'aucune']
  const typeInitial = types.includes(etiquette as TypeEtiquette) ? (etiquette as TypeEtiquette) : 'seance'

  return <Createur userId={user.id} apercus={apercus} typeInitial={typeInitial} />
}
