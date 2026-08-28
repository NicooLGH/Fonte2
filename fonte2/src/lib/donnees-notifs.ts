import 'server-only'

import { creerClientServeur } from './supabase/server'
import type { Notification, Annonce } from './notifs'

export type { Notification, Annonce }

/* ============================================================
   Notifications et annonces — serveur uniquement
   ============================================================ */

type Brut = Record<string, unknown>

const txt = (v: unknown) => (typeof v === 'string' ? v : '')
const txtOuNull = (v: unknown) =>
  typeof v === 'string' && v !== '' ? v : null

export async function chargerNotifications(): Promise<Notification[]> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('mes_notifications')
  if (error || !data) return []

  return (data as Brut[]).map((n) => ({
    id: txt(n.id),
    type: txt(n.type),
    titre: txt(n.titre),
    corps: txtOuNull(n.corps),
    lue: Boolean(n.lue),
    date: txt(n.date),
  }))
}

function versAnnonce(a: Brut): Annonce {
  return {
    id: txt(a.id),
    titre: txt(a.titre),
    corps: txt(a.corps),
    ton: (txt(a.ton) || 'info') as Annonce['ton'],
    active: a.active !== false,
    retirable: a.retirable !== false,
    epinglee: Boolean(a.epinglee),
    couleur: txtOuNull(a.couleur),
    icone: txtOuNull(a.icone),
    lienTexte: txtOuNull(a.lien_texte),
    lienUrl: txtOuNull(a.lien_url),
    expireLe: txtOuNull(a.expire_le),
    creeLe: txt(a.created_at),
  }
}

/** Annonces visibles : la politique de lecture filtre déjà les
 *  retirées et les expirées. */
export async function chargerAnnonces(): Promise<Annonce[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? [])
    .map((a) => versAnnonce(a as Brut))
    .sort((x, y) => Number(y.epinglee) - Number(x.epinglee))
}

/** Toutes les annonces, y compris retirées — administrateur. */
export async function chargerToutesAnnonces(): Promise<Annonce[]> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('toutes_annonces')
  if (error || !data) return []
  return (data as Brut[]).map(versAnnonce)
}

export async function suisJeAdmin(): Promise<boolean> {
  const supabase = await creerClientServeur()
  const { data } = await supabase.rpc('est_admin')
  return Boolean(data)
}
