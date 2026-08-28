import {
  chargerExercices,
  chargerSeances,
  chargerReleves,
  chargerSuiviComplet,
} from '@/lib/donnees'
import { bilanDisponible, calculerBilan, moisPrecedent } from '@/lib/bilan'
import { BanniereBilan } from '@/components/bilan/Banniere'
import { chargerFil, chargerSignaux, chargerAmis } from '@/lib/donnees-social'
import { repartitionXP, totalXP, calculerNiveau, volumeSeance } from '@/lib/xp'
import { semaineCourante, libelleSemaine } from '@/lib/semaine'
import { creerClientServeur } from '@/lib/supabase/server'
import { Fil } from '@/components/social/Fil'
import { Presence } from '@/components/social/Presence'
import type { Profil } from '@/types/database'

export default async function Accueil() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: brut }, exercices, seances, releves, fil, signaux, amis] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('pseudo, avatar')
        .eq('id', user!.id)
        .maybeSingle(),
      chargerExercices(),
      chargerSeances(),
      chargerReleves(),
      chargerFil(),
      chargerSignaux(),
      chargerAmis(),
    ])

  const profil = brut as Pick<Profil, 'pseudo' | 'avatar'> | null

  // Le bilan n'est calculé que pendant sa fenêtre d'affichage :
  // inutile de charger le suivi complet le reste du mois.
  const bilan = bilanDisponible()
    ? calculerBilan(moisPrecedent(), seances, await chargerSuiviComplet(), exercices)
    : null

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
    { valeur: Math.round(repartition.streak / 10), libelle: "Semaines d'affilée" },
  ]

  return (
    <div className="flex flex-col gap-6 py-4">
      <Presence />

      {bilan && !bilan.vide && <BanniereBilan bilan={bilan} />}

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
              {niveau.xpSuivant - niveau.xp} XP avant le niveau {niveau.niveau + 1}
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

      <Fil
        publications={fil}
        signaux={signaux}
        nbAmis={amis.amis.length}
        actifs={amis.actifsSemaine}
      />
    </div>
  )
}
