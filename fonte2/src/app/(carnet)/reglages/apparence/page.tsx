import Link from 'next/link'
import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { chargerMonXP } from '@/lib/donnees-xp'
import { calculerNiveau } from '@/lib/xp'
import { ChoixTheme } from '@/components/reglages/ChoixTheme'
import { chargerPossessions } from '@/lib/donnees-boutique'

/** Personnaliser son profil : teinte, motif, cadre et avatar. */
export default async function PageApparence() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data }, xp, possessions] = await Promise.all([
    supabase
      .from('profiles')
      .select('pseudo, avatar, bio, banniere, motif, cadre')
      .eq('id', user.id)
      .maybeSingle(),
    chargerMonXP(),
    chargerPossessions(),
  ])
  const p = (data ?? {}) as Record<string, string | null>

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 py-4">
      <div className="flex h-11 items-center gap-2">
        <Link href="/reglages" aria-label="Retour aux réglages" className="-ml-2 flex h-11 w-11 items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-[17px] font-bold normal-case tracking-normal" style={{ fontFamily: 'var(--font-corps)' }}>
          Personnaliser
        </h1>
      </div>
      <ChoixTheme
        bio={p.bio ?? ''}
        banniere={p.banniere ?? 'braise'}
        motif={p.motif ?? 'aucun'}
        cadre={p.cadre ?? 'aucun'}
        niveau={calculerNiveau(xp).niveau}
        pseudo={p.pseudo ?? ''}
        avatar={p.avatar ?? '💪'}
        possessions={possessions}
      />
    </div>
  )
}
