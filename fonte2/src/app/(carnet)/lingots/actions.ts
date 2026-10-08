'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'

/**
 * Récupérer le bonus du jour.
 *
 * C'est la base qui décide du montant et qui refuse un second
 * passage le même jour : le téléphone n'envoie rien d'autre que
 * la demande.
 */
export async function recupererBonus(): Promise<{ erreur?: string; montant?: number; solde?: number }> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('recuperer_bonus')
  if (error) return { erreur: messageErreur(error.message) }

  const r = (data ?? {}) as Record<string, unknown>
  revalidatePath('/')
  revalidatePath('/lingots')
  return { montant: Number(r.montant) || 0, solde: Number(r.solde) || 0 }
}
