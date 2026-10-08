'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import { objet, valeurAvatar, type TypeObjet } from '@/lib/boutique'

/* ============================================================
   Boutique — actions
   ============================================================
   Le téléphone ne fait que demander : prix, solde, tirage et
   possession sont décidés par la base.
   ============================================================ */

type Reponse = { erreur?: string; solde?: number }

function rafraichir() {
  revalidatePath('/boutique')
  revalidatePath('/lingots')
  revalidatePath('/reglages/apparence')
  revalidatePath('/profil')
}

/** Acheter un objet précis. */
export async function acheterObjet(type: string, cle: string): Promise<Reponse> {
  if (!objet(type, cle)) return { erreur: 'Objet inconnu.' }
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('acheter_objet', { p_type: type, p_cle: cle })
  if (error) return { erreur: messageErreur(error.message) }
  rafraichir()
  return { solde: Number((data as Record<string, unknown>)?.solde) || 0 }
}

/** Ouvrir une boîte mystère. */
export async function ouvrirMystere(
  rarete: string
): Promise<Reponse & { type?: TypeObjet; cle?: string; doublon?: boolean; rendu?: number }> {
  if (!['commun', 'rare', 'epique'].includes(rarete)) return { erreur: 'Rareté inconnue.' }
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('ouvrir_mystere', { p_rarete: rarete })
  if (error) return { erreur: messageErreur(error.message) }
  const r = (data ?? {}) as Record<string, unknown>
  rafraichir()
  return {
    type: String(r.type) as TypeObjet,
    cle: String(r.cle),
    doublon: r.doublon === true,
    rendu: Number(r.rendu) || 0,
    solde: Number(r.solde) || 0,
  }
}

/**
 * Équiper un objet possédé. Teinte, motif et cadre passent par
 * `set_personnalisation` ; l'avatar par la table, où un
 * déclencheur vérifie la possession.
 */
export async function equiperObjet(type: string, cle: string): Promise<Reponse> {
  if (!objet(type, cle)) return { erreur: 'Objet inconnu.' }
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erreur: 'Connexion requise.' }

  if (type === 'avatar') {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar: valeurAvatar(cle), updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) return { erreur: messageErreur(error.message) }
  } else {
    const { data: p } = await supabase
      .from('profiles')
      .select('bio, banniere, motif')
      .eq('id', user.id)
      .maybeSingle()
    const { error } = await supabase.rpc('set_personnalisation', {
      p_bio: (p?.bio as string | null) ?? '',
      p_banniere: type === 'teinte' ? cle : ((p?.banniere as string | null) ?? 'braise'),
      p_motif: type === 'motif' ? cle : ((p?.motif as string | null) ?? 'aucun'),
      p_cadre: type === 'cadre' ? cle : null,
    })
    if (error) return { erreur: messageErreur(error.message) }
  }
  rafraichir()
  revalidatePath('/', 'layout')
  return {}
}
