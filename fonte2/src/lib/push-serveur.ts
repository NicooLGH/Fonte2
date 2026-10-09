import 'server-only'

import webpush from 'web-push'
import { clientAdmin } from './supabase/admin'

/* ============================================================
   Envoi des notifications push
   ============================================================
   La base remplit une file ; ici, on la vide. Chaque
   notification est « réservée » par la base avant l'envoi (une
   seule fois, même si deux envois tournent en même temps). Un
   appareil qui n'existe plus (réponse 404 ou 410) est oublié.
   ============================================================ */

type Ligne = {
  file_id: number
  endpoint: string
  p256dh: string
  auth: string
  titre: string
  corps: string
  lien: string
  tag: string
}

let configure = false

function configurer(): boolean {
  if (configure) return true
  const publique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privee = process.env.VAPID_PRIVATE_KEY
  const sujet = process.env.VAPID_SUJET || 'mailto:contact@fonte.app'
  if (!publique || !privee) return false
  webpush.setVapidDetails(sujet, publique, privee)
  configure = true
  return true
}

export async function envoyerEnAttente(): Promise<{ envoyees: number; echecs: number; oubliees: number }> {
  const bilan = { envoyees: 0, echecs: 0, oubliees: 0 }
  const admin = clientAdmin()
  if (!admin || !configurer()) return bilan

  const { data, error } = await admin.rpc('push_reclamer', { n: 200 })
  if (error || !Array.isArray(data)) return bilan

  const perimes: string[] = []
  await Promise.all(
    (data as Ligne[]).map(async (l) => {
      try {
        await webpush.sendNotification(
          { endpoint: l.endpoint, keys: { p256dh: l.p256dh, auth: l.auth } },
          JSON.stringify({ titre: l.titre, corps: l.corps, lien: l.lien, tag: l.tag }),
          { TTL: 60 * 60 * 12, urgency: 'normal' }
        )
        bilan.envoyees++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) perimes.push(l.endpoint)
        else bilan.echecs++
      }
    })
  )

  if (perimes.length) {
    await admin.from('push_abonnements').delete().in('endpoint', perimes)
    bilan.oubliees = perimes.length
  }
  return bilan
}
