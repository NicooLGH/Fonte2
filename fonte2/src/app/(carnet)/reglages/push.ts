'use server'

import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import { envoyerEnAttente } from '@/lib/push-serveur'

export type Reponse = { erreur?: string; succes?: string }

export type PreferencesPush = {
  amis: boolean
  social: boolean
  rappels: boolean
  defis: boolean
  annonces: boolean
  heure: number
}

function propre(t: unknown, max: number): string | null {
  return typeof t === 'string' && t.length > 0 && t.length <= max ? t : null
}

export async function enregistrerAppareil(cle: {
  endpoint: string
  p256dh: string
  auth: string
}): Promise<Reponse> {
  const endpoint = propre(cle?.endpoint, 1000)
  const p256dh = propre(cle?.p256dh, 200)
  const auth = propre(cle?.auth, 100)
  if (!endpoint || !endpoint.startsWith('https://') || !p256dh || !auth)
    return { erreur: 'Abonnement invalide.' }

  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('push_enregistrer', {
    p_endpoint: endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
  })
  if (error) return { erreur: messageErreur(error.message) }
  return { succes: 'Notifications activées sur cet appareil' }
}

export async function retirerAppareil(endpoint: string | null): Promise<Reponse> {
  const propreEndpoint = propre(endpoint, 1000)
  if (propreEndpoint) {
    const supabase = await creerClientServeur()
    const { error } = await supabase.rpc('push_retirer', { p_endpoint: propreEndpoint })
    if (error) return { erreur: messageErreur(error.message) }
  }
  return { succes: 'Notifications coupées sur cet appareil' }
}

export async function definirPreferencesPush(p: PreferencesPush): Promise<Reponse> {
  const heure = Math.round(Number(p?.heure))
  if (!Number.isFinite(heure) || heure < 6 || heure > 22) return { erreur: 'Heure invalide.' }

  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('set_preferences_push', {
    p_amis: p.amis === true,
    p_social: p.social === true,
    p_rappels: p.rappels === true,
    p_defis: p.defis === true,
    p_annonces: p.annonces === true,
    p_heure: heure,
  })
  if (error) return { erreur: messageErreur(error.message) }
  return { succes: 'Préférences enregistrées' }
}

/** Envoie une notification d'essai, tout de suite. */
export async function essayerPush(): Promise<Reponse> {
  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('push_test')
  if (error) return { erreur: messageErreur(error.message) }
  const bilan = await envoyerEnAttente()
  if (bilan.envoyees === 0 && bilan.oubliees > 0)
    return { erreur: "Cet appareil n'est plus joignable. Désactive puis réactive les notifications." }
  return { succes: 'Notification envoyée, elle arrive dans quelques secondes' }
}
