import Link from 'next/link'
import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerBadges } from '@/lib/donnees-xp'
import { chargerBadgesDefis } from '@/lib/donnees-defis'
import { GrilleBadges } from '@/components/badges/GrilleBadges'
import { TOTAL_PALIERS, obtenus } from '@/lib/badges'

/** Mes badges, par catégorie, avec les badges de défis. */
export default async function PageBadges() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [badges, defis] = await Promise.all([chargerBadges(user.id), chargerBadgesDefis(user.id)])
  const total = (badges ?? []).reduce((t, e) => t + obtenus(e), 0)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 py-4">
      <Link href="/profil" aria-label="Retour au profil" className="-ml-2 flex h-11 w-11 items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className="flex items-end justify-between gap-3 px-0.5">
        <h1 className="titre-page">Badges</h1>
        <span className="pb-1 font-mono text-[14px] text-encre-douce">
          <span className="font-display text-[30px] leading-none text-encre">{total}</span> / {TOTAL_PALIERS}
        </span>
      </div>
      {badges ? (
        <GrilleBadges etats={badges} moi defis={defis} entete={false} />
      ) : (
        <p className="text-[15px] text-encre-douce">Les badges ne sont pas encore disponibles.</p>
      )}
    </div>
  )
}
