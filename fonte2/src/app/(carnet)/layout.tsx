import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { BarreHaute, BarreMobile, BarreBasse } from '@/components/Navigation'
import { Notifications } from '@/components/social/Notifications'
import { chargerNotifications, suisJeAdmin } from '@/lib/donnees-notifs'
import { chargerModeles } from '@/lib/donnees'
import type { Profil } from '@/types/database'
import { BandeauLive } from '@/components/live/BandeauLive'

/**
 * Mise en page commune aux pages du carnet.
 *
 * Le profil est chargé ici une seule fois pour toute la
 * navigation, plutôt que dans chaque page. Le proxy a déjà
 * vérifié la session ; on s'occupe seulement du carnet neuf,
 * qu'on renvoie au choix du pseudo.
 */
export default async function CarnetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await creerClientServeur()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('profiles')
    .select('*') // « * » : reste valable même si la colonne `cadre` manque encore
    .eq('id', user.id)
    .maybeSingle()

  const profil = data as
    | (Pick<Profil, 'pseudo' | 'avatar' | 'onboarded'> & { cadre?: string | null })
    | null

  if (!profil || !profil.onboarded || !profil.pseudo) redirect('/bienvenue')

  const [notifications, modeles, admin] = await Promise.all([
    chargerNotifications(),
    chargerModeles(),
    suisJeAdmin(),
  ])
  const cloche = <Notifications notifications={notifications} />

  return (
    /*
     * `viewport-fit=cover` place le haut de la fenêtre SOUS
     * l'encoche. Une barre collée en haut du flux s'y retrouve
     * donc cachée, et son `sticky` la fait descendre sans
     * réserver la place correspondante — d'où le contenu qui
     * passait dessous.
     *
     * Cette marge réserve la hauteur. Elle vaut exactement le
     * décalage du `sticky` des deux barres, pour qu'elles ne
     * bougent pas au repos.
     */
    <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
      <BarreHaute
        avatar={profil.avatar ?? '💪'}
        cadre={profil.cadre ?? 'aucun'}
        pseudo={profil.pseudo}
        notifications={cloche}
        admin={admin}
      />
      <BarreMobile
        notifications={cloche}
        avatar={profil.avatar ?? '💪'}
        cadre={profil.cadre ?? 'aucun'}
        pseudo={profil.pseudo}
      />
      {/* La marge basse dégage la bulle de navigation : sa hauteur,
          plus la marge du bord, plus la barre d'accueil. */}
      <div
        className="mx-auto max-w-5xl px-4 md:px-6 md:pb-12"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {children}
      </div>
      {/* Une séance réduite reste accessible depuis toutes les pages. */}
      <BandeauLive userId={user.id} />
      <BarreBasse aDesModeles={modeles.length > 0} />
    </div>
  )
}
