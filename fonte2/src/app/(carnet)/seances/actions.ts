'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import { semaineDe } from '@/lib/xp'
import { aujourdhui } from '@/lib/semaine'
import type { Groupe } from '@/types/database'

export type Reponse = { erreur?: string; succes?: string }

async function moi() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/* ============================================================
   Exercices
   ============================================================ */

export async function creerExercice(donnees: FormData): Promise<Reponse> {
  const nom = String(donnees.get('nom') ?? '').trim()
  const objectifBrut = String(donnees.get('objectif') ?? '').trim()
  const groupe = String(donnees.get('groupe') ?? '') as Groupe | ''

  if (nom.length < 2) return { erreur: "Donne un nom à l'exercice." }

  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const { error } = await supabase.from('exercices').insert({
    user_id: user.id,
    name: nom,
    objectif: objectifBrut === '' ? null : Number(objectifBrut),
    groupe: groupe === '' ? null : groupe,
  })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  return { succes: 'Exercice ajouté' }
}

export async function modifierExercice(donnees: FormData): Promise<Reponse> {
  const id = String(donnees.get('id') ?? '')
  const objectifBrut = String(donnees.get('objectif') ?? '').trim()
  const groupe = String(donnees.get('groupe') ?? '') as Groupe | ''

  const { supabase } = await moi()
  const { error } = await supabase
    .from('exercices')
    .update({
      objectif: objectifBrut === '' ? null : Number(objectifBrut),
      groupe: groupe === '' ? null : groupe,
    })
    .eq('id', id)

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  return { succes: 'Exercice mis à jour' }
}

/**
 * Supprimer un exercice efface aussi ses séries. Les séances qui
 * n'en contenaient que celui-là deviennent vides : on les retire
 * pour ne pas laisser de séance sans contenu, qui rapporterait
 * quand même de l'XP.
 */
export async function supprimerExercice(id: string): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const { error } = await supabase.from('exercices').delete().eq('id', id)
  if (error) return { erreur: messageErreur(error.message) }

  const { data: restantes } = await supabase
    .from('seances')
    .select('id, series(id)')
    .eq('user_id', user.id)

  const vides = (restantes ?? [])
    .filter((s) => {
      const series = (s as { series?: unknown[] }).series
      return !series || series.length === 0
    })
    .map((s) => s.id as string)

  if (vides.length) await supabase.from('seances').delete().in('id', vides)

  revalidatePath('/seances')
  return { succes: 'Exercice supprimé' }
}

/* ============================================================
   Séances
   ============================================================ */

export type BlocSaisi = {
  exerciceId: string
  series: { poids: number; reps: number }[]
}

/**
 * Enregistre la séance d'une date donnée.
 *
 * La base impose une séance par jour et par personne : si elle
 * existe déjà, on remplace son contenu au lieu d'en créer une
 * seconde.
 */
export async function enregistrerSeance(
  date: string,
  blocs: BlocSaisi[],
  note: string | null
): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const propres = blocs
    .map((b) => ({
      ...b,
      series: b.series.filter(
        (s) => Number.isFinite(s.poids) && Number.isFinite(s.reps) && s.reps > 0
      ),
    }))
    .filter((b) => b.series.length > 0)

  if (propres.length === 0)
    return { erreur: 'Renseigne au moins une série complète.' }

  const { data: existante } = await supabase
    .from('seances')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()

  let seanceId: string

  if (existante) {
    seanceId = existante.id as string
    const { error } = await supabase
      .from('seances')
      .update({ note })
      .eq('id', seanceId)
    if (error) return { erreur: messageErreur(error.message) }

    await supabase.from('series').delete().eq('seance_id', seanceId)
  } else {
    const { data, error } = await supabase
      .from('seances')
      .insert({
        user_id: user.id,
        date,
        week_key: semaineDe(date),
        note,
      })
      .select('id')
      .single()

    if (error || !data) return { erreur: messageErreur(error?.message) }
    seanceId = data.id as string
  }

  const lignes = propres.flatMap((bloc) =>
    bloc.series.map((serie, i) => ({
      user_id: user.id,
      seance_id: seanceId,
      exercice_id: bloc.exerciceId,
      position: i + 1,
      poids: serie.poids,
      reps: serie.reps,
    }))
  )

  const { error } = await supabase.from('series').insert(lignes)
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  revalidatePath('/')
  return { succes: existante ? 'Séance mise à jour' : 'Séance enregistrée' }
}

export async function supprimerSeance(id: string): Promise<Reponse> {
  const { supabase } = await moi()
  const { error } = await supabase.from('seances').delete().eq('id', id)
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  revalidatePath('/')
  return { succes: 'Séance supprimée' }
}

/* ============================================================
   Modèles de séance
   ============================================================ */

export async function creerModele(
  nom: string,
  entrees: { id: string; alternatives: string[] }[]
): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const propre = nom.trim().slice(0, 40)
  if (propre.length < 2) return { erreur: 'Donne un nom au modèle.' }
  if (entrees.length === 0) return { erreur: 'Choisis au moins un exercice.' }

  const { error } = await supabase.from('modeles').insert({
    user_id: user.id,
    nom: propre,
    exercices: entrees,
  })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  return { succes: 'Modèle créé' }
}

export async function supprimerModele(id: string): Promise<Reponse> {
  const { supabase } = await moi()
  const { error } = await supabase.from('modeles').delete().eq('id', id)
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  return { succes: 'Modèle supprimé' }
}

/**
 * Enregistre une séance faite en direct.
 *
 * Même chemin que la saisie classique, avec la durée en plus.
 * Elle n'est renseignée que pour le mode direct : une séance
 * saisie après coup n'a pas de durée fiable, et mieux vaut ne
 * rien afficher qu'un chiffre inventé.
 */
export async function enregistrerSeanceLive(
  blocs: BlocSaisi[],
  note: string | null,
  dureeSec: number
): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const date = aujourdhui()

  const propres = blocs
    .map((b) => ({
      ...b,
      series: b.series.filter(
        (s) => Number.isFinite(s.poids) && Number.isFinite(s.reps) && s.reps > 0
      ),
    }))
    .filter((b) => b.series.length > 0)

  if (propres.length === 0)
    return { erreur: 'Aucune série complète à enregistrer.' }

  const { data: existante } = await supabase
    .from('seances')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()

  let seanceId: string

  if (existante) {
    seanceId = existante.id as string
    await supabase
      .from('seances')
      .update({ note, duree_sec: dureeSec })
      .eq('id', seanceId)
    await supabase.from('series').delete().eq('seance_id', seanceId)
  } else {
    const { data, error } = await supabase
      .from('seances')
      .insert({
        user_id: user.id,
        date,
        week_key: semaineDe(date),
        note,
        duree_sec: dureeSec,
      })
      .select('id')
      .single()

    if (error || !data) return { erreur: messageErreur(error?.message) }
    seanceId = data.id as string
  }

  const lignes = propres.flatMap((bloc) =>
    bloc.series.map((serie, i) => ({
      user_id: user.id,
      seance_id: seanceId,
      exercice_id: bloc.exerciceId,
      position: i + 1,
      poids: serie.poids,
      reps: serie.reps,
    }))
  )

  const { error } = await supabase.from('series').insert(lignes)
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  revalidatePath('/')
  return { succes: 'Séance enregistrée' }
}
