import { NextResponse, type NextRequest } from 'next/server'
import { clientAdmin, tacheAutorisee } from '@/lib/supabase/admin'

/**
 * Nettoyage (session 13) : stories expirées et photos orphelines.
 * Appelé chaque heure par Supabase (fonte-taches.sql), avec le secret.
 *
 * La base supprime les lignes et renvoie les fichiers ; les
 * fichiers s'effacent ici, par l'API du stockage (seule méthode
 * qui supprime vraiment les photos).
 */
export const dynamic = 'force-dynamic'

export async function POST(requete: NextRequest) {
  if (!tacheAutorisee(requete.headers.get('authorization')))
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })

  const admin = clientAdmin()
  if (!admin) return NextResponse.json({ erreur: 'Clé de service absente' }, { status: 500 })

  const { data, error } = await admin.rpc('nettoyer_stories')
  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 })

  const chemins = (Array.isArray(data) ? data : []).filter(
    (c): c is string => typeof c === 'string' && c.length > 0
  )
  let effaces = 0
  for (let i = 0; i < chemins.length; i += 100) {
    const lot = chemins.slice(i, i + 100)
    const { error: e } = await admin.storage.from('stories').remove(lot)
    if (!e) effaces += lot.length
  }
  return NextResponse.json({ stories: chemins.length, fichiers: effaces })
}
