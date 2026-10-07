'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import { SEAU_STORIES } from '@/lib/stories'

/* ============================================================
   Stories — actions
   ============================================================
   Toutes les règles sont en base (fonte-stories.sql) : ces
   fonctions ne font que transmettre.
   ============================================================ */

type Reponse = { erreur?: string; succes?: string }

const TYPES = ['seance', 'record', 'niveau', 'aucune']
const MOTIFS = ['inapproprie', 'harcelement', 'spam', 'autre']
const SIGNES = ['💪', '🔥', '👏', '🚀']
const UUID = /^[0-9a-f-]{36}$/

export async function publierStory(chemin: string, type: string, position: number): Promise<Reponse> {
  if (!TYPES.includes(type)) return { erreur: 'Étiquette inconnue.' }
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erreur: 'Session expirée.' }

  const { error } = await supabase.rpc('publier_story', {
    p_chemin: chemin,
    p_type: type,
    p_position: Number.isFinite(position) ? position : 0.62,
  })
  if (error) {
    // La photo envoyée ne sert plus : on la retire du seau.
    if (chemin.startsWith(`${user.id}/`)) await supabase.storage.from(SEAU_STORIES).remove([chemin])
    return { erreur: messageErreur(error.message) }
  }

  // Ménage : les photos de mes stories expirées quittent le seau.
  const { data: anciennes } = await supabase.rpc('mes_stories_expirees')
  if (Array.isArray(anciennes) && anciennes.length) {
    await supabase.storage
      .from(SEAU_STORIES)
      .remove((anciennes as string[]).filter((c) => c.startsWith(`${user.id}/`)))
  }

  revalidatePath('/')
  return { succes: 'Story publiée' }
}

export async function voirStory(id: string): Promise<void> {
  if (!UUID.test(id)) return
  const supabase = await creerClientServeur()
  await supabase.rpc('voir_story', { p_story: id })
}

export async function reagirStory(id: string, signe: string | null): Promise<Reponse> {
  if (!UUID.test(id)) return { erreur: 'Story introuvable.' }
  if (signe !== null && !SIGNES.includes(signe)) return { erreur: 'Réaction inconnue.' }
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('reagir_story', { p_story: id, p_signe: signe })
  if (error) return { erreur: messageErreur(error.message) }
  return {}
}

export async function masquerStory(id: string): Promise<Reponse> {
  if (!UUID.test(id)) return { erreur: 'Story introuvable.' }
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('masquer_story', { p_story: id })
  if (error) return { erreur: messageErreur(error.message) }
  revalidatePath('/')
  return { succes: 'Story masquée' }
}

export async function signalerStory(id: string, motif: string): Promise<Reponse> {
  if (!UUID.test(id)) return { erreur: 'Story introuvable.' }
  if (!MOTIFS.includes(motif)) return { erreur: 'Choisis un motif.' }
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('signaler_story', { p_story: id, p_motif: motif })
  if (error) return { erreur: messageErreur(error.message) }
  revalidatePath('/')
  return { succes: 'Merci. La story est masquée pour toi.' }
}

export async function supprimerStory(id: string): Promise<Reponse> {
  if (!UUID.test(id)) return { erreur: 'Story introuvable.' }
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erreur: 'Session expirée.' }

  const { data: chemin, error } = await supabase.rpc('supprimer_story', { p_story: id })
  if (error) return { erreur: messageErreur(error.message) }
  if (typeof chemin === 'string' && chemin.startsWith(`${user.id}/`))
    await supabase.storage.from(SEAU_STORIES).remove([chemin])

  revalidatePath('/')
  return { succes: 'Story supprimée' }
}
