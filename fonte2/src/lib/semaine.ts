/**
 * Semaines ISO.
 *
 * Toute la logique du carnet repose sur cette notion : une
 * semaine va du lundi au dimanche, et sert de clé commune aux
 * séances, aux relevés et aux classements. Le format `2026-W35`
 * est celui déjà utilisé en base, il ne change pas.
 */

/** Clé ISO de la semaine contenant cette date. */
export function cleSemaine(date: Date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  // Le jeudi de la semaine détermine son numéro et son année,
  // ce qui règle le cas des semaines à cheval sur deux années.
  const jour = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - jour)

  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const numero = Math.ceil(
    ((d.getTime() - debutAnnee.getTime()) / 86400000 + 1) / 7
  )

  return `${d.getUTCFullYear()}-W${String(numero).padStart(2, '0')}`
}

/** Raccourci pour la semaine en cours. */
export function semaineCourante(): string {
  return cleSemaine(new Date())
}

/** « S35 · 2026 » */
export function libelleSemaine(cle: string): string {
  const [annee, sem] = cle.split('-W')
  return `S${parseInt(sem, 10)} · ${annee}`
}

/** « S35 » */
export function libelleCourt(cle: string): string {
  return `S${parseInt(cle.split('-W')[1], 10)}`
}

/** Date du jour au format `2026-08-27`, en heure locale. */
export function aujourdhui(): string {
  const d = new Date()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

/** Trie du plus ancien au plus récent selon la clé de semaine. */
export function parSemaine<T extends { weekKey: string }>(liste: T[]): T[] {
  return [...liste].sort((a, b) => a.weekKey.localeCompare(b.weekKey))
}
