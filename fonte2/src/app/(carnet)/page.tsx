import { chargerExercices, chargerSeances, chargerReleves } from '@/lib/donnees'
import { repartitionXP, totalXP, calculerNiveau, volumeSeance } from '@/lib/xp'
import { semaineCourante, libelleSemaine } from '@/lib/semaine'
import { creerClientServeur } from '@/lib/supabase/server'
import type { Profil } from '@/types/database'

/**
 * Accueil.
 *
 * Il affiche pour l'instant le niveau et les statistiques ; le
 * fil d'actualité viendra à la session 5, quand les amis
 * existeront.
 */
export default async function Accueil() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: brut }, exercices, seances, releves] = await Promise.all([
    supabase
      .from('profiles')
      .select('pseudo, avatar')
      .eq('id', user!.id)
      .maybeSingle(),
    chargerExercices(),
    chargerSeances(),
    chargerReleves(),
  ])

  const profil = brut as Pick<Profil, 'pseudo' | 'avatar'> | null

  const repartition = repartitionXP(
    seances,
    releves,
    exercices.map((e) => e.id)
  )
  const niveau = calculerNiveau(totalXP(repartition))

  const semaine = semaineCourante()
  const volumeSemaine = seances
    .filter((s) => s.semaine === semaine)
    .reduce((t, s) => t + volumeSeance(s), 0)

  const semainesSuivies = new Set([
    ...seances.map((s) => s.semaine),
    ...releves.map((r) => r.semaine),
  ]).size

  const stats = [
    { valeur: semainesSuivies, libelle: 'Semaines suivies' },
    { valeur: exercices.length, libelle: 'Exercices suivis' },
    { valeur: Math.round(volumeSemaine), libelle: 'Kg cette semaine' },
    {
      valeur: Math.round(repartition.streak / 10),
      libelle: "Semaines d'affilée",
    },
  ]

  return (
    <div className="flex flex-col gap-6 py-4">
      <section className="rounded-carte border border-bordure bg-verre p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Semaine {libelleSemaine(semaine)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center
                       rounded-full border border-accent/50 bg-verre text-3xl"
          >
            {profil?.avatar ?? '💪'}
          </span>
          <div>
            <h1 className="text-4xl sm:text-5xl">{profil?.pseudo}</h1>
            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-2">
              Niveau {niveau.niveau} · {niveau.rang}
            </p>
          </div>
        </div>

        {/* Progression vers le niveau suivant */}
        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-verre-fort">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${Math.round(niveau.progression * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10.5px] text-encre-douce">
            <span className="text-accent-2">{niveau.xp} XP</span>
            <span>
              {niveau.xpSuivant - niveau.xp} XP avant le niveau{' '}
              {niveau.niveau + 1}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-filet pt-5 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.libelle}>
              <dd className="font-display text-3xl text-accent">{s.valeur}</dd>
              <dt className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-encre-douce">
                {s.libelle}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {seances.length === 0 && (
        <section className="rounded-carte border border-bordure bg-verre p-6 text-center">
          <h2 className="mb-2 text-2xl">Ton carnet est vide</h2>
          <p className="text-sm text-encre-douce">
            Crée un exercice, puis enregistre ta première séance.
          </p>
        </section>
      )}
    </div>
  )
}
