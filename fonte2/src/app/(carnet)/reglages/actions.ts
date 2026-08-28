'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur, validerPseudo } from '@/lib/messages'

export type Reponse = { erreur?: string; succes?: string }

async function moi() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

function rafraichir() {
  revalidatePath('/', 'layout')
}

/**
 * Pseudo.
 *
 * Passe par `set_pseudo` : c'est elle qui garantit l'unicité et
 * la limite d'un changement par mois. Vérifier ici ne sert qu'au
 * confort — la base a le dernier mot.
 */
export async function changerPseudo(donnees: FormData): Promise<Reponse> {
  const pseudo = String(donnees.get('pseudo') ?? '')
    .replace(/\s+/g, ' ')
    .trim()

  const souci = validerPseudo(pseudo)
  if (souci) return { erreur: souci }

  const { supabase } = await moi()
  const { error } = await supabase.rpc('set_pseudo', { new_pseudo: pseudo })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: 'Pseudo mis à jour' }
}

export async function changerAvatar(avatar: string): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: 'Avatar mis à jour' }
}

export async function changerPartageSeances(actif: boolean): Promise<Reponse> {
  const { supabase } = await moi()
  const { error } = await supabase.rpc('set_partage_seances', { actif })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return {
    succes: actif ? 'Tes séances sont visibles' : 'Tes séances sont privées',
  }
}

export async function changerPartagePresence(actif: boolean): Promise<Reponse> {
  const { supabase } = await moi()
  const { error } = await supabase.rpc('set_partage_presence', { actif })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: actif ? 'Ton statut est visible' : 'Ton statut est masqué' }
}

export async function changerMotDePasse(donnees: FormData): Promise<Reponse> {
  const nouveau = String(donnees.get('motDePasse') ?? '')
  if (nouveau.length < 8)
    return { erreur: 'Le mot de passe doit faire au moins 8 caractères.' }

  const { supabase } = await moi()
  const { error } = await supabase.auth.updateUser({ password: nouveau })
  if (error) return { erreur: messageErreur(error.message) }

  return { succes: 'Mot de passe modifié' }
}

/**
 * Suppression du compte.
 *
 * `delete_own_account` efface le compte et, par cascade, tout ce
 * qui s'y rattache : séances, séries, relevés, amitiés. Rien ne
 * subsiste.
 */
export async function supprimerCompte(confirmation: string): Promise<Reponse> {
  if (confirmation.trim().toUpperCase() !== 'SUPPRIMER')
    return { erreur: 'Écris SUPPRIMER pour confirmer.' }

  const { supabase } = await moi()
  const { error } = await supabase.rpc('delete_own_account')
  if (error) return { erreur: messageErreur(error.message) }

  await supabase.auth.signOut()
  redirect('/connexion')
}
