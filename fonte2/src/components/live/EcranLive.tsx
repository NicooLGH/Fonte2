'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  cleLive,
  dureeLive,
  DUREE_MAX_MS,
  DUREES_ECHAUFFEMENT,
  CLE_ECHAUFFEMENT,
  CLE_REPOS,
  REPOS_DEFAUT_S,
  REPOS_MIN_S,
  REPOS_MAX_S,
  type BlocLive,
  type Modele,
  type SeanceLive,
} from '@/lib/live'
import { GROUPES, type Exercice, type SeanceComplete } from '@/lib/carnet'
import { IconeCoche, IconeCroix } from '@/components/Icones'
import { meilleur1RM } from '@/lib/rm'
import {
  sonValide,
  sonRefus,
  sonFinRepos,
  sonExerciceSuivant,
  sonSeanceFinie,
  vibrer,
} from '@/lib/sons'
import { enregistrerSeanceLive } from '@/app/(carnet)/seances/actions'
import { finirLive } from '@/lib/live-social'
import { Encouragements } from './Encouragements'
import { RecapXP, type StatsSeance } from '@/components/xp/RecapXP'
import type { GainXP } from '@/lib/xp'

/* ============================================================
   Séance en direct
   ============================================================
   L'état est conservé dans le stockage local, pas seulement en
   mémoire : mettre l'application en arrière-plan ou recharger la
   page ne doit rien faire perdre.

   Les durées viennent d'horodatages absolus, jamais d'un
   compteur qu'on incrémente — sinon le chrono prendrait du
   retard dès que le navigateur suspend la page.
   ============================================================ */

type Etape = 'choix' | 'reprise' | 'seance'

export function EcranLive({
  userId,
  modeles,
  exercices,
  seances,
  prevuId = null,
  reprendre = false,
}: {
  userId: string
  modeles: Modele[]
  exercices: Exercice[]
  seances: SeanceComplete[]
  /** Modèle à présélectionner : celui du planning, ou celui de l'adresse. */
  prevuId?: string | null
  /** Vrai quand on revient d'une séance réduite. */
  reprendre?: boolean
}) {
  const router = useRouter()
  const [live, setLive] = useState<SeanceLive | null>(null)
  const [etape, setEtape] = useState<Etape>('choix')
  const [modeleChoisi, setModeleChoisi] = useState<Modele | null>(
    () => modeles.find((m) => m.id === prevuId) ?? null
  )
  const [minutes, setMinutes] = useState(0)
  const [maintenant, setMaintenant] = useState(Date.now())
  const [erreur, setErreur] = useState<string | null>(null)
  // Séries dont la validation a échoué : le rouge n'apparaît
  // qu'au moment où l'on tente de valider un champ vide, pas sur
  // toutes les séries à venir.
  const [refusees, setRefusees] = useState<number[]>([])
  const [echauffementAnnonce, setEchauffementAnnonce] = useState(false)
  // Après l'enregistrement : l'XP gagnée, affichée avant de
  // revenir au carnet.
  const [recap, setRecap] = useState<{
    avant: number
    apres: number
    gains: GainXP[]
    titre: string
    stats: StatsSeance
  } | null>(null)
  const [enCours, demarrer] = useTransition()

  const cle = cleLive(userId)

  /* ---- Reprise d'une séance interrompue ---- */
  useEffect(() => {
    try {
      const brut = localStorage.getItem(cle)
      if (!brut) return
      const reprise = JSON.parse(brut) as SeanceLive
      if (Date.now() - reprise.debut > DUREE_MAX_MS) {
        localStorage.removeItem(cle)
        return
      }
      setLive(reprise)
      // Retour depuis le bandeau « séance en cours » : on reprend
      // directement, sans redemander.
      setEtape(reprendre ? 'seance' : 'reprise')
    } catch {
      // Contenu illisible : on repart à zéro plutôt que de planter
      localStorage.removeItem(cle)
    }
  }, [cle, reprendre])

  // La durée d'échauffement retenue de la dernière fois : on ne
  // la redemande pas à chaque séance.
  useEffect(() => {
    const garde = Number(localStorage.getItem(CLE_ECHAUFFEMENT))
    if (Number.isFinite(garde) && garde > 0) setMinutes(garde)
  }, [])

  // Durée de repos retenue de la dernière fois.
  const [reposDefaut, setReposDefaut] = useState(REPOS_DEFAUT_S)
  useEffect(() => {
    const garde = Number(localStorage.getItem(CLE_REPOS))
    if (Number.isFinite(garde) && garde >= REPOS_MIN_S && garde <= REPOS_MAX_S) setReposDefaut(garde)
  }, [])

  /* ---- Chrono ---- */
  useEffect(() => {
    if (etape !== 'seance' || live?.fin) return
    const t = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(t)
  }, [etape, live?.fin])

  // Fin du repos : un son et une vibration, une seule fois par repos.
  const reposAnnonce = useRef<number | null>(null)
  useEffect(() => {
    if (!live?.reposDebut || live.fin) return
    const cible = (live.reposCible ?? reposDefaut) * 1000
    if (maintenant - live.reposDebut >= cible && reposAnnonce.current !== live.reposDebut) {
      reposAnnonce.current = live.reposDebut
      sonFinRepos()
      vibrer(60)
    }
  }, [maintenant, live, reposDefaut])

  const enregistrer = useCallback(
    (suivant: SeanceLive | null) => {
      setLive(suivant)
      try {
        if (suivant) localStorage.setItem(cle, JSON.stringify(suivant))
        else localStorage.removeItem(cle)
      } catch {
        // Stockage saturé ou refusé : la séance continue en
        // mémoire, seule la reprise après fermeture est perdue.
      }
    },
    [cle]
  )

  const nomExo = (id: string) => exercices.find((e) => e.id === id)?.nom ?? '—'

  /* ---- Démarrage ---- */
  function lancer(modele: Modele) {
    const valides = modele.entrees.filter((e) =>
      exercices.some((x) => x.id === e.id)
    )
    if (valides.length === 0) {
      setErreur("Ce modèle n'a plus d'exercice valide.")
      return
    }
    setErreur(null)

    localStorage.setItem(CLE_ECHAUFFEMENT, String(minutes))

    enregistrer({
      nom: modele.nom,
      debut: Date.now(),
      fin: null,
      reposDebut: null,
      index: 0,
      note: '',
      echauffementFin: minutes > 0 ? Date.now() + minutes * 60000 : null,
      blocs: valides.map((e) => ({
        exerciceId: e.id,
        alternatives: e.alternatives.filter((a) =>
          exercices.some((x) => x.id === a)
        ),
        series: [{ poids: '', reps: '', faite: false }],
        termine: false,
      })),
    })
    setEtape('seance')
  }

  /* ---- Écrans ---- */

  if (recap) {
    return (
      <RecapXP
        {...recap}
        onContinuer={() => {
          router.push('/')
          router.refresh()
        }}
      />
    )
  }

  if (etape === 'reprise' && live) {
    const minutes = Math.round((Date.now() - live.debut) / 60000)
    const delai =
      minutes < 1
        ? "à l'instant"
        : minutes < 60
          ? `il y a ${minutes} min`
          : `il y a ${Math.round(minutes / 60)} h`

    return (
      <Cadre titre="Séance en cours">
        <p className="mb-6 text-[16px] leading-relaxed text-encre-douce">
          Ta séance « {live.nom} » a commencé {delai} et n&apos;est pas terminée.
        </p>
        <div className="flex flex-col gap-2">
          <BoutonPlein onClick={() => setEtape('seance')}>Reprendre</BoutonPlein>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Abandonner cette séance ? Rien ne sera enregistré.')) return
              enregistrer(null)
              setEtape('choix')
              void finirLive()
            }}
            className="h-12 text-[16px] font-semibold text-encre-douce transition-colors hover:text-encre"
          >
            Abandonner
          </button>
        </div>
      </Cadre>
    )
  }

  if (etape === 'choix' || !live) {
    if (modeles.length === 0) {
      return (
        <Cadre titre="Démarrer">
          <p className="mb-6 text-[16px] leading-relaxed text-encre-douce">
            Tu n&apos;as pas encore de modèle. Crée-en un dans l&apos;onglet Modèles :
            c&apos;est lui qui te guidera en salle.
          </p>
          <BoutonPlein onClick={() => router.push('/seances?onglet=modeles')}>
            Créer un modèle
          </BoutonPlein>
        </Cadre>
      )
    }

    const choisi = modeleChoisi ?? modeles[0]
    const prevu = modeles.find((m) => m.id === prevuId) ?? null
    const autres = modeles.filter((m) => m.id !== prevu?.id)

    return (
      <main className="securise mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-4 pb-7">
        <div className="flex h-11 items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/')}
            aria-label="Fermer"
            className="-ml-2 flex h-11 w-11 items-center justify-center text-encre"
          >
            <IconeCroix className="h-[22px] w-[22px]" />
          </button>
          <button
            type="button"
            onClick={() => router.push('/seances?ajout=muscu')}
            className="px-0.5 py-2.5 text-[15px] font-semibold text-encre-douce hover:text-encre"
          >
            Saisir après coup
          </button>
        </div>

        <h1 className="mx-0.5 titre-page">Démarrer</h1>

        {erreur && <Alerte>{erreur}</Alerte>}

        {prevu && (
          <button
            type="button"
            aria-pressed={choisi.id === prevu.id}
            onClick={() => setModeleChoisi(prevu)}
            className={`appui flex flex-col gap-2.5 rounded-carte bg-verre p-[18px] text-left ${
              choisi.id === prevu.id ? 'ring-2 ring-accent ring-inset' : ''
            }`}
          >
            <span className="flex w-full items-center justify-between">
              <span className="font-mono text-[12px] tracking-[0.08em] text-accent-clair uppercase">
                Prévu aujourd&apos;hui
              </span>
              <Pastille choisie={choisi.id === prevu.id} />
            </span>
            <span className="font-display text-[44px] leading-[0.85]">{prevu.nom}</span>
            <span className="text-[15px] leading-snug text-encre-douce">
              {prevu.entrees.map((e) => nomExo(e.id)).join(' · ')}
            </span>
          </button>
        )}

        {autres.length > 0 && (
          <div className="flex flex-col">
            <p className="px-0.5 pt-1 pb-1.5 text-[17px] font-bold">
              {prevu ? 'Mes modèles' : 'Choisis ton modèle'}
            </p>
            {autres.map((m) => {
              const actif = choisi.id === m.id
              const derniere = seances.find((s) => s.nom === m.nom)
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setModeleChoisi(m)}
                  className="appui flex min-h-16 items-center gap-3.5 px-0.5 text-left"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[17px] font-semibold">{m.nom}</span>
                    <span className="truncate text-[14px] text-encre-douce">
                      {m.entrees.length} exo{m.entrees.length > 1 ? 's' : ''}
                      {derniere ? ` · ${ilYA(derniere.date)}` : ''}
                    </span>
                  </span>
                  <Pastille choisie={actif} />
                </button>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <p className="px-0.5 text-[17px] font-bold">Échauffement</p>
          <div className="grid grid-cols-3 gap-2">
            {DUREES_ECHAUFFEMENT.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                aria-pressed={minutes === m}
                className={`appui h-12 rounded-bloc text-[15px] transition-colors ${
                  minutes === m
                    ? 'bg-encre font-semibold text-fond'
                    : 'bg-verre text-encre-douce hover:text-encre'
                }`}
              >
                {m === 0 ? 'Aucun' : `${m} min`}
              </button>
            ))}
          </div>
          <p className="px-0.5 text-[13px] leading-relaxed text-encre-douce">
            Un décompte plein écran avant de commencer. Ce choix est retenu.
          </p>
        </div>

        <div className="flex-1" />

        <BoutonPlein onClick={() => lancer(choisi)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" />
          </svg>
          Commencer · {choisi.nom}
        </BoutonPlein>
      </main>
    )
  }

  /* ---- La séance ---- */

  const total = live.blocs.length
  const faits = live.blocs.filter((b) => b.termine).length
  const finie = live.blocs.every((b) => b.termine)

  function majBloc(i: number, transforme: (b: BlocLive) => BlocLive) {
    enregistrer({
      ...live!,
      blocs: live!.blocs.map((b, j) => (j === i ? transforme(b) : b)),
    })
  }

  function validerSerie(iSerie: number) {
    const bloc = live!.blocs[live!.index]
    const s = bloc.series[iSerie]

    if (s.poids === '' || s.reps === '') {
      sonRefus()
      vibrer(40)
      setRefusees((r) => [...new Set([...r, iSerie])])
      // Le rouge s'efface après un instant : c'est un signal, pas
      // un état durable.
      setTimeout(() => setRefusees((r) => r.filter((x) => x !== iSerie)), 1600)
      return
    }

    setRefusees((r) => r.filter((x) => x !== iSerie))
    setErreur(null)

    if (!s.faite) {
      sonValide()
      vibrer(12)
    }

    const faite = !s.faite
    const blocs = live!.blocs.map((b, j) =>
      j === live!.index
        ? {
            ...b,
            series: b.series.map((x, k) =>
              k === iSerie ? { ...x, faite } : x
            ),
          }
        : b
    )

    // Valider une série relance le repos à zéro : c'est le geste
    // qui marque la fin de l'effort, il n'y a donc pas de bouton
    // dédié.
    enregistrer({
      ...live!,
      blocs,
      reposDebut: faite ? Date.now() : live!.reposDebut,
    })
  }

  function exerciceSuivant() {
    const blocs = live!.blocs.map((b, j) =>
      j === live!.index
        ? {
            ...b,
            series: b.series.filter(
              (s) => s.poids !== '' && s.reps !== '' && Number(s.reps) > 0
            ),
            termine: true,
          }
        : b
    )
    const prochain = blocs.findIndex((b) => !b.termine)
    // Le repos continue d'un exercice à l'autre : on se repose
    // entre deux mouvements comme entre deux séries, et le
    // remettre à zéro ici faisait perdre le décompte en cours.
    enregistrer({
      ...live!,
      blocs,
      index: prochain === -1 ? blocs.length : prochain,
    })
    setRefusees([])
    sonExerciceSuivant()
    vibrer(18)
    window.scrollTo({ top: 0 })
  }

  function repousser() {
    const blocs = [...live!.blocs]
    const [bloc] = blocs.splice(live!.index, 1)
    blocs.push(bloc)
    const index = live!.index >= blocs.length ? 0 : live!.index
    enregistrer({ ...live!, blocs, index })
  }

  function remplacer(nouvelId: string) {
    majBloc(live!.index, (b) => ({
      ...b,
      exerciceId: nouvelId,
      series: [{ poids: '', reps: '', faite: false }],
    }))
  }

  function terminer() {
    setErreur(null)
    const dureeSec = Math.round(dureeLive(live!) / 1000)
    const blocs = live!.blocs
      .filter((b) => b.series.length > 0)
      .map((b) => ({
        exerciceId: b.exerciceId,
        series: b.series
          .filter((s) => s.poids !== '' && s.reps !== '')
          .map((s) => ({ poids: parseFloat(s.poids), reps: parseInt(s.reps, 10) })),
      }))
      .filter((b) => b.series.length > 0)

    if (blocs.length === 0) {
      setErreur('Aucune série enregistrée.')
      return
    }

    // Le résumé est calculé avant d'effacer la séance locale.
    const volume = blocs.reduce(
      (t, b) => t + b.series.reduce((x, s) => x + s.poids * s.reps, 0),
      0
    )
    const stats: StatsSeance = {
      duree: mss(dureeSec * 1000),
      tonnage: tonnage(volume),
      series: blocs.reduce((t, b) => t + b.series.length, 0),
    }
    const titre = live!.nom || 'Séance'

    demarrer(async () => {
      const r = await enregistrerSeanceLive(
        blocs,
        live!.note.trim() || null,
        dureeSec,
        live!.nom
      )
      if (r.erreur) {
        setErreur(r.erreur)
        return
      }
      sonSeanceFinie()
      vibrer(30)
      void finirLive()
      enregistrer(null)

      // Sans XP (SQL pas encore installé, réseau coupé), on
      // revient au carnet comme avant.
      if (r.xp) {
        setRecap({ ...r.xp, titre, stats })
        window.scrollTo({ top: 0 })
      } else {
        router.push('/seances')
        router.refresh()
      }
    })
  }

  /* ---- Échauffement ---- */
  if (live.echauffementFin) {
    const restant = live.echauffementFin - maintenant
    const fini = restant <= 0

    // Le son ne part qu'une fois : sans ce garde-fou il se
    // rejouerait à chaque battement du chrono.
    if (fini && !echauffementAnnonce) {
      setEchauffementAnnonce(true)
      sonFinRepos()
      vibrer(60)
    }

    return (
      <main
        className="securise flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgb(255 75 43 / 0.22), transparent 55%)',
        }}
      >
        <Encouragements debut={live.debut} actif />

        <p
          className={`font-mono text-[13px] tracking-[0.1em] uppercase ${
            fini ? 'text-accent-2' : 'text-accent-clair'
          }`}
        >
          {fini ? 'Prêt' : 'Échauffement'}
        </p>

        <p
          className={`font-display text-[clamp(7rem,34vw,13rem)] leading-[0.8] ${
            fini ? 'text-accent-2' : 'text-accent'
          }`}
        >
          {fini ? '0:00' : mss(restant)}
        </p>

        <p className="max-w-xs text-[16px] leading-relaxed text-encre-douce">
          {fini
            ? 'Échauffement terminé. Tu peux attaquer.'
            : 'Mobilité, cardio léger, séries à vide : ce qui te met en condition.'}
        </p>

        <div className="mt-4 flex w-full max-w-xs flex-col gap-2.5">
          <button
            type="button"
            onClick={() => enregistrer({ ...live, echauffementFin: null })}
            className={`appui h-14 rounded-bloc text-[17px] font-bold transition-colors ${
              fini
                ? 'bg-accent text-white hover:bg-accent-clair'
                : 'bg-verre text-encre hover:bg-verre-fort'
            }`}
          >
            {fini ? 'Commencer la séance' : "Passer l'échauffement"}
          </button>
          {!fini && (
            <button
              type="button"
              onClick={() =>
                enregistrer({ ...live, echauffementFin: live.echauffementFin! + 60000 })
              }
              className="h-11 text-[15px] font-semibold text-encre-douce hover:text-encre"
            >
              + 1 minute
            </button>
          )}
        </div>
      </main>
    )
  }

  /* ---- Bilan avant enregistrement ---- */
  if (finie) {
    if (!live.fin) enregistrer({ ...live, fin: Date.now(), reposDebut: null })

    const avecSeries = live.blocs.filter((b) => b.series.length > 0)
    const volume = live.blocs.reduce(
      (t, b) =>
        t +
        b.series.reduce(
          (x, s) => x + (parseFloat(s.poids) || 0) * (parseInt(s.reps, 10) || 0),
          0
        ),
      0
    )
    const nbSeries = avecSeries.reduce((t, b) => t + b.series.length, 0)

    return (
      <main className="securise mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-6 pb-7">
        <div className="px-0.5">
          <p className="font-mono text-[12px] tracking-[0.08em] text-accent-clair uppercase">
            Séance terminée
          </p>
          <h1 className="mt-1.5 titre-page">{live.nom || 'Séance'}</h1>
        </div>

        <div className="grid grid-cols-3 text-center">
          <Stat valeur={mss(dureeLive(live))} libelle="durée" />
          <Stat valeur={tonnage(volume)} libelle="soulevées" />
          <Stat valeur={String(nbSeries)} libelle="séries" />
        </div>

        <ul className="flex flex-col">
          {avecSeries.map((b) => (
            <li key={b.exerciceId} className="py-2.5">
              <p className="text-[17px] font-semibold">{nomExo(b.exerciceId)}</p>
              <p className="mt-0.5 font-mono text-[14px] text-encre-douce">
                {b.series.map((s) => `${s.poids}×${s.reps}`).join('  ·  ')}
              </p>
            </li>
          ))}
        </ul>

        <label className="block">
          <span className="sr-only">Note de séance</span>
          <textarea
            value={live.note}
            onChange={(e) => enregistrer({ ...live, note: e.target.value })}
            rows={2}
            maxLength={280}
            placeholder="Une note ? ex : jambes lourdes mais record au squat"
            className="w-full resize-none rounded-carte border border-transparent bg-verre px-4 py-3.5
                       text-base placeholder:text-encre-douce/60 focus:border-accent focus:outline-none"
          />
        </label>

        {erreur && <Alerte>{erreur}</Alerte>}

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            disabled={enCours}
            onClick={terminer}
            className="appui h-[58px] rounded-carte bg-accent text-[17px] font-bold text-white
                       transition-colors hover:bg-accent-clair disabled:opacity-50"
          >
            {enCours ? 'Enregistrement…' : 'Enregistrer la séance'}
          </button>
          <button
            type="button"
            onClick={() => {
              const dernier = live.blocs
                .map((b, i) => ({ b, i }))
                .filter((x) => x.b.termine)
                .pop()
              if (!dernier) return
              enregistrer({
                ...live,
                fin: null,
                index: dernier.i,
                blocs: live.blocs.map((b, j) => (j === dernier.i ? { ...b, termine: false } : b)),
              })
            }}
            className="h-12 text-[16px] font-semibold text-encre-douce hover:text-encre"
          >
            Revenir en arrière
          </button>
        </div>
      </main>
    )
  }

  /* ---- Exercice en cours ---- */

  const bloc = live.blocs[live.index]
  const exo = exercices.find((e) => e.id === bloc.exerciceId)
  const groupe = GROUPES.find((g) => g.cle === exo?.groupe)?.nom
  const derniere = dernierPassage(seances, bloc.exerciceId)
  const saisies = bloc.series
    .map((x) => ({ poids: parseFloat(x.poids), reps: parseInt(x.reps, 10) }))
    .filter((x) => Number.isFinite(x.poids) && Number.isFinite(x.reps))

  const rmSeance = meilleur1RM(saisies)
  const rmPasse = derniere ? meilleur1RM(derniere.series) : null

  const disponibles = exercices.filter((e) => !live.blocs.some((b) => b.exerciceId === e.id))
  const alternatives = bloc.alternatives.filter((a) => disponibles.some((e) => e.id === a))
  const courante = bloc.series.findIndex((s) => !s.faite)
  const restants = live.blocs.filter((b, i) => !b.termine && i !== live.index).length
  const precedent = live.index > 0 ? live.index - 1 : -1

  function saisir(i: number, champ: 'poids' | 'reps', v: string) {
    const propre =
      champ === 'poids' ? v.replace(',', '.').replace(/[^\d.]/g, '') : v.replace(/\D/g, '')
    majBloc(live!.index, (b) => ({
      ...b,
      series: b.series.map((x, k) => (k === i ? { ...x, [champ]: propre } : x)),
    }))
  }

  function indice(i: number, champ: 'poids' | 'reps') {
    const s = derniere?.series[i] ?? derniere?.series.at(-1)
    return s ? String(s[champ]) : champ === 'poids' ? 'kg' : 'reps'
  }

  function revenir() {
    if (precedent < 0) return
    enregistrer({
      ...live!,
      index: precedent,
      blocs: live!.blocs.map((b, j) => (j === precedent ? { ...b, termine: false } : b)),
    })
    setRefusees([])
    window.scrollTo({ top: 0 })
  }

  // Bouton « Terminer » du haut : tout ce qui est saisi est gardé,
  // le reste est passé. On arrive sur le bilan, d'où l'on peut revenir.
  function toutTerminer() {
    if (
      !confirm(
        'Terminer la séance maintenant ?\n\nLes exercices non commencés seront ignorés.'
      )
    )
      return
    enregistrer({
      ...live!,
      blocs: live!.blocs.map((b) => ({
        ...b,
        series: b.series.filter((s) => s.poids !== '' && s.reps !== '' && Number(s.reps) > 0),
        termine: true,
      })),
    })
  }

  /* Repos : compte à rebours vers la durée visée. */
  const cible = live.reposCible ?? reposDefaut
  const ecoule = live.reposDebut ? (maintenant - live.reposDebut) / 1000 : 0
  const reste = cible - ecoule

  function ajusterRepos(delta: number) {
    const nouvelle = Math.min(REPOS_MAX_S, Math.max(REPOS_MIN_S, cible + delta))
    try {
      localStorage.setItem(CLE_REPOS, String(nouvelle))
    } catch {
      // Stockage refusé : la durée vaut pour cette séance seulement.
    }
    setReposDefaut(nouvelle)
    enregistrer({ ...live!, reposCible: nouvelle })
  }

  return (
    <div className="plein-ecran securise-haut flex flex-col">
      {/* Signal « en séance » pour les amis et smileys reçus.
          Rien du contenu de la séance ne quitte l'appareil. */}
      <Encouragements debut={live.debut} actif />

      <header className="mx-auto flex h-[60px] w-full max-w-xl shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Réduire la séance (elle reste en cours)"
          className="appui flex h-11 w-11 items-center justify-center rounded-bloc bg-verre"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <p className="flex items-center gap-2" aria-label="Durée de la séance">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="font-mono text-[20px] font-medium tabular-nums">
            {mss(live.fin ? dureeLive(live) : maintenant - live.debut)}
          </span>
        </p>
        <button
          type="button"
          onClick={toutTerminer}
          className="appui h-11 rounded-bloc bg-verre px-4 text-[15px] font-semibold"
        >
          Terminer
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 overflow-y-auto px-4 pt-1 pb-6">
        {/* Exercice */}
        <div className="px-1 pt-1">
          <div
            className="mb-3.5 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
            aria-label={`${faits} exercice${faits > 1 ? 's' : ''} terminé${faits > 1 ? 's' : ''} sur ${total}`}
          >
            {live.blocs.map((b, i) => (
              <span
                key={`${b.exerciceId}-${i}`}
                className={`h-1 rounded-pilule ${
                  i === live.index ? 'bg-accent' : b.termine ? 'bg-valide' : 'bg-encre/10'
                }`}
              />
            ))}
          </div>
          <p className="font-mono text-[12px] tracking-[0.08em] text-encre-douce uppercase">
            {live.index + 1} / {total}
            {groupe ? ` · ${groupe}` : ''}
          </p>
          <h1 className="mt-1.5 text-[clamp(2.6rem,13vw,3.4rem)] leading-[0.88]">
            {nomExo(bloc.exerciceId)}
          </h1>
          <p className="mt-2 font-mono text-[14px] text-encre-douce">
            {derniere
              ? `Dernière fois · ${derniere.series.map((x) => `${x.poids}×${x.reps}`).join(', ')}`
              : 'Première fois sur cet exercice'}
          </p>
          {rmSeance !== null && (
            <p className="mt-1 font-mono text-[14px] text-accent-2">
              1RM estimé {rmSeance} kg
              {rmPasse !== null && rmSeance !== rmPasse && (
                <span className="text-encre-douce">
                  {' '}
                  · {rmSeance > rmPasse ? '+' : ''}
                  {Math.round((rmSeance - rmPasse) * 10) / 10} vs dernière
                </span>
              )}
            </p>
          )}
        </div>

        {/* Séries */}
        <div className="rounded-carte bg-verre px-3.5 py-1.5">
          {bloc.series.map((s, i) => {
            const refusee = refusees.includes(i)

            if (s.faite) {
              return (
                <div
                  key={i}
                  className="grid h-[54px] grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_52px] items-center gap-2"
                >
                  <span className="font-mono text-[14px] text-encre-douce">{i + 1}</span>
                  <span className="text-[24px] font-semibold text-encre/80">
                    {s.poids.replace('.', ',')}{' '}
                    <span className="text-[13px] font-normal text-encre-douce">kg</span>
                  </span>
                  <span className="text-[24px] font-semibold text-encre/80">
                    {s.reps} <span className="text-[13px] font-normal text-encre-douce">reps</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => validerSerie(i)}
                    aria-label={`Annuler la série ${i + 1}`}
                    className="impulsion flex h-11 w-11 items-center justify-center rounded-[12px] bg-valide/15 text-valide"
                  >
                    <IconeCoche className="h-5 w-5" />
                  </button>
                </div>
              )
            }

            if (i === courante) {
              return (
                <div
                  key={i}
                  className="-mx-2 my-0.5 grid h-[84px] grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_52px] items-center gap-2 rounded-[16px] bg-accent/12 px-2"
                >
                  <span className="font-mono text-[14px] text-accent-clair">{i + 1}</span>
                  <label className="block">
                    <span className="sr-only">Charge série {i + 1}, en kilos</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.poids}
                      onChange={(e) => saisir(i, 'poids', e.target.value)}
                      placeholder={indice(i, 'poids')}
                      className={`h-[60px] w-full rounded-bloc border-2 bg-fond text-center font-display text-[44px] leading-none
                                  placeholder:text-encre-douce/35 focus:outline-none ${
                                    refusee && s.poids === '' ? 'border-refus' : 'border-transparent focus:border-accent'
                                  }`}
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Répétitions série {i + 1}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={s.reps}
                      onChange={(e) => saisir(i, 'reps', e.target.value)}
                      placeholder={indice(i, 'reps')}
                      className={`h-[60px] w-full rounded-bloc border-2 bg-fond text-center font-display text-[44px] leading-none
                                  placeholder:text-encre-douce/35 focus:outline-none ${
                                    refusee && s.reps === '' ? 'border-refus' : 'border-transparent focus:border-accent'
                                  }`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => validerSerie(i)}
                    aria-label={`Valider la série ${i + 1}`}
                    className={`appui flex h-[60px] w-[52px] items-center justify-center rounded-bloc text-white transition-colors ${
                      refusee ? 'tremblement bg-refus' : 'bg-accent hover:bg-accent-clair'
                    }`}
                  >
                    {refusee ? <IconeCroix className="h-6 w-6" /> : <IconeCoche className="h-6 w-6" />}
                  </button>
                </div>
              )
            }

            // Séries à venir : modifiables, plus discrètes.
            return (
              <div
                key={i}
                className="grid h-[54px] grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_52px] items-center gap-2 text-encre-douce"
              >
                <span className="font-mono text-[14px]">{i + 1}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={s.poids}
                  onChange={(e) => saisir(i, 'poids', e.target.value)}
                  placeholder={indice(i, 'poids')}
                  aria-label={`Charge série ${i + 1}, en kilos`}
                  className="h-11 w-full min-w-0 rounded-[12px] bg-transparent px-1 text-[24px] font-semibold
                             placeholder:text-encre-douce/40 focus:bg-fond focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={s.reps}
                  onChange={(e) => saisir(i, 'reps', e.target.value)}
                  placeholder={indice(i, 'reps')}
                  aria-label={`Répétitions série ${i + 1}`}
                  className="h-11 w-full min-w-0 rounded-[12px] bg-transparent px-1 text-[24px] font-semibold
                             placeholder:text-encre-douce/40 focus:bg-fond focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    majBloc(live.index, (b) => ({
                      ...b,
                      series: b.series.filter((_, k) => k !== i),
                    }))
                  }
                  aria-label={`Supprimer la série ${i + 1}`}
                  className="flex h-11 w-11 items-center justify-center text-encre-douce/50 hover:text-accent"
                >
                  <IconeCroix className="h-4 w-4" />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() =>
              majBloc(live.index, (b) => ({
                ...b,
                series: [
                  ...b.series,
                  {
                    poids: b.series[b.series.length - 1]?.poids ?? '',
                    reps: b.series[b.series.length - 1]?.reps ?? '',
                    faite: false,
                  },
                ],
              }))
            }
            className="flex h-12 w-full items-center gap-2 px-1 text-[15px] font-semibold text-encre-douce
                       transition-colors hover:text-encre"
          >
            <span aria-hidden className="text-[20px] leading-none">+</span> Ajouter une série
          </button>
        </div>

        {/* Repos */}
        {live.reposDebut && (
          <div className="flex items-center gap-3 rounded-carte bg-verre py-3.5 pr-3.5 pl-[18px]" role="timer">
            <div className="flex flex-1 flex-col gap-2">
              <p className="flex items-baseline gap-2">
                <span
                  className={`font-display text-[40px] leading-[0.85] ${
                    reste > 0 ? 'text-accent-2' : 'text-accent'
                  }`}
                >
                  {reste > 0 ? mss(reste * 1000) : 'Go'}
                </span>
                <span className="font-mono text-[13px] text-encre-douce">
                  {reste > 0 ? 'repos' : `repos fini · +${mss(-reste * 1000)}`}
                </span>
              </p>
              <span className="h-1.5 overflow-hidden rounded-pilule bg-encre/10">
                <span
                  className={`block h-full transition-[width] duration-1000 ease-linear ${
                    reste > 0 ? 'bg-accent-2' : 'bg-accent'
                  }`}
                  style={{ width: `${Math.min(100, (ecoule / cible) * 100)}%` }}
                />
              </span>
            </div>
            {reste > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => ajusterRepos(-15)}
                  aria-label="Retirer 15 secondes"
                  className="appui h-12 w-12 rounded-bloc bg-encre/[0.06] font-mono text-[14px]"
                >
                  −15
                </button>
                <button
                  type="button"
                  onClick={() => ajusterRepos(15)}
                  aria-label="Ajouter 15 secondes"
                  className="appui h-12 w-12 rounded-bloc bg-encre/[0.06] font-mono text-[14px]"
                >
                  +15
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => enregistrer({ ...live, reposDebut: null })}
                aria-label="Fermer le repos"
                className="appui flex h-12 w-12 items-center justify-center rounded-bloc bg-encre/[0.06]"
              >
                <IconeCroix className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Machine prise, ou exercice à repousser */}
        {(alternatives.length > 0 || restants > 0) && (
          <div className="flex flex-wrap items-center gap-2 px-0.5 pt-1">
            {alternatives.length > 0 && (
              <span className="text-[14px] text-encre-douce">Machine prise ?</span>
            )}
            {alternatives.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => remplacer(id)}
                className="appui h-10 rounded-pilule bg-verre px-4 text-[14px] font-semibold
                           transition-colors hover:text-accent-2"
              >
                {nomExo(id)}
              </button>
            ))}
            {restants > 0 && (
              <button
                type="button"
                onClick={repousser}
                className="appui h-10 rounded-pilule bg-verre px-4 text-[14px] font-semibold text-encre-douce
                           transition-colors hover:text-encre"
              >
                Faire plus tard
              </button>
            )}
          </div>
        )}
      </div>

      {erreur && (
        <p className="mx-4 mb-2 rounded-bloc bg-accent/10 px-4 py-2.5 font-mono text-xs text-accent">
          {erreur}
        </p>
      )}

      {/* Bas : le pouce y arrive sans lâcher la barre. */}
      <div className="marge-basse mx-auto flex w-full max-w-xl shrink-0 gap-2 px-4 pt-1">
        <button
          type="button"
          onClick={revenir}
          disabled={precedent < 0}
          aria-label="Exercice précédent"
          className="appui flex h-14 w-14 items-center justify-center rounded-[16px] bg-verre disabled:opacity-35"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={exerciceSuivant}
          className={`appui flex h-14 flex-1 items-center justify-center gap-2 rounded-[16px] text-[16px] font-semibold transition-colors ${
            restants === 0 && courante === -1
              ? 'bg-accent text-white hover:bg-accent-clair'
              : 'bg-verre hover:bg-verre-fort'
          }`}
        >
          {restants === 0 ? 'Finir la séance' : 'Exercice suivant'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ---- Pièces ---- */

function Cadre({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className="securise flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-carte bg-verre p-6">
        <h1 className="mb-4 text-[44px] leading-[0.9]">{titre}</h1>
        {children}
      </div>
    </main>
  )
}

function BoutonPlein({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="appui flex h-[58px] w-full items-center justify-center gap-2 rounded-carte bg-accent
                 px-5 text-[17px] font-bold text-white transition-colors hover:bg-accent-clair"
    >
      <span className="flex min-w-0 items-center gap-2 truncate">{children}</span>
    </button>
  )
}

function Pastille({ choisie }: { choisie: boolean }) {
  return choisie ? (
    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-accent text-white">
      <IconeCoche className="h-[15px] w-[15px]" />
    </span>
  ) : (
    <span className="h-[26px] w-[26px] shrink-0 rounded-full border-[1.5px] border-encre/20" />
  )
}

/** « il y a 2 j », « hier », « aujourd'hui ». */
function ilYA(iso: string) {
  const jours = Math.round(
    (new Date(new Date().toDateString()).getTime() - new Date(iso + 'T00:00:00').getTime()) / 86400000
  )
  if (jours <= 0) return "aujourd'hui"
  if (jours === 1) return 'hier'
  return `il y a ${jours} j`
}

function Stat({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div>
      <p className="font-display text-[36px] leading-none">{valeur}</p>
      <p className="mt-0.5 text-[13px] text-encre-douce">{libelle}</p>
    </div>
  )
}

/** « 1:24 », « 54:10 », « 1:05:30 » */
function mss(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = String(t % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** « 840 kg », « 14,2 t » */
function tonnage(kg: number) {
  return kg >= 1000
    ? `${(kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`
    : `${Math.round(kg)} kg`
}

function Alerte({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-bloc border border-accent/40 bg-accent/10 px-4 py-3
                 font-mono text-xs text-accent"
    >
      {children}
    </p>
  )
}

/** Séries du dernier passage sur cet exercice. */
function dernierPassage(seances: SeanceComplete[], exerciceId: string) {
  for (const s of [...seances].sort((a, b) => b.date.localeCompare(a.date))) {
    const bloc = s.blocs.find((b) => b.exerciceId === exerciceId)
    if (bloc?.series.length) return { date: s.date, series: bloc.series }
  }
  return null
}
