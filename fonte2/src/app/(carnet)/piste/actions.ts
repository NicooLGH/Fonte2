'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'

/**
 * Équiper une récompense depuis la piste.
 *
 * Passe par `set_personnalisation`, comme l'écran Apparence : c'est
 * la base qui vérifie que le niveau est atteint. On renvoie la
 * description telle quelle, sinon elle serait effacée.
 */
export async function equiperRecompense(
  type: string,
  cle: string
): Promise<{ erreur?: string }> {
  if (!['teinte', 'motif', 'cadre'].includes(type) || typeof cle !== 'string' || cle.length > 40)
    return { erreur: 'Récompense inconnue.' }

  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erreur: 'Connexion requise.' }

  const { data: p, error: e1 } = await supabase
    .from('profiles')
    .select('bio, banniere, motif')
    .eq('id', user.id)
    .maybeSingle()
  if (e1 || !p) return { erreur: 'Profil introuvable.' }

  const { error } = await supabase.rpc('set_personnalisation', {
    p_bio: (p.bio as string | null) ?? '',
    p_banniere: type === 'teinte' ? cle : ((p.banniere as string | null) ?? 'braise'),
    p_motif: type === 'motif' ? cle : ((p.motif as string | null) ?? 'aucun'),
    p_cadre: type === 'cadre' ? cle : null,
  })
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/piste')
  revalidatePath('/profil')
  return {}
}
