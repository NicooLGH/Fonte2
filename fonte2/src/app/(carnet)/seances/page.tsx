import { chargerExercices, chargerSeances } from '@/lib/donnees'
import { Exercices } from '@/components/seances/Exercices'
import { Seances } from '@/components/seances/Seances'

/**
 * Page du carnet d'entraînement.
 *
 * Les données sont chargées ici, sur le serveur, puis passées
 * aux deux blocs. Ils sont marqués client parce qu'ils ouvrent
 * des modales et gèrent une saisie.
 */
export default async function PageSeances() {
  const [exercices, seances] = await Promise.all([
    chargerExercices(),
    chargerSeances(),
  ])

  return (
    <div className="flex flex-col gap-6 py-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Carnet
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Séances</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Exercices exercices={exercices} />
        <Seances seances={seances} exercices={exercices} />
      </div>
    </div>
  )
}
