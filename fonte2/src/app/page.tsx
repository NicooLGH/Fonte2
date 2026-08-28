import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { seDeconnecter } from '@/app/auth/actions'
import { semaineCourante, libelleSemaine } from '@/lib/semaine'
import type { Profil } from '@/types/database'

/**
 * Page d'accueil provisoire.
 *
 * Le proxy garantit déjà qu'on est connecté pour arriver ici. On
 * s'occupe donc seulement du cas du carnet neuf : un compte dont
 * le pseudo n'a pas encore été choisi part vers /bienvenue.
 *
 * Elle deviendra le fil d'actualité à la session 5.
 */
export default async function Accueil() {
  const supabase = await creerClientServeur()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('profiles')
    .select('pseudo, avatar, role, onboarded')
    .eq('id', user.id)
    .maybeSingle()

  const profil = data as Pick<
    Profil,
    'pseudo' | 'avatar' | 'role' | 'onboarded'
  > | null

  // Compte créé avant que le déclencheur n'existe, ou bienvenue
  // interrompue : on renvoie au choix du pseudo.
  if (!profil || !profil.onboarded || !profil.pseudo) redirect('/bienvenue')

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Semaine {libelleSemaine(semaineCourante())}
        </p>
        <h1 className="mt-3 flex items-center gap-4 text-5xl sm:text-6xl">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center
                       rounded-full border border-bordure bg-verre text-3xl"
          >
            {profil.avatar ?? '💪'}
          </span>
          {profil.pseudo}
        </h1>
      </header>

      <section className="rounded-carte border border-bordure bg-verre p-6">
        <h2 className="mb-4 text-2xl">Te voilà connecté</h2>
        <p className="text-sm leading-relaxed text-encre-douce">
          La session tient dans un cookie : le serveur sait qui tu es avant même
          d&apos;envoyer la page. Plus d&apos;écran masqué puis révélé.
        </p>
        {profil.role === 'admin' && (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-accent-2">
            Compte administrateur
          </p>
        )}
      </section>

      <form action={seDeconnecter}>
        <button
          type="submit"
          className="w-full rounded-full border border-bordure bg-verre px-6 py-3
                     text-sm font-semibold text-encre-douce transition-colors
                     hover:border-accent/50 hover:text-accent"
        >
          Se déconnecter
        </button>
      </form>

      <footer className="font-mono text-[11px] text-encre-douce">
        Prochaine étape : le carnet — exercices, modèles et séances.
      </footer>
    </main>
  )
}
