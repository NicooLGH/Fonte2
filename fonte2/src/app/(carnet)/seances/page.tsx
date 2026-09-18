import { chargerSuiviComplet, chargerObjectifs } from '@/lib/donnees'
import { semaineCourante, libelleSemaine, libelleCourt } from '@/lib/semaine'
import { CHAMPS_SUIVI } from '@/lib/suivi'
import { Releve, BlocObjectifs } from '@/components/suivi/Releve'
import { Evolution } from '@/components/suivi/Evolution'
import { PhotoSemaine, Comparaison } from '@/components/suivi/Photos'
import { creerClientServeur } from '@/lib/supabase/server'

export default async function PageSuivi() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [releves, objectifs] = await Promise.all([
    chargerSuiviComplet(),
    chargerObjectifs(),
  ])

  const semaine = semaineCourante()
  const courant = releves.find((r) => r.semaine === semaine) ?? null

  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3
                         border-b border-filet pb-5">
        <h1 className="text-4xl sm:text-5xl">Suivi hebdo</h1>
        <p className="font-mono text-[11px] text-encre-douce">
          semaine {libelleSemaine(semaine)}
        </p>
      </header>

      <div className="flex flex-col">
        <Releve releve={courant} semaine={libelleSemaine(semaine)} />
        <BlocObjectifs objectifs={objectifs} />
      </div>

      <section className="section pb-5">
        <p className="section-titre mb-2">Photo de la semaine</p>
        <p className="mb-4 text-[13px] leading-relaxed text-encre-douce">
          Facultative, et strictement privée : elle ne s&apos;affiche ni sur ton
          profil, ni pour tes amis.
        </p>
        <PhotoSemaine
          userId={user!.id}
          semaine={semaine}
          aUnePhoto={courant?.aPhoto ?? false}
        />
      </section>

      <section className="section pb-5">
        <p className="section-titre mb-4">Comparer deux semaines</p>
        <Comparaison userId={user!.id} releves={releves} />
      </section>

      <Evolution releves={releves} objectifs={objectifs} />

      <section className="section pb-5">
        <p className="section-titre mb-4">Historique</p>

        {releves.length === 0 ? (
          <p className="text-sm italic text-encre-douce">
            Aucun relevé enregistré.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-filet text-left">
                  <th className="pb-2 pr-4 font-mono text-[10px] uppercase tracking-wide text-encre-douce">
                    Semaine
                  </th>
                  {CHAMPS_SUIVI.map((c) => (
                    <th
                      key={c.cle}
                      className="pb-2 pr-4 font-mono text-[10px] uppercase tracking-wide text-encre-douce"
                    >
                      {c.libelle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {releves.map((r) => (
                  <tr key={r.id} className="border-b border-filet last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      <span className="mr-2 rounded-bloc bg-accent/15 px-2 py-0.5 text-accent">
                        {libelleCourt(r.semaine)}
                      </span>
                      {r.date}
                    </td>
                    {CHAMPS_SUIVI.map((c) => (
                      <td key={c.cle} className="py-2.5 pr-4">
                        {r[c.cle] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
