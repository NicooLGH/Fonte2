'use server'

import { creerClientServeur } from '@/lib/supabase/server'
import { chargerMonXP } from '@/lib/donnees-xp'
import { calculerNiveau } from '@/lib/xp'
import type { IdentiteCarte } from '@/lib/carte-seance'

/**
 * Ce que la carte de partage affiche de moi : pseudo, avatar,
 * cadre, teinte, motif et niveau. Lu à l'ouverture de l'éditeur.
 */
export async function chargerIdentiteCarte(): Promise<IdentiteCarte | null> {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: p }, xp] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar, banniere, motif, cadre').eq('id', user.id).maybeSingle(),
    chargerMonXP(),
  ])
  const n = calculerNiveau(xp)
  return {
    pseudo: (p?.pseudo as string) ?? '',
    avatar: (p?.avatar as string | null) ?? '💪',
    cadre: (p?.cadre as string | null) ?? 'aucun',
    teinte: (p?.banniere as string | null) ?? 'braise',
    motif: (p?.motif as string | null) ?? 'aucun',
    niveau: n.niveau,
    rang: n.rang,
  }
}
