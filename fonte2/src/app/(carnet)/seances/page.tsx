import {
  chargerExercices,
  chargerSeances,
  chargerModeles,
  chargerCardio,
  chargerPlanning,
} from '@/lib/donnees'
import { EcranSeances, type CleOnglet } from '@/components/seances/EcranSeances'
import { creerClientServeur } from '@/lib/supabase/server'
import { aujourdhui } from '@/lib/semaine'
import { jourDe, joursDeLaSemaine, type Jour } from '@/lib/planning'

const ONGLETS: CleOnglet[] = ['historique', 'semaine', 'modeles', 'exercices']

export default async function PageSeances({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; ajout?: string }>
}) {
  const params = await searchParams
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [exercices, seances, modeles, cardio, planning, { data: profil }] = await Promise.all([
    chargerExercices(),
    chargerSeances(),
    chargerModeles(),
    chargerCardio(),
    chargerPlanning(),
    supabase.from('profiles').select('pseudo').eq('id', user!.id).maybeSingle(),
  ])

  // Jours de la semaine en cours où quelque chose a été fait.
  const semaine = new Set(joursDeLaSemaine(aujourdhui()))
  const faits = [
    ...new Set(
      [...seances.map((s) => s.date), ...cardio.map((c) => c.date)]
        .filter((d) => semaine.has(d))
        .map(jourDe)
    ),
  ] as Jour[]

  const onglet = ONGLETS.includes(params.onglet as CleOnglet)
    ? (params.onglet as CleOnglet)
    : 'historique'
  const ajout = params.ajout === 'cardio' ? 'cardio' : params.ajout === 'muscu' ? 'muscu' : null

  return (
    <EcranSeances
      /* Une nouvelle adresse (?ajout=cardio depuis l'accueil) repart de zéro. */
      key={`${onglet}-${ajout ?? ''}`}
      exercices={exercices}
      seances={seances}
      cardio={cardio}
      modeles={modeles}
      planning={planning}
      faits={faits}
      pseudo={(profil?.pseudo as string) ?? ''}
      ongletInitial={onglet}
      ajoutInitial={ajout}
    />
  )
}
