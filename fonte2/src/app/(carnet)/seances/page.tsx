import Link from 'next/link'
import { chargerExercices, chargerSeances, chargerModeles } from '@/lib/donnees'
import { Exercices } from '@/components/seances/Exercices'
import { Modeles } from '@/components/seances/Modeles'
import { Seances } from '@/components/seances/Seances'

export default async function PageSeances() {
  const [exercices, seances, modeles] = await Promise.all([
    chargerExercices(),
    chargerSeances(),
    chargerModeles(),
  ])

  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
            Carnet
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Séances</h1>
        </div>

        {modeles.length > 0 && (
          <Link
            href="/live"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold
                       text-white transition-colors hover:bg-accent-clair"
          >
            ▶ Séance en direct
          </Link>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Exercices exercices={exercices} />
        <Modeles modeles={modeles} exercices={exercices} />
        <Seances seances={seances} exercices={exercices} />
      </div>
    </div>
  )
}
