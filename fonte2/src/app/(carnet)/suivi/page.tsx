import { chargerSuiviComplet, chargerObjectifs } from '@/lib/donnees'
import { semaineCourante, libelleCourt } from '@/lib/semaine'
import { Releve, BlocObjectifs } from '@/components/suivi/Releve'
import { CarteSuivi, HistoriqueReleves } from '@/components/suivi/CarteSuivi'
import { PhotoSemaine } from '@/components/suivi/Photos'
import { creerClientServeur } from '@/lib/supabase/server'
import { OngletsProgres } from '@/components/OngletsProgres'

/**
 * Progrès · Suivi.
 *
 * 3.0 : la mesure choisie en grand avec sa courbe, les autres en
 * lignes, puis la photo, les objectifs et l'historique.
 */
export default async function PageSuivi() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [releves, objectifs] = await Promise.all([chargerSuiviComplet(), chargerObjectifs()])

  const semaine = semaineCourante()
  const courant = releves.find((r) => r.semaine === semaine) ?? null

  return (
    <div className="flex flex-col gap-5 py-4">
      <header className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 px-0.5 pt-2">
          <h1 className="titre-page">Progrès</h1>
          <p className="pb-1 font-mono text-[13px] text-encre-douce">
            Sem. {libelleCourt(semaine).slice(1)}
          </p>
        </div>
        <OngletsProgres />
      </header>

      {releves.length === 0 ? (
        <div className="bloc motif-cercles flex flex-col gap-2 p-5">
          <p className="font-display text-[34px] leading-none">Premier relevé</p>
          <p className="text-[15px] leading-relaxed text-encre-douce">
            Poids, calories, mensurations : une fois par semaine, tout est facultatif. Tes courbes
            apparaissent dès la deuxième semaine.
          </p>
        </div>
      ) : (
        <CarteSuivi releves={releves} objectifs={objectifs} semaine={semaine} />
      )}

      <Releve releve={courant} semaine={libelleCourt(semaine)} />

      <div className="flex flex-col gap-1">
        <PhotoSemaine
          userId={user!.id}
          semaine={semaine}
          aUnePhoto={courant?.aPhoto ?? false}
          releves={releves}
        />
        <BlocObjectifs objectifs={objectifs} />
      </div>

      <HistoriqueReleves releves={releves} />
    </div>
  )
}
