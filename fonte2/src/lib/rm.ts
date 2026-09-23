/* ============================================================
   1RM estimé
   ============================================================
   La charge maximale théorique sur une répétition, déduite d'une
   série. Formule d'Epley : poids × (1 + reps / 30).

   Elle vaut ce qu'elle vaut — c'est une estimation, pas une
   mesure. Elle se dégrade au-delà d'une dizaine de répétitions,
   où la fatigue pèse plus que la force. On l'ignore donc
   au-delà de 12, plutôt que d'afficher un chiffre fantaisiste.
   ============================================================ */

export const REPS_MAX_FIABLE = 12

export function estimer1RM(poids: number, reps: number): number | null {
  if (!Number.isFinite(poids) || !Number.isFinite(reps)) return null
  if (poids <= 0 || reps <= 0) return null
  if (reps > REPS_MAX_FIABLE) return null
  if (reps === 1) return poids

  return Math.round(poids * (1 + reps / 30) * 10) / 10
}

/** Le meilleur 1RM d'un ensemble de séries. */
export function meilleur1RM(
  series: { poids: number; reps: number }[]
): number | null {
  const valeurs = series
    .map((s) => estimer1RM(s.poids, s.reps))
    .filter((v): v is number => v !== null)

  return valeurs.length ? Math.max(...valeurs) : null
}

/**
 * Charge à viser pour un nombre de répétitions donné.
 *
 * L'inverse d'Epley. Utile pour savoir quoi mettre sur la barre
 * quand on change de format de série.
 */
export function chargePour(rm: number, reps: number): number | null {
  if (rm <= 0 || reps <= 0 || reps > REPS_MAX_FIABLE) return null
  return Math.round((rm / (1 + reps / 30)) * 2) / 2
}

/** Écart entre deux estimations, en pourcentage. */
export function progression(avant: number, apres: number): number {
  if (avant <= 0) return 0
  return Math.round(((apres - avant) / avant) * 1000) / 10
}
