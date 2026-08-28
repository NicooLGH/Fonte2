import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerProfil } from '@/lib/donnees-social'
import { VueProfil } from '@/components/social/ProfilPublic'

/**
 * Mon profil.
 *
 * Le même écran que celui d'un ami : la base renvoie `relation:
 * 'moi'` et le détail complet. Un seul composant pour les deux
 * cas, donc une seule chose à maintenir.
 */
export default async function MonProfil() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const profil = await chargerProfil(user.id)

  if (!profil)
    return (
      <p className="py-12 text-center text-sm italic text-encre-douce">
        Profil introuvable.
      </p>
    )

  return <VueProfil profil={profil} encouragementEnvoye={null} />
}
