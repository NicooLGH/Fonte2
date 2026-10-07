import Link from 'next/link'
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

  const reussis = defis.filter((d) => d.reussiLe).length

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 py-4">
      <h1 className="titre-page px-0.5 pt-2">Défis</h1>

      {defis.length === 0 ? (
        <p className="px-0.5 text-[15px] leading-relaxed text-encre-douce">
          Aucun défi en cours. Le prochain sera annoncé ici.
        </p>
      ) : (
        <>
          {une && <CarteUne defi={une} />}
          {autres.length > 0 && (
            <section className="flex flex-col">
              <p className="section-titre px-0.5 pb-1">En ce moment</p>
              {autres.map((d) => (
                <LigneDefi key={d.edition} defi={d} />
              ))}
            </section>
          )}
        </>
      )}

      <Link href="/badges" className="flex min-h-14 items-center gap-3 px-0.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f0c04a]/15 text-[#f0c04a]">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />
          </svg>
        </span>
        <span className="flex-1 text-[16px] font-semibold">
          {reussis > 0 ? `${reussis} défi${reussis > 1 ? 's' : ''} réussi${reussis > 1 ? 's' : ''}` : 'Mes badges de défis'}
        </span>
        <span className="text-encre-douce">›</span>
      </Link>
    </div>
  )
}
