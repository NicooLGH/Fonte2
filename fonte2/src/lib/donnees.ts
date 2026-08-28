import 'server-only'

import { creerClientServeur } from './supabase/server'
import type { Groupe } from '@/types/database'
import type { Releve } from './xp'
import type { Exercice, SeanceComplete } from './carnet'
import type { ReleveComplet, Objectifs, CleSuivi } from './suivi'

/* ============================================================
   Lecture du carnet — serveur uniquement
   ============================================================
   La première ligne, `import 'server-only'`, est un garde-fou :
   si un composant navigateur importe ce fichier par mégarde, la
   compilation échoue avec un message clair au lieu d'embarquer
   du code serveur dans le navigateur.

   Les types et constantes partagés sont dans `carnet.ts`.
   ============================================================ */

export async function chargerExercices(): Promise<Exercice[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('exercices')
    .select('id, name, objectif, groupe')
    .order('name')

  return (data ?? []).map((e) => ({
    id: e.id as string,
    nom: e.name as string,
    objectif: e.objectif === null ? null : Number(e.objectif),
    groupe: (e.groupe as Groupe | null) ?? null,
  }))
}

/**
 * Séances avec leurs séries.
 *
 * Deux requêtes plutôt qu'une jointure : la base renverrait une
 * ligne par série, en répétant les colonnes de la séance autant
 * de fois qu'elle en compte.
 */
export async function chargerSeances(): Promise<SeanceComplete[]> {
  const supabase = await creerClientServeur()

  const { data: lignesSeances } = await supabase
    .from('seances')
    .select('id, date, week_key, note, duree_sec')
    .order('date', { ascending: false })

  const seances = lignesSeances ?? []
  if (seances.length === 0) return []

  const { data: lignesSeries } = await supabase
    .from('series')
    .select('seance_id, exercice_id, position, poids, reps')
    .in(
      'seance_id',
      seances.map((s) => s.id as string)
    )
    .order('position')

  const parSeance = new Map<
    string,
    Map<string, { poids: number; reps: number }[]>
  >()

  for (const ligne of lignesSeries ?? []) {
    const idSeance = ligne.seance_id as string
    const idExo = ligne.exercice_id as string
    if (!parSeance.has(idSeance)) parSeance.set(idSeance, new Map())
    const blocs = parSeance.get(idSeance)!
    if (!blocs.has(idExo)) blocs.set(idExo, [])
    blocs.get(idExo)!.push({
      poids: Number(ligne.poids),
      reps: Number(ligne.reps),
    })
  }

  return seances.map((s) => ({
    id: s.id as string,
    date: s.date as string,
    semaine: s.week_key as string,
    note: (s.note as string | null) ?? null,
    dureeSec: (s.duree_sec as number | null) ?? null,
    blocs: [...(parSeance.get(s.id as string) ?? new Map())].map(
      ([exerciceId, series]) => ({ exerciceId, series })
    ),
  }))
}

export async function chargerReleves(): Promise<Releve[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('suivi')
    .select('id, week_key, bonus_dimanche')

  return (data ?? []).map((r) => ({
    id: r.id as string,
    semaine: r.week_key as string,
    bonusDimanche: Boolean(r.bonus_dimanche),
  }))
}

/* ============================================================
   Relevés hebdomadaires et objectifs
   ============================================================ */


const CLES: CleSuivi[] = [
  'poids',
  'calories',
  'pec',
  'bras',
  'epaule',
  'jambe',
  'taille',
]

/** Convertit `null` et les chaînes en nombre ou null. */
function nombreOuNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function chargerSuiviComplet(): Promise<ReleveComplet[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('suivi')
    .select(
      'id, date, week_key, poids, calories, pec, bras, epaule, jambe, taille, bonus_dimanche, note, photo_path'
    )
    .order('week_key', { ascending: false })

  return (data ?? []).map((r) => {
    const ligne = r as Record<string, unknown>
    const valeurs = Object.fromEntries(
      CLES.map((c) => [c, nombreOuNull(ligne[c])])
    ) as { [K in CleSuivi]: number | null }

    return {
      id: ligne.id as string,
      date: ligne.date as string,
      semaine: ligne.week_key as string,
      bonusDimanche: Boolean(ligne.bonus_dimanche),
      note: (ligne.note as string | null) ?? null,
      aPhoto: Boolean(ligne.photo_path),
      ...valeurs,
    }
  })
}

/**
 * Objectifs.
 *
 * La colonne `mensu` porte historiquement l'ensemble des cibles,
 * poids compris : on la lit telle quelle plutôt que de migrer
 * une structure que l'ancien carnet utilise encore.
 */
export async function chargerObjectifs(): Promise<Objectifs> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('objectifs')
    .select('mensu, suivi')
    .maybeSingle()

  if (!data) return {}

  const mensu = (data.mensu ?? {}) as Record<string, unknown>
  const suivi = (data.suivi ?? {}) as Record<string, unknown>

  const objectifs: Objectifs = {}
  for (const cle of CLES) {
    if (cle === 'calories') continue
    const v = nombreOuNull(mensu[cle] ?? suivi[cle])
    if (v !== null) objectifs[cle] = v
  }
  return objectifs
}
