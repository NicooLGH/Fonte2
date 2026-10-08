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
import { ApercuBadges } from '@/components/badges/ApercuBadges'
import { PisteNiveaux } from '@/components/xp/PisteNiveaux'
import { chargerClassement } from '@/lib/donnees-social'
import Link from 'next/link'
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
  const [profil, xp, historique, total, badges, classement] = await Promise.all([
    chargerProfil(user.id),
    chargerMonXP(),
    chargerHistorique(user.id),
    compterSeances(user.id),
    chargerBadges(user.id),
    chargerClassement('niveau'),
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
      badges={badges && <ApercuBadges etats={badges} />}
      piste={
        <Link href="/piste" className="bloc appui relative flex flex-col gap-1 py-3.5">
          <span className="flex items-baseline justify-between px-4">
            <span className="text-[16px] font-semibold">Niveaux</span>
            <span className="font-mono text-[13px] text-encre-douce">
              −{(n.xpSuivant - n.xp).toLocaleString('fr-FR')} XP ›
            </span>
          </span>
          <PisteNiveaux
            niveau={n.niveau}
            progression={n.progression}
            amis={classement.lignes
              .filter((l) => !l.moi)
              .map((l) => ({ id: l.id, pseudo: l.pseudo, avatar: l.avatar, niveau: l.niveau }))}
          />
        </Link>
      }
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
