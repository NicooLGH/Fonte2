import Link from 'next/link'
import { chargerExercices, chargerSeances, chargerModeles } from '@/lib/donnees'
import { Exercices } from '@/components/seances/Exercices'
import { Modeles } from '@/components/seances/Modeles'
import { Seances } from '@/components/seances/Seances'
import { creerClientServeur } from '@/lib/supabase/server'

export default async function PageSeances() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [exercices, seances, modeles, { data: profil }] = await Promise.all([
    chargerExercices(),
    chargerSeances(),
    chargerModeles(),
    supabase.from('profiles').select('pseudo').eq('id', user!.id).maybeSingle(),
  ])

  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="flex flex-wrap items-center justify-between gap-4
                         border-b border-filet pb-5">
        <h1 className="text-4xl sm:text-5xl">Séances</h1>

        {modeles.length > 0 && (
          <Link
            href="/live"
            className="shrink-0 rounded-bloc bg-accent px-5 py-2.5 text-sm
                       font-semibold text-white transition-colors hover:bg-accent-clair"
          >
            Séance en direct
          </Link>
        )}
      </header>

      {/* Une seule colonne, quelle que soit la largeur.
          La grille à trois colonnes tassait les modèles sur
          téléphone et laissait des vides sur grand écran. */}
      <div className="flex flex-col">
        <Modeles modeles={modeles} exercices={exercices} />
        <Seances
          seances={seances}
          exercices={exercices}
          pseudo={(profil?.pseudo as string) ?? ''}
        />
        <Exercices exercices={exercices} />
      </div>
    </div>
  )
}
