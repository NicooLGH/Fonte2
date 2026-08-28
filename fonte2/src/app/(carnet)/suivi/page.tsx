import { chargerSuiviComplet, chargerObjectifs } from '@/lib/donnees'
import { semaineCourante, libelleSemaine, libelleCourt } from '@/lib/semaine'
import { CHAMPS_SUIVI } from '@/lib/suivi'
import { Releve, BlocObjectifs } from '@/components/suivi/Releve'
import { Evolution } from '@/components/suivi/Evolution'

export default async function PageSuivi() {
  const [releves, objectifs] = await Promise.all([
    chargerSuiviComplet(),
    chargerObjectifs(),
  ])

  const semaine = semaineCourante()
  const courant = releves.find((r) => r.semaine === semaine) ?? null

  return (
    <div className="flex flex-col gap-6 py-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Semaine {libelleSemaine(semaine)}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Suivi hebdo</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Releve releve={courant} semaine={libelleSemaine(semaine)} />
        <BlocObjectifs objectifs={objectifs} />
      </div>

      <Evolution releves={releves} objectifs={objectifs} />

      <section className="rounded-carte border border-bordure bg-verre p-5">
        <h2 className="mb-4 text-2xl">Historique</h2>

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
                      <span className="mr-2 rounded-full bg-accent/15 px-2 py-0.5 text-accent">
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
