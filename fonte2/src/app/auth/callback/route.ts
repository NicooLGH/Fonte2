import { NextResponse, type NextRequest } from 'next/server'
import { creerClientServeur } from '@/lib/supabase/server'

/**
 * Point d'arrivée des liens envoyés par email : confirmation
 * d'inscription et réinitialisation de mot de passe.
 *
 * Supabase renvoie un code à usage unique, qu'on échange ici
 * contre une vraie session. C'est ce qui manquait à l'ancien
 * carnet, où le lien retombait sur la page d'accueil sans que
 * personne ne sache quoi en faire.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const suite = searchParams.get('suite') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-invalide`)
  }

  const supabase = await creerClientServeur()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-expire`)
  }

  return NextResponse.redirect(`${origin}${suite}`)
}
