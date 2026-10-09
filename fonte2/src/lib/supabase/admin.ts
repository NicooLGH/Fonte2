import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * Client « administrateur » : il passe outre les règles RLS.
 *
 * Réservé aux tâches programmées (envoi des notifications,
 * nettoyage des stories), appelées par Supabase avec un secret.
 * La clé vient de SUPABASE_SERVICE_ROLE_KEY, qui ne doit JAMAIS
 * porter le préfixe NEXT_PUBLIC_ : elle ne quitte pas le serveur.
 */
export function clientAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !cle) return null
  return createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Vérifie l'en-tête « Authorization: Bearer <TACHES_SECRET> ». */
export function tacheAutorisee(entete: string | null): boolean {
  const secret = process.env.TACHES_SECRET
  if (!secret || secret.length < 24 || !entete) return false
  const attendu = `Bearer ${secret}`
  if (entete.length !== attendu.length) return false
  // Comparaison à temps constant.
  let diff = 0
  for (let i = 0; i < attendu.length; i++) diff |= entete.charCodeAt(i) ^ attendu.charCodeAt(i)
  return diff === 0
}
