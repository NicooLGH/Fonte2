/* ============================================================
   Notifications push — côté appareil
   ============================================================
   Détecte ce que l'appareil sait faire, demande la permission,
   et crée (ou retire) l'abonnement auprès du navigateur. La
   suite (enregistrement en base) passe par les actions serveur.
   ============================================================ */

export type EtatAppareil =
  | 'indisponible' // navigateur sans push
  | 'iphone-installer' // iPhone : il faut d'abord l'ajouter à l'écran d'accueil
  | 'refuse' // l'utilisateur a bloqué les notifications
  | 'inactif'
  | 'actif'

export type CleAbonnement = { endpoint: string; p256dh: string; auth: string }

function estIOS(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1)
}

function estInstallee(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function pushPossible(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function enregistrement(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  const existant = await navigator.serviceWorker.getRegistration()
  if (existant) return existant
  try {
    await navigator.serviceWorker.register('/sw.js')
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

export async function etatAppareil(): Promise<EtatAppareil> {
  if (typeof window === 'undefined') return 'indisponible'
  if (estIOS() && !estInstallee()) return 'iphone-installer'
  if (!pushPossible()) return 'indisponible'
  if (Notification.permission === 'denied') return 'refuse'
  const reg = await enregistrement()
  const abo = reg ? await reg.pushManager.getSubscription() : null
  return abo && Notification.permission === 'granted' ? 'actif' : 'inactif'
}

/** Abonnement actuel de l'appareil (pour le renvoyer au serveur). */
export async function abonnementActuel(): Promise<CleAbonnement | null> {
  if (!pushPossible()) return null
  const reg = await enregistrement()
  const abo = reg ? await reg.pushManager.getSubscription() : null
  return abo ? enCle(abo) : null
}

function enCle(abo: PushSubscription): CleAbonnement | null {
  const j = abo.toJSON()
  if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) return null
  return { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }
}

function cleServeur(base64: string): ArrayBuffer {
  const rembourre = '='.repeat((4 - (base64.length % 4)) % 4)
  const brut = atob((base64 + rembourre).replace(/-/g, '+').replace(/_/g, '/'))
  const tampon = new ArrayBuffer(brut.length)
  const vue = new Uint8Array(tampon)
  for (let i = 0; i < brut.length; i++) vue[i] = brut.charCodeAt(i)
  return tampon
}

/** Demande la permission et crée l'abonnement. */
export async function activerSurAppareil(): Promise<
  { ok: true; cle: CleAbonnement } | { ok: false; erreur: string }
> {
  if (estIOS() && !estInstallee())
    return { ok: false, erreur: "Sur iPhone, ajoute d'abord FONTE à ton écran d'accueil (Partager → Sur l'écran d'accueil)." }
  if (!pushPossible()) return { ok: false, erreur: 'Ce navigateur ne gère pas les notifications.' }

  const publique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publique) return { ok: false, erreur: 'Notifications pas encore configurées sur le serveur.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted')
    return { ok: false, erreur: 'Notifications refusées. Tu peux les autoriser dans les réglages du navigateur.' }

  const reg = await enregistrement()
  if (!reg) return { ok: false, erreur: "Impossible de préparer l'appareil." }

  try {
    let abo = await reg.pushManager.getSubscription()
    if (!abo)
      abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleServeur(publique) })
    const cle = enCle(abo)
    if (!cle) return { ok: false, erreur: "Abonnement incomplet. Réessaie." }
    return { ok: true, cle }
  } catch {
    return { ok: false, erreur: "L'appareil a refusé l'abonnement. Réessaie." }
  }
}

/** Retire l'abonnement du navigateur ; renvoie l'adresse retirée. */
export async function desactiverSurAppareil(): Promise<string | null> {
  if (!pushPossible()) return null
  const reg = await enregistrement()
  const abo = reg ? await reg.pushManager.getSubscription() : null
  if (!abo) return null
  const endpoint = abo.endpoint
  await abo.unsubscribe().catch(() => {})
  return endpoint
}
