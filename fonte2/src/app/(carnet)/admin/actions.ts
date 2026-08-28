'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'

export type Reponse = { erreur?: string; succes?: string }

export type NouvelleAnnonce = {
  titre: string
  corps: string
  ton: 'info' | 'succes' | 'alerte'
  jours: number
  notifier: boolean
  retirable: boolean
  epinglee: boolean
  couleur: string | null
  icone: string | null
  lienTexte: string | null
  lienUrl: string | null
}

/**
 * Publication d'une annonce.
 *
 * Le contrôle du rôle est fait en base, dans `publier_annonce` :
 * afficher ou masquer la page ne protège rien, seule la fonction
 * décide.
 */
export async function publierAnnonce(a: NouvelleAnnonce): Promise<Reponse> {
  if (a.titre.trim().length < 3 || a.corps.trim().length < 3)
    return { erreur: 'Titre et message obligatoires.' }

  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('publier_annonce', {
    p_titre: a.titre.trim(),
    p_corps: a.corps.trim(),
    p_ton: a.ton,
    p_jours: a.jours,
    p_notifier: a.notifier,
    p_retirable: a.retirable,
    p_epinglee: a.epinglee,
    p_couleur: a.couleur,
    p_icone: a.icone,
    p_lien_texte: a.lienTexte,
    p_lien_url: a.lienUrl,
  })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/', 'layout')
  return { succes: 'Annonce publiée' }
}

export async function retirerAnnonce(id: string): Promise<Reponse> {
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('retirer_annonce', { p_id: id })
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/', 'layout')
  return { succes: 'Annonce retirée' }
}

export async function diffuserNotification(
  titre: string,
  corps: string
): Promise<Reponse> {
  if (titre.trim().length < 3) return { erreur: 'Donne un titre.' }

  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('diffuser_notification', {
    titre: titre.trim(),
    corps: corps.trim(),
  })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/', 'layout')
  const n = (data as { envoyees?: number } | null)?.envoyees ?? 0
  return { succes: `${n} notification${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''}` }
}
