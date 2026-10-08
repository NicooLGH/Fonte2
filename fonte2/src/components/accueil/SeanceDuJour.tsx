import Link from 'next/link'
import { activite, type Cardio } from '@/lib/cardio'
import type { JourPlanning } from '@/lib/planning'
import type { Modele } from '@/lib/live'
import type { SeanceComplete } from '@/lib/carnet'
import { calculerNiveau } from '@/lib/xp'
import { TexteAjuste } from '@/components/ui/TexteAjuste'

/* ============================================================
   Accueil : la séance du jour, le niveau et la semaine
   ============================================================ */

const lienPrincipal =
  'appui flex h-14 items-center justify-center gap-2 rounded-bloc bg-accent text-[17px] font-bold text-white transition-colors hover:bg-accent-clair'
const lienDiscret =
  'appui flex h-12 items-center justify-center rounded-bloc bg-verre-fort text-[15px] font-semibold text-encre transition-colors hover:bg-fond'

export function SeanceDuJour({
  prevu,
  modeles,
  seancesDuJour,
  cardioDuJour,
  dernieres,
}: {
  prevu: JourPlanning | null
  modeles: Modele[]
  seancesDuJour: SeanceComplete[]
  cardioDuJour: Cardio[]
  /** Toutes les séances, pour retrouver la durée de la dernière fois. */
  dernieres: SeanceComplete[]
}) {
  const modele =
    prevu?.type === 'modele' ? (modeles.find((m) => m.id === prevu.modeleId) ?? null) : null
  const type = prevu?.type === 'modele' && !modele ? null : (prevu?.type ?? null)
  const aDesModeles = modeles.length > 0

  // Déjà fait aujourd'hui ?
  const fait =
    (type === 'modele' && seancesDuJour.length > 0) ||
    (type === 'cardio' && cardioDuJour.length > 0) ||
    (type !== 'modele' && type !== 'cardio' && seancesDuJour.length + cardioDuJour.length > 0)

  let surtitre = "Aujourd'hui"
  let titre: string
  let detail: React.ReactNode = null
  let actions: React.ReactNode

  if (fait) {
    surtitre = "Aujourd'hui · fait"
    const n = seancesDuJour.length + cardioDuJour.length
    titre = modele?.nom ?? (type === 'cardio' ? 'Cardio' : 'Bien joué')
    detail = (
      <>
        {n} activité{n > 1 ? 's' : ''}
        <br />
        enregistrée{n > 1 ? 's' : ''}
      </>
    )
    actions = (
      <div className="grid grid-cols-2 gap-2">
        <Link href="/seances" className={lienDiscret}>
          Voir
        </Link>
        <Link href={aDesModeles ? '/live' : '/seances?ajout=muscu'} className={lienDiscret}>
          En refaire une
        </Link>
      </div>
    )
  } else if (type === 'modele' && modele) {
    titre = modele.nom
    const derniere = dernieres.find((s) => s.nom === modele.nom && s.dureeSec)
    detail = (
      <>
        {modele.entrees.length} exo{modele.entrees.length > 1 ? 's' : ''}
        {derniere?.dureeSec ? (
          <>
            <br />~{Math.round(derniere.dureeSec / 60)} min
          </>
        ) : null}
      </>
    )
    actions = (
      <Link href={`/live?modele=${modele.id}`} className={lienPrincipal}>
        <IconeLecture />
        Démarrer
      </Link>
    )
  } else if (type === 'cardio') {
    titre = 'Cardio'
    detail = activite(prevu?.activite).nom
    actions = (
      <Link href="/seances?ajout=cardio" className={lienPrincipal}>
        Ajouter mon cardio
      </Link>
    )
  } else if (type === 'repos') {
    surtitre = "Aujourd'hui · repos"
    titre = 'Récupère'
    actions = (
      <Link href={aDesModeles ? '/live' : '/seances?ajout=muscu'} className={lienDiscret}>
        Faire une séance quand même
      </Link>
    )
  } else {
    titre = 'Séance libre'
    actions = (
      <div className="flex flex-col gap-2">
        <Link href={aDesModeles ? '/live' : '/seances?onglet=modeles'} className={lienPrincipal}>
          {aDesModeles ? (
            <>
              <IconeLecture />
              Démarrer
            </>
          ) : (
            'Créer mon premier modèle'
          )}
        </Link>
        <Link href="/seances?onglet=semaine" className={lienDiscret}>
          Planifier ma semaine
        </Link>
      </div>
    )
  }

  return (
    <section className="bloc motif-cercles flex flex-col gap-4 p-5" aria-label="Séance du jour">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12px] tracking-[0.08em] text-accent-clair uppercase">
            {surtitre}
          </p>
          <TexteAjuste as="p" max={60} min={26} className="mt-1 font-display leading-[0.9]">
            {titre}
          </TexteAjuste>
        </div>
        {detail && (
          <p className="mb-1 shrink-0 text-right font-mono text-[14px] text-encre-douce">{detail}</p>
        )}
      </div>
      {actions}
    </section>
  )
}

/* ---- Niveau et semaine ---- */

export function NiveauEtSemaine({
  xp,
  joursFaits,
  joursPrevus,
  aujourdhuiIndex,
  serie,
}: {
  xp: number
  /** Index 0 (lundi) à 6 (dimanche) des jours avec une activité. */
  joursFaits: number[]
  /** Nombre de jours d'entraînement prévus dans le planning. */
  joursPrevus: number
  aujourdhuiIndex: number
  serie: number
}) {
  const n = calculerNiveau(xp)
  const reste = Math.max(0, n.xpSuivant - xp)
  const faits = joursFaits.length

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href="/xp" className="bloc appui flex flex-col gap-3 p-4">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-[46px] leading-[0.85] text-accent">{n.niveau}</span>
          <span className="font-mono text-[12px] text-encre-douce uppercase">{n.rang}</span>
        </span>
        <span className="h-1.5 overflow-hidden rounded-pilule bg-encre/10">
          <span
            className="block h-full bg-accent"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, n.progression)) * 100)}%` }}
          />
        </span>
        <span className="font-mono text-[13px] text-encre-douce">−{reste.toLocaleString('fr-FR')} XP</span>
      </Link>

      <Link href="/seances?onglet=semaine" className="bloc appui flex flex-col gap-3 p-4">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-[46px] leading-[0.85]">
            {faits}
            {joursPrevus > 0 && `/${joursPrevus}`}
          </span>
          <span className="font-mono text-[12px] text-encre-douce">SEM.</span>
        </span>
        <span className="grid grid-cols-7 gap-1" aria-label={`${faits} jour${faits > 1 ? 's' : ''} actif${faits > 1 ? 's' : ''} cette semaine`}>
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-pilule ${
                joursFaits.includes(i)
                  ? 'bg-accent-2'
                  : i === aujourdhuiIndex
                    ? 'bg-encre'
                    : 'bg-encre/10'
              }`}
            />
          ))}
        </span>
        <span className={`font-mono text-[13px] ${serie > 0 ? 'text-accent-clair' : 'text-encre-douce'}`}>
          {serie > 0 ? `série ${serie} sem.` : 'lance ta série'}
        </span>
      </Link>
    </div>
  )
}

function IconeLecture() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  )
}
