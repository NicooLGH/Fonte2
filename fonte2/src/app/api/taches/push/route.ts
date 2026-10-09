import { NextResponse, type NextRequest } from 'next/server'
import { tacheAutorisee } from '@/lib/supabase/admin'
import { envoyerEnAttente } from '@/lib/push-serveur'

/**
 * Envoi des notifications en attente.
 * Appelé chaque minute par Supabase (fonte-taches.sql), avec le secret.
 */
export const dynamic = 'force-dynamic'

export async function POST(requete: NextRequest) {
  if (!tacheAutorisee(requete.headers.get('authorization')))
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  return NextResponse.json(await envoyerEnAttente())
}
