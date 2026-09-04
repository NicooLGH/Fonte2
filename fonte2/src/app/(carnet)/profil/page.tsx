import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerProfil } from '@/lib/donnees-social'
import { VueProfil } from '@/components/social/ProfilPublic'
import { chargerExercices, chargerSeances, chargerReleves } from '@/lib/donnees'
import { repartitionXP, totalXP, calculerNiveau } from '@/lib/xp'

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

  const [profil, exercices, seances, releves] = await Promise.all([
    chargerProfil(user.id),
    chargerExercices(),
    chargerSeances(),
    chargerReleves(),
  ])

  const n = calculerNiveau(
    totalXP(repartitionXP(seances, releves, exercices.map((e) => e.id)))
  )

  if (!profil)
    return (
      <p className="py-12 text-center text-sm italic text-encre-douce">
        Profil introuvable.
      </p>
    )

  return (
    <VueProfil
      profil={profil}
      encouragementEnvoye={null}
      niveau={{
        niveau: n.niveau,
        rang: n.rang,
        xp: n.xp,
        xpSuivant: n.xpSuivant,
        progression: n.progression,
      }}
    />
  )
}
