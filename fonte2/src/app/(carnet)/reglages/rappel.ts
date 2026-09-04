'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import { cleSemaine } from '@/lib/semaine'

export type Reponse = { erreur?: string; succes?: string }

async function moi() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function definirJourRappel(jour: number | null): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const { error } = await supabase
    .from('reminder_settings')
    .upsert({ user_id: user.id, day: jour, dismissed_week: null })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/', 'layout')
  return {
    succes: jour === null ? 'Rappel désactivé' : 'Rappel enregistré',
  }
}

/** Écarte le rappel jusqu'à la semaine suivante. */
export async function ecarterRappel(): Promise<void> {
  const { supabase, user } = await moi()
  if (!user) return

  await supabase
    .from('reminder_settings')
    .upsert({ user_id: user.id, dismissed_week: cleSemaine() })

  revalidatePath('/')
}
