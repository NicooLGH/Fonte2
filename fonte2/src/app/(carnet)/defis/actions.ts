'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'

export type Reponse = { erreur?: string; succes?: string }

const UUID = /^[0-9a-f-]{36}$/i

function rafraichir() {
  revalidatePath('/')
  revalidatePath('/defis')
  revalidatePath('/profil')
}

/** Rejoindre un défi, ou le laisser passer (« Pas cette fois »). */
export async function participer(edition: string, oui: boolean): Promise<Reponse> {
  if (!UUID.test(edition)) return { erreur: 'Défi introuvable.' }
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('defi_participer', { e_id: edition, oui })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: oui ? 'Tu participes. Bonne chance !' : 'Défi mis de côté' }
}

/** Cocher (ou décocher) aujourd'hui, pour un défi sur l'honneur. */
export async function cocherAujourdhui(edition: string, coche: boolean): Promise<Reponse> {
  if (!UUID.test(edition)) return { erreur: 'Défi introuvable.' }
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('defi_cocher', { e_id: edition, coche })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: coche ? "Aujourd'hui est coché" : "Aujourd'hui est décoché" }
}
