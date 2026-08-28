import type { NextRequest } from 'next/server'
import { actualiserSession } from '@/lib/supabase/proxy'

/**
 * Next.js 16 a renommé `middleware.ts` en `proxy.ts`, et la
 * fonction exportée doit s'appeler `proxy`.
 *
 * Le nom est plus juste : ce fichier n'est pas une couche
 * applicative, c'est un poste de contrôle placé devant l'app.
 * Les vraies vérifications d'autorisation restent en base, dans
 * les règles RLS.
 */
export async function proxy(request: NextRequest) {
  return await actualiserSession(request)
}

export const config = {
  matcher: [
    /*
     * Toutes les requêtes sauf les fichiers statiques : inutile
     * d'interroger Supabase pour servir une image.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
