import { chargerExercices, chargerSeances } from '@/lib/donnees'
import { nomGroupe, icoGroupe } from '@/lib/carnet'
import { volumeSeance } from '@/lib/xp'
import { semaineCourante } from '@/lib/semaine'
import type { Groupe } from '@/types/database'

/**
 * Analyse : équilibre musculaire, records et assiduité.
 *
 * Tout est calculé ici, sur le serveur, à partir des séances
 * déjà chargées. Pas d'appel supplémentaire à la base.
 */
export default async function PageAnalyse() {
  const [exercices, seances] = await Promise.all([
    chargerExercices(),
    chargerSeances(),
  ])

  const groupeDe = new Map(exercices.map((e) => [e.id, e.groupe]))
  const nomDe = new Map(exercices.map((e) => [e.id, e.nom]))

  /* ---- Équilibre musculaire, sur les 4 dernières semaines ---- */
  const limite = new Date()
  limite.setDate(limite.getDate() - 28)
  const isoLimite = limite.toISOString().slice(0, 10)

  const parGroupe = new Map<string, { volume: number; series: number }>()
  for (const seance of seances) {
    if (seance.date < isoLimite) continue
    for (const bloc of seance.blocs) {
      const cle = (groupeDe.get(bloc.exerciceId) ?? 'non_classe') as string
      const actuel = parGroupe.get(cle) ?? { volume: 0, series: 0 }
      for (const serie of bloc.series) {
        actuel.volume += serie.poids * serie.reps
        actuel.series += 1
      }
      parGroupe.set(cle, actuel)
    }
  }

  const equilibre = [...parGroupe.entries()]
    .map(([cle, v]) => ({ cle, ...v }))
    .sort((a, b) => b.volume - a.volume)

  const volumeTotal = equilibre.reduce((t, g) => t + g.volume, 0)
  const volumeMax = Math.max(...equilibre.map((g) => g.volume), 1)

  /* ---- Assiduité ---- */
  const semainesActives = new Set(seances.map((s) => s.semaine)).size
  const volumeTotalTous = seances.reduce((t, s) => t + volumeSeance(s), 0)

  // Carte thermique : une case par semaine de l'année en cours,
  // teintée selon le nombre de séances.
  const annee = new Date().getFullYear()
  const parSemaine = new Map<string, number>()
  for (const s of seances) {
    parSemaine.set(s.semaine, (parSemaine.get(s.semaine) ?? 0) + 1)
  }

  const semaineActuelle = Number(semaineCourante().split('-W')[1])
  const cases = Array.from({ length: 53 }, (_, i) => {
    const cle = `${annee}-W${String(i + 1).padStart(2, '0')}`
    return {
      numero: i + 1,
      seances: parSemaine.get(cle) ?? 0,
      future: i + 1 > semaineActuelle,
    }
  })

  const ecoulees = cases.filter((c) => !c.future).length
  const actives = cases.filter((c) => !c.future && c.seances > 0).length
  const pourcentage = ecoulees ? Math.round((actives / ecoulees) * 100) : 0

  return (
    <div className="flex flex-col gap-6 py-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Ce que disent tes données
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Analyse</h1>
      </header>

      <section className="rounded-carte border border-bordure bg-verre p-5">
        <h2 className="mb-1 text-2xl">Équilibre musculaire</h2>
        <p className="mb-5 text-sm leading-relaxed text-encre-douce">
          Le volume soulevé sur les quatre dernières semaines, réparti par
          groupe. Un déséquilibre n&apos;est pas forcément un défaut : ça dépend
          de ton programme.
        </p>

        {equilibre.length === 0 ? (
          <p className="text-sm italic text-encre-douce">
            Aucune séance sur cette période.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {equilibre.map((g) => {
              const part = Math.round((g.volume / volumeTotal) * 100)
              const inconnu = g.cle === 'non_classe'
              return (
                <li key={g.cle} className={inconnu ? 'opacity-60' : undefined}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">
                      {icoGroupe(inconnu ? null : (g.cle as Groupe))}{' '}
                      {nomGroupe(inconnu ? null : (g.cle as Groupe))}
                    </span>
                    <span className="font-display text-lg text-accent-2">
                      {Math.round(g.volume).toLocaleString('fr-FR')}
                      <span className="ml-1 font-mono text-[10px] text-encre-douce">
                        kg · {part} %
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-verre-fort">
                    <div
                      className={`h-full rounded-full ${inconnu ? 'bg-encre-douce' : 'bg-accent'}`}
                      style={{ width: `${(g.volume / volumeMax) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-encre-douce">
                    {g.series} série{g.series > 1 ? 's' : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        )}

        {equilibre.some((g) => g.cle === 'non_classe') && (
          <p className="mt-4 font-mono text-[10.5px] leading-relaxed text-encre-douce">
            Certains exercices n&apos;ont pas de groupe. Tu peux le définir
            depuis la page Séances.
          </p>
        )}
      </section>

      <section className="rounded-carte border border-bordure bg-verre p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">Assiduité</h2>
          <p className="font-mono text-[11px] text-encre-douce">
            <span className="text-accent-2">{pourcentage} %</span> des semaines
            écoulées en {annee}
          </p>
        </div>

        {/* Une case par semaine, teintée selon le nombre de séances. */}
        <div className="mb-6 flex flex-wrap gap-[3px]">
          {cases.map((c) => (
            <span
              key={c.numero}
              title={
                c.future
                  ? `Semaine ${c.numero} — à venir`
                  : `Semaine ${c.numero} — ${c.seances} séance${c.seances > 1 ? 's' : ''}`
              }
              className={`h-[13px] w-[13px] rounded-[3px] ${
                c.future
                  ? 'bg-verre'
                  : c.seances === 0
                    ? 'bg-verre-fort'
                    : c.seances === 1
                      ? 'bg-accent/35'
                      : c.seances === 2
                        ? 'bg-accent/60'
                        : 'bg-accent'
              }`}
            />
          ))}
        </div>

        <div className="mb-6 flex items-center gap-2 font-mono text-[10px] text-encre-douce">
          <span>Moins</span>
          <span className="h-[11px] w-[11px] rounded-[3px] bg-verre-fort" />
          <span className="h-[11px] w-[11px] rounded-[3px] bg-accent/35" />
          <span className="h-[11px] w-[11px] rounded-[3px] bg-accent/60" />
          <span className="h-[11px] w-[11px] rounded-[3px] bg-accent" />
          <span>Plus</span>
        </div>

          <dl className="grid grid-cols-2 gap-5 border-t border-filet pt-5 sm:grid-cols-4">
            <div>
              <dd className="font-display text-3xl text-accent">
                {seances.length}
              </dd>
              <dt className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-encre-douce">
                Séances au total
              </dt>
            </div>
            <div>
              <dd className="font-display text-3xl text-accent">
                {semainesActives}
              </dd>
              <dt className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-encre-douce">
                Semaines actives
              </dt>
            </div>
            <div className="col-span-2">
              <dd className="font-display text-3xl text-accent">
                {Math.round(volumeTotalTous).toLocaleString('fr-FR')}
              </dd>
              <dt className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-encre-douce">
                Kilos soulevés depuis le début
              </dt>
            </div>
          </dl>
        </section>
    </div>
  )
}
