'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import type { NouveauDefi } from '@/lib/defis'

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

/* ============================================================
   Défis
   ============================================================
   Comme pour les annonces, le rôle est vérifié en base dans
   chaque fonction. Les valeurs sont revérifiées là-bas aussi
   (liste fermée pour le badge, bornes pour l'XP…).
   ============================================================ */

export async function enregistrerDefi(
  d: NouveauDefi,
  id: string | null = null
): Promise<Reponse> {
  if (d.titre.trim().length < 3) return { erreur: 'Donne un titre (3 caractères minimum).' }
  if (!(d.valeur > 0)) return { erreur: "L'objectif doit être supérieur à zéro." }
  if (!(d.xp >= 0 && d.xp <= 2000)) return { erreur: "L'XP doit être entre 0 et 2 000." }
  if (d.duree === 'jours' && !(d.dureeJours && d.dureeJours >= 1 && d.dureeJours <= 90))
    return { erreur: 'La durée doit être entre 1 et 90 jours.' }
  if (d.duree === 'dates' && !d.fin) return { erreur: 'Choisis la date de fin.' }

  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('defi_enregistrer', {
    p: {
      titre: d.titre.trim(),
      description: d.description.trim(),
      type: d.type,
      portee: d.portee,
      objectif: d.objectif,
      valeur: d.valeur,
      xp: Math.round(d.xp),
      duree: d.duree,
      duree_jours: d.duree === 'jours' ? d.dureeJours : null,
      debut: d.debut,
      fin: d.duree === 'dates' ? d.fin : null,
      repetition: d.repetition,
      badge: d.badge,
      annonce: d.annonce,
      statut: d.statut,
    },
    p_id: id,
  })
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/', 'layout')
  return {
    succes: id
      ? 'Défi mis à jour'
      : d.statut === 'brouillon'
        ? 'Brouillon enregistré'
        : 'Défi publié',
  }
}

export async function changerStatutDefi(
  id: string,
  statut: 'publie' | 'archive'
): Promise<Reponse> {
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('defi_statut', { d_id: id, s: statut })
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/', 'layout')
  return { succes: statut === 'archive' ? 'Défi archivé' : 'Défi publié' }
}
