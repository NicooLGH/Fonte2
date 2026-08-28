import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Pages accessibles sans être connecté.
 * Tout le reste redirige vers la connexion.
 */
const PUBLIQUES = ['/connexion', '/inscription', '/mot-de-passe']

/**
 * Les redirections restent désactivées tant que l'écran de
 * connexion n'existe pas : sans lui, toute visite finirait sur
 * une page introuvable.
 *
 * À passer à `true` à la session 2, une fois /connexion en place.
 */
const REDIRECTIONS_ACTIVES = false

/**
 * Rafraîchit le jeton d'accès à chaque requête et protège les
 * pages privées. Appelé depuis `src/proxy.ts`.
 *
 * Sans ce passage, le jeton expirerait au bout d'une heure et
 * l'utilisateur se retrouverait déconnecté sans comprendre
 * pourquoi.
 */
export async function actualiserSession(request: NextRequest) {
  let reponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesAEcrire) {
          cookiesAEcrire.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          reponse = NextResponse.next({ request })
          cookiesAEcrire.forEach(({ name, value, options }) =>
            reponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Cet appel doit rester immédiatement après la création du
  // client : c'est lui qui déclenche le rafraîchissement.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const chemin = request.nextUrl.pathname
  const estPublique = PUBLIQUES.some((p) => chemin.startsWith(p))

  // Le jeton vient d'être rafraîchi ci-dessus ; c'est déjà utile
  // même sans redirection.
  if (!REDIRECTIONS_ACTIVES) return reponse

  if (!user && !estPublique) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    // On mémorise la destination pour y revenir après connexion
    if (chemin !== '/') url.searchParams.set('suite', chemin)
    return NextResponse.redirect(url)
  }

  if (user && estPublique) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return reponse
}
