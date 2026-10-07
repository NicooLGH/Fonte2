import { chargerExercices, chargerSeances, chargerCardio } from '@/lib/donnees'
import { OngletsProgres } from '@/components/OngletsProgres'
import { nomGroupe } from '@/lib/carnet'
import { volumeSeance } from '@/lib/xp'
import { semaineCourante, cleSemaine } from '@/lib/semaine'
import type { Groupe } from '@/types/database'

/**
 * Analyse : équilibre musculaire, records et assiduité.
 *
 * Tout est calculé ici, sur le serveur, à partir des séances
 * déjà chargées. Pas d'appel supplémentaire à la base.
 */
export default async function PageAnalyse() {
  const [exercices, seances, cardio] = await Promise.all([
    chargerExercices(),
    chargerSeances(),
    chargerCardio(),
  ])

  const groupeDe = new Map(exercices.map((e) => [e.id, e.groupe]))

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

  /* ---- Assiduité (muscu et cardio) ---- */
  const parSemaine = new Map<string, number>()
  for (const s of seances) parSemaine.set(s.semaine, (parSemaine.get(s.semaine) ?? 0) + 1)
  for (const c of cardio) {
    const cle = cleSemaine(new Date(c.date + 'T12:00:00'))
    parSemaine.set(cle, (parSemaine.get(cle) ?? 0) + 1)
  }
  const semainesActives = parSemaine.size
  const volumeTotalTous = seances.reduce((t, s) => t + volumeSeance(s), 0)

  // Carte : une case par semaine de l'année en cours, teintée
  // selon le nombre d'activités.
  const annee = new Date().getFullYear()

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

  const teinte = (i: number, part: number) =>
    part < 10 ? 'bg-encre-douce' : i === 0 ? 'bg-accent' : i < 3 ? 'bg-accent/75' : 'bg-accent/50'

  return (
    <div className="flex flex-col gap-5 py-4">
      <header className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 px-0.5 pt-2">
          <h1 className="titre-page">Progrès</h1>
          <p className="pb-1 font-mono text-[13px] text-encre-douce">4 dernières sem.</p>
        </div>
        <OngletsProgres />
      </header>

      {/* Équilibre musculaire : barres posées sur le fond */}
      <section className="flex flex-col gap-3 px-0.5">
        <p className="section-titre">Équilibre musculaire</p>
        {equilibre.length === 0 ? (
          <p className="text-[15px] text-encre-douce">Aucune séance de muscu sur cette période.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {equilibre.map((g, i) => {
              const part = Math.round((g.volume / volumeTotal) * 100)
              const inconnu = g.cle === 'non_classe'
              return (
                <li
                  key={g.cle}
                  className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-2.5"
                  title={`${Math.round(g.volume).toLocaleString('fr-FR')} kg · ${g.series} série${g.series > 1 ? 's' : ''}`}
                >
                  <span className={`truncate text-[15px] ${inconnu ? 'text-encre-douce' : ''}`}>
                    {inconnu ? 'Autre' : nomGroupe(g.cle as Groupe)}
                  </span>
                  <span className="h-2.5 rounded-pilule bg-encre/[0.06]">
                    <span
                      className={`block h-full rounded-pilule ${inconnu ? 'bg-encre-douce' : teinte(i, part)}`}
                      style={{ width: `${Math.max(4, (g.volume / volumeMax) * 100)}%` }}
                    />
                  </span>
                  <span
                    className={`text-right font-mono text-[13px] ${part < 10 ? 'text-encre-douce' : ''}`}
                  >
                    {part} %
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {equilibre.some((g) => g.cle === 'non_classe') && (
          <p className="text-[13px] leading-relaxed text-encre-douce">
            « Autre » : des exercices sans groupe. Tu peux le choisir dans Séances → Exercices.
          </p>
        )}
      </section>

      {/* Assiduité */}
      <section className="bloc flex flex-col gap-3 p-[18px]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="section-titre">Assiduité {annee}</p>
          <p className="font-display text-[36px] leading-[0.85] text-accent-2">{pourcentage} %</p>
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          role="img"
          aria-label={`${actives} semaines actives sur ${ecoulees} écoulées en ${annee}`}
        >
          {cases.map((c) => (
            <span
              key={c.numero}
              title={
                c.future
                  ? `Semaine ${c.numero} · à venir`
                  : `Semaine ${c.numero} · ${c.seances} activité${c.seances > 1 ? 's' : ''}`
              }
              className={`aspect-square rounded-[3px] ${
                c.future
                  ? 'bg-encre/[0.03]'
                  : c.seances === 0
                    ? 'bg-encre/[0.08]'
                    : c.seances === 1
                      ? 'bg-accent-2/40'
                      : c.seances === 2
                        ? 'bg-accent-2/70'
                        : 'bg-accent-2'
              }`}
            />
          ))}
        </div>
        <p className="text-[13px] text-encre-douce">
          Une case par semaine. Plus elle est bleue, plus tu as fait de séances.
        </p>
      </section>

      {/* Chiffres */}
      <div className="grid grid-cols-3 gap-2 px-0.5">
        <Chiffre valeur={seances.length.toLocaleString('fr-FR')} libelle="séances" />
        <Chiffre valeur={String(semainesActives)} libelle="semaines actives" />
        <Chiffre valeur={tonnes(volumeTotalTous)} libelle="soulevées" />
      </div>
    </div>
  )
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-display text-[38px] leading-[0.9]">{valeur}</p>
      <p className="mt-0.5 text-[13px] text-encre-douce">{libelle}</p>
    </div>
  )
}

/** « 412 t », « 840 kg » */
function tonnes(kg: number) {
  return kg >= 1000
    ? `${Math.round(kg / 1000).toLocaleString('fr-FR')} t`
    : `${Math.round(kg)} kg`
}
