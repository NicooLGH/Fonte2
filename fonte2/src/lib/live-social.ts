import { creerClient } from './supabase/client'

/* ============================================================
   Réactions en direct
   ============================================================
   Tes amis voient que tu es en séance, et depuis quand. Jamais
   le contenu : ni le modèle, ni les exercices, ni les charges.

   Les appels passent directement du navigateur à Supabase :
   ils sont fréquents (signal toutes les deux minutes) et ne
   modifient rien qu'une page doive réafficher. Les règles —
   amitié, statut partagé, une minute d'écart — sont vérifiées
   dans la base, pas ici.
   ============================================================ */

export const SIGNES_LIVE = ['💪', '🔥', '👏', '🚀', '😮'] as const
export type SigneLive = (typeof SIGNES_LIVE)[number]

/** Délai entre deux encouragements au même ami, en secondes. */
export const ECART_LIVE = 60

/** Fréquence du signal « toujours en séance ». La base
 *  considère la séance finie après huit minutes sans signal. */
export const SIGNAL_LIVE_MS = 2 * 60 * 1000

export type AmiEnSeance = {
  id: string
  pseudo: string
  avatar: string | null
  depuisSec: number
  attenteSec: number
}

export type EncouragementLive = {
  id: string
  signe: string
  pseudo: string
  date: string
}

type Brut = Record<string, unknown>

export function lireAmisEnSeance(data: unknown): AmiEnSeance[] {
  if (!Array.isArray(data)) return []
  return (data as Brut[]).map((a) => ({
    id: String(a.id ?? ''),
    pseudo: String(a.pseudo ?? ''),
    avatar: typeof a.avatar === 'string' && a.avatar ? a.avatar : null,
    depuisSec: Math.max(0, Number(a.depuis_sec) || 0),
    attenteSec: Math.max(0, Number(a.attente_sec) || 0),
  }))
}

export function lireEncouragement(a: Brut): EncouragementLive {
  return {
    id: String(a.id ?? ''),
    signe: String(a.signe ?? '💪'),
    pseudo: String(a.pseudo ?? a.auteur_pseudo ?? 'Un ami'),
    date: String(a.created_at ?? new Date().toISOString()),
  }
}

/** « depuis 42 min », « depuis 1 h 05 ». */
export function depuisLisible(sec: number): string {
  const min = Math.floor(sec / 60)
  if (min < 1) return "à l'instant"
  if (min < 60) return `depuis ${min} min`
  return `depuis ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

/* ---- Appels, côté navigateur uniquement ---- */

export async function signalerLive(debut: number): Promise<void> {
  try {
    await creerClient().rpc('live_signal', {
      debut: new Date(debut).toISOString(),
    })
  } catch {
    // Réseau de salle capricieux : le prochain signal rattrapera.
  }
}

export async function finirLive(): Promise<void> {
  try {
    await creerClient().rpc('live_fin')
  } catch {
    // Sans réponse, le statut s'efface seul au bout de huit minutes.
  }
}

export async function rechargerAmisEnSeance(): Promise<AmiEnSeance[] | null> {
  const { data, error } = await creerClient().rpc('amis_en_seance')
  if (error) return null
  return lireAmisEnSeance(data)
}

export async function encourager(
  ami: string,
  signe: SigneLive
): Promise<{ erreur?: string }> {
  const { error } = await creerClient().rpc('encourager_live', {
    target: ami,
    signe,
  })
  if (!error) return {}
  const m = error.message
  if (m.includes('par minute') || m.includes('terminée') || m.includes('amis'))
    return { erreur: m }
  return { erreur: "L'encouragement n'est pas parti. Réessaie." }
}
