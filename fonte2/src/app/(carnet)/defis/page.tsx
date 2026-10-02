import { chargerDefisEnCours } from '@/lib/donnees-defis'
import { CarteUne, LigneDefi } from '@/components/defis/CartesDefis'

/**
 * Tous les défis en cours.
 *
 * On y arrive depuis l'accueil (« Tout voir ») ou l'annonce d'un
 * nouveau défi. Le plus récent non réussi reste à la une ; les
 * autres, y compris ceux mis de côté, suivent en liste.
 */
export default async function PageDefis() {
  const defis = await chargerDefisEnCours()
  const une = defis.find((d) => !d.reussiLe && !d.refuse) ?? null
  const autres = defis.filter((d) => d !== une)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Défis
        </p>
        <h1 className="mt-2 text-[46px]">En ce moment</h1>
        <p className="mt-2 text-sm leading-relaxed text-encre-douce">
          Chaque défi rapporte de l&apos;XP et un badge unique, qui rejoint la
          section « Défis » de ton profil. Tu choisis ceux auxquels tu
          participes.
        </p>
      </header>

      {defis.length === 0 ? (
        <p className="text-sm italic text-encre-douce">
          Aucun défi en cours pour l&apos;instant. Le prochain sera annoncé ici.
        </p>
      ) : (
        <>
          {une && <CarteUne defi={une} />}
          {autres.length > 0 && (
            <section>
              <p className="section-titre border-b border-bordure pb-1.5">
                {une ? 'Les autres défis' : 'Défis en cours'}
              </p>
              {autres.map((d) => (
                <LigneDefi key={d.edition} defi={d} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
