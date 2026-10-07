import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import {
  chargerProfil,
  chargerHistorique,
  compterSeances,
} from '@/lib/donnees-social'
import { Historique } from '@/components/social/Historique'
import { VueProfil } from '@/components/social/ProfilPublic'
import { chargerMonXP, chargerBadges } from '@/lib/donnees-xp'
import { GrilleBadges } from '@/components/badges/GrilleBadges'
import { chargerBadgesDefis } from '@/lib/donnees-defis'
import { calculerNiveau } from '@/lib/xp'

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

  // L'XP vient de la base, qui tient le journal à jour.
  const [profil, xp, historique, total, badges, defis] = await Promise.all([
    chargerProfil(user.id),
    chargerMonXP(),
    chargerHistorique(user.id),
    compterSeances(user.id),
    chargerBadges(user.id),
    chargerBadgesDefis(user.id),
  ])

  const n = calculerNiveau(xp)

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
      nbSeances={total}
      badges={badges && <GrilleBadges etats={badges} moi defis={defis} />}
      historique={
        <Historique
          cible={profil.id}
          initiales={historique}
          total={total}
          moi
        />
      }
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
