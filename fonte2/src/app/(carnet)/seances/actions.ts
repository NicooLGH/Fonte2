'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import { semaineDe, type GainXP } from '@/lib/xp'
import { chargerMonXP, chargerXPSeance } from '@/lib/donnees-xp'
import { aujourdhui } from '@/lib/semaine'
import type { Groupe } from '@/types/database'
import { estActivite, DUREE_MAX_MIN, DISTANCE_MAX_KM, JOURS_SAISIE } from '@/lib/cardio'

export type Reponse = { erreur?: string; succes?: string }

/** Réponse du mode direct : l'XP gagnée, pour le récapitulatif. */
export type ReponseLive = Reponse & {
  xp?: { avant: number; apres: number; gains: GainXP[] }
}

/** « · +66 XP » quand le total a augmenté, rien sinon. */
function mentionXP(avant: number, apres: number): string {
  return apres > avant ? ` · +${apres - avant} XP` : ''
}

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
 * Une date acceptable pour une saisie après coup : au format
 * `2026-10-07`, pas dans le futur, pas plus vieille qu'une
 * semaine. Un jour de marge vers l'avant couvre le décalage
 * horaire entre le téléphone et le serveur.
 */
function dateSaisieValide(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const t = Date.parse(iso + 'T12:00:00Z')
  if (Number.isNaN(t)) return false
  const auj = Date.parse(aujourdhui() + 'T12:00:00Z')
  const ecart = (auj - t) / 86400000
  return ecart >= -1 && ecart <= JOURS_SAISIE - 1
}

/**
 * Enregistre une séance saisie après coup.
 *
 * 3.0 : plusieurs séances par jour sont possibles. Sans
 * `seanceId`, c'est une nouvelle séance ; avec, on remplace le
 * contenu de celle-là (modification). La base ne compte l'XP de
 * séance qu'une fois par jour.
 */
export async function enregistrerSeance(
  date: string,
  blocs: BlocSaisi[],
  note: string | null,
  seanceId: string | null = null
): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }
  if (!seanceId && !dateSaisieValide(date))
    return { erreur: 'Choisis un jour de la semaine écoulée.' }

  const propres = blocs
    .map((b) => ({
      ...b,
      series: b.series.filter(
        (s) =>
          Number.isFinite(s.poids) &&
          Number.isFinite(s.reps) &&
          s.reps > 0 &&
          s.reps <= 1000 &&
          s.poids >= 0 &&
          s.poids <= 2000
      ),
    }))
    .filter((b) => b.series.length > 0)

  if (propres.length === 0)
    return { erreur: 'Renseigne au moins une série complète.' }

  const xpAvant = await chargerMonXP()
  const notePropre = note?.trim().slice(0, 280) || null

  let id: string

  if (seanceId) {
    // Modification : la séance doit être la sienne (la règle
    // d'accès de la base le garantit aussi).
    const { data, error } = await supabase
      .from('seances')
      .update({ note: notePropre })
      .eq('id', seanceId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()
    if (error || !data) return { erreur: messageErreur(error?.message) }
    id = data.id as string
    await supabase.from('series').delete().eq('seance_id', id)
  } else {
    const { data, error } = await supabase
      .from('seances')
      .insert({
        user_id: user.id,
        date,
        week_key: semaineDe(date),
        note: notePropre,
      })
      .select('id')
      .single()

    if (error || !data) return { erreur: messageErreur(error?.message) }
    id = data.id as string
  }

  const lignes = propres.flatMap((bloc) =>
    bloc.series.map((serie, i) => ({
      user_id: user.id,
      seance_id: id,
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
  revalidatePath('/profil')
  const xpApres = await chargerMonXP()
  return {
    succes:
      (seanceId ? 'Séance mise à jour' : 'Séance enregistrée') +
      mentionXP(xpAvant, xpApres),
  }
}

export async function supprimerSeance(id: string): Promise<Reponse> {
  const { supabase } = await moi()
  const { error } = await supabase.from('seances').delete().eq('id', id)
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  revalidatePath('/')
  revalidatePath('/profil')
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
 * Même chemin que la saisie, avec la durée en plus.
 * Elle n'est renseignée que pour le mode direct : une séance
 * saisie après coup n'a pas de durée fiable, et mieux vaut ne
 * rien afficher qu'un chiffre inventé.
 */
export async function enregistrerSeanceLive(
  blocs: BlocSaisi[],
  note: string | null,
  dureeSec: number,
  nom: string | null = null
): Promise<ReponseLive> {
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

  const xpAvant = await chargerMonXP()
  const nomPropre = nom?.trim().slice(0, 40) || null

  // 3.0 : une nouvelle séance à chaque fois, même s'il y en a
  // déjà une aujourd'hui. L'XP de séance ne compte qu'une fois
  // par jour, côté base.
  const { data, error: erreurSeance } = await supabase
    .from('seances')
    .insert({
      user_id: user.id,
      date,
      week_key: semaineDe(date),
      note: note?.trim().slice(0, 280) || null,
      duree_sec: Math.max(0, Math.min(Math.round(dureeSec), 86400)),
      nom: nomPropre,
    })
    .select('id')
    .single()

  if (erreurSeance || !data) return { erreur: messageErreur(erreurSeance?.message) }
  const seanceId = data.id as string

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
  revalidatePath('/profil')

  // L'XP est recalculée par la base à cette lecture : les
  // séries viennent d'être écrites, le journal est donc à jour.
  const xp = await chargerXPSeance(seanceId)
  return {
    succes: 'Séance enregistrée',
    xp: xp ? { avant: xpAvant, apres: xp.total, gains: xp.gains } : undefined,
  }
}

/* ============================================================
   Cardio
   ============================================================ */

export async function enregistrerCardio(entree: {
  date: string
  activite: string
  dureeMin: number
  distanceKm: number | null
  note: string | null
}): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  if (!dateSaisieValide(entree.date))
    return { erreur: 'Choisis un jour de la semaine écoulée.' }
  if (!estActivite(entree.activite)) return { erreur: 'Choisis une activité.' }

  const duree = Math.round(Number(entree.dureeMin))
  if (!Number.isFinite(duree) || duree < 1 || duree > DUREE_MAX_MIN)
    return { erreur: 'Indique une durée en minutes.' }

  let distance: number | null = null
  if (entree.distanceKm != null && String(entree.distanceKm) !== '') {
    distance = Math.round(Number(entree.distanceKm) * 100) / 100
    if (!Number.isFinite(distance) || distance <= 0 || distance > DISTANCE_MAX_KM)
      return { erreur: 'La distance ne semble pas juste.' }
  }

  const xpAvant = await chargerMonXP()

  const { error } = await supabase.from('cardio').insert({
    user_id: user.id,
    date: entree.date,
    activite: entree.activite,
    duree_min: duree,
    distance_km: distance,
    note: entree.note?.trim().slice(0, 280) || null,
  })
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  revalidatePath('/')
  revalidatePath('/profil')
  const xpApres = await chargerMonXP()
  return { succes: 'Cardio enregistré' + mentionXP(xpAvant, xpApres) }
}

export async function supprimerCardio(id: string): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const { error } = await supabase.from('cardio').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/seances')
  revalidatePath('/')
  revalidatePath('/profil')
  return { succes: 'Cardio supprimé' }
}

/* ============================================================
   Planning de la semaine
   ============================================================ */

/**
 * Ce qu'on prévoit pour un jour. `null` retire le jour du
 * planning (rien de prévu).
 */
export async function planifierJour(
  jour: number,
  choix:
    | { type: 'modele'; modeleId: string }
    | { type: 'cardio'; activite: string }
    | { type: 'repos' }
    | null
): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }
  if (!Number.isInteger(jour) || jour < 1 || jour > 7) return { erreur: 'Jour inconnu.' }

  if (choix === null) {
    const { error } = await supabase
      .from('planning')
      .delete()
      .eq('user_id', user.id)
      .eq('jour', jour)
    if (error) return { erreur: messageErreur(error.message) }
  } else {
    if (choix.type === 'cardio' && !estActivite(choix.activite))
      return { erreur: 'Choisis une activité.' }

    if (choix.type === 'modele') {
      // Le modèle doit être l'un des siens.
      const { data } = await supabase
        .from('modeles')
        .select('id')
        .eq('id', choix.modeleId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!data) return { erreur: 'Modèle introuvable.' }
    }

    const { error } = await supabase.from('planning').upsert(
      {
        user_id: user.id,
        jour,
        type: choix.type,
        modele_id: choix.type === 'modele' ? choix.modeleId : null,
        activite: choix.type === 'cardio' ? choix.activite : null,
      },
      { onConflict: 'user_id,jour' }
    )
    if (error) return { erreur: messageErreur(error.message) }
  }

  revalidatePath('/seances')
  revalidatePath('/')
  return { succes: 'Planning mis à jour' }
}
