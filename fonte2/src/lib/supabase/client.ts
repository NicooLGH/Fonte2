import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase pour les composants qui s'exécutent dans le
 * navigateur — ceux marqués `'use client'`.
 *
 * La session n'est plus rangée dans le localStorage comme dans
 * l'ancienne version, mais dans des cookies. C'est ce qui permet
 * au serveur de savoir qui est connecté avant même d'envoyer la
 * page, et donc de supprimer l'écran masqué puis révélé.
 */
export function creerClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
