import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase pour les composants serveur, les actions et les
 * routes d'API.
 *
 * À créer à chaque requête, jamais à conserver dans une variable
 * partagée : deux visiteurs simultanés partageraient alors la même
 * session, et l'un verrait les données de l'autre.
 */
export async function creerClientServeur() {
  const boiteCookies = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return boiteCookies.getAll()
        },
        setAll(cookiesAEcrire) {
          try {
            cookiesAEcrire.forEach(({ name, value, options }) =>
              boiteCookies.set(name, value, options)
            )
          } catch {
            // Un composant serveur ne peut pas écrire de cookies.
            // Ce n'est pas grave : le middleware s'en charge à
            // chaque requête, le jeton reste donc à jour.
          }
        },
      },
    }
  )
}

/**
 * Renvoie l'utilisateur connecté, ou null.
 *
 * On utilise `getUser()` et non `getSession()` : le premier
 * vérifie le jeton auprès de Supabase, le second se contente de
 * lire le cookie, qui pourrait avoir été forgé.
 */
export async function utilisateurCourant() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
