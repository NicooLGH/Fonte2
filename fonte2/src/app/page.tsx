import { creerClientServeur } from '@/lib/supabase/server'
import { semaineCourante, libelleSemaine } from '@/lib/semaine'
import type { Profil } from '@/types/database'

/*
 * Page de vérification du socle.
 *
 * C'est un composant serveur : le code ci-dessous s'exécute sur
 * Vercel, jamais dans le navigateur. La page arrive donc déjà
 * remplie, sans écran de chargement.
 *
 * Elle sera remplacée par le fil d'actualité à la session 5.
 */
export default async function Accueil() {
  const supabase = await creerClientServeur()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Lecture réelle de la base, pour vérifier que les règles de
  // sécurité laissent bien passer la requête.
  let pseudo: string | null = null
  let erreur: string | null = null

  if (user) {
    const { data, error } = await supabase
      .from('profiles')
      .select('pseudo, avatar, role')
      .eq('id', user.id)
      .maybeSingle()

    // Le client n'est pas typé par le schéma (voir types/database.ts) :
    // on annonce donc explicitement la forme attendue.
    const profil = data as Pick<Profil, 'pseudo' | 'avatar' | 'role'> | null

    if (error) erreur = error.message
    else pseudo = profil?.pseudo ?? null
  }

  const semaine = semaineCourante()

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Socle · semaine {libelleSemaine(semaine)}
        </p>
        <h1 className="mt-3 text-6xl sm:text-7xl">
          Fonte<span className="text-accent">.</span>
        </h1>
      </header>

      <section className="rounded-carte border border-bordure bg-verre p-6">
        <h2 className="mb-4 text-2xl">Vérification</h2>

        <dl className="divide-y divide-filet text-sm">
          <Ligne
            libelle="Connexion à Supabase"
            valeur={erreur ? 'échec' : 'établie'}
            ok={!erreur}
          />
          <Ligne
            libelle="Session"
            valeur={user ? 'reconnue côté serveur' : 'aucune'}
            ok={!!user}
          />
          {user && (
            <Ligne
              libelle="Profil"
              valeur={pseudo ? pseudo : 'sans pseudo'}
              ok={!!pseudo}
            />
          )}
        </dl>

        {erreur && (
          <p className="mt-4 font-mono text-xs text-accent">{erreur}</p>
        )}

        {!user && (
          <p className="mt-5 text-sm leading-relaxed text-encre-douce">
            Aucune session : c&apos;est normal, l&apos;écran de connexion arrive
            à la prochaine session. Le middleware laisse passer cette page pour
            que tu puisses vérifier le socle.
          </p>
        )}
      </section>

      <footer className="font-mono text-[11px] text-encre-douce">
        Prochaine étape : authentification.
      </footer>
    </main>
  )
}

function Ligne({
  libelle,
  valeur,
  ok,
}: {
  libelle: string
  valeur: string
  ok: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-encre-douce">{libelle}</dt>
      <dd
        className={`font-mono text-xs ${ok ? 'text-accent-2' : 'text-accent'}`}
      >
        {ok ? '✓ ' : '✕ '}
        {valeur}
      </dd>
    </div>
  )
}
