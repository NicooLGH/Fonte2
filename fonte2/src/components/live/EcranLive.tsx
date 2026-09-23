'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  cleLive,
  dureeLive,
  mmss,
  DUREE_MAX_MS,
  DUREES_ECHAUFFEMENT,
  CLE_ECHAUFFEMENT,
  type BlocLive,
  type Modele,
  type SeanceLive,
} from '@/lib/live'
import type { Exercice, SeanceComplete } from '@/lib/carnet'
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

type Etape = 'choix' | 'reprise' | 'preparation' | 'seance'

export function EcranLive({
  userId,
  modeles,
  exercices,
  seances,
}: {
  userId: string
  modeles: Modele[]
  exercices: Exercice[]
  seances: SeanceComplete[]
}) {
  const router = useRouter()
  const [live, setLive] = useState<SeanceLive | null>(null)
  const [etape, setEtape] = useState<Etape>('choix')
  const [modeleChoisi, setModeleChoisi] = useState<Modele | null>(null)
  const [minutes, setMinutes] = useState(0)
  const [maintenant, setMaintenant] = useState(Date.now())
  const [erreur, setErreur] = useState<string | null>(null)
  // Séries dont la validation a échoué : le rouge n'apparaît
  // qu'au moment où l'on tente de valider un champ vide, pas sur
  // toutes les séries à venir.
  const [refusees, setRefusees] = useState<number[]>([])
  const [echauffementAnnonce, setEchauffementAnnonce] = useState(false)
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
      setEtape('reprise')
    } catch {
      // Contenu illisible : on repart à zéro plutôt que de planter
      localStorage.removeItem(cle)
    }
  }, [cle])

  // La durée d'échauffement retenue de la dernière fois : on ne
  // la redemande pas à chaque séance.
  useEffect(() => {
    const garde = Number(localStorage.getItem(CLE_ECHAUFFEMENT))
    if (Number.isFinite(garde) && garde > 0) setMinutes(garde)
  }, [])

  /* ---- Chrono ---- */
  useEffect(() => {
    if ((etape !== 'seance' && etape !== 'preparation') || live?.fin) return
    const t = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(t)
  }, [etape, live?.fin])

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
  function choisirModele(modele: Modele) {
    const valides = modele.entrees.filter((e) =>
      exercices.some((x) => x.id === e.id)
    )
    if (valides.length === 0) {
      setErreur("Ce modèle n'a plus d'exercice valide.")
      return
    }
    setErreur(null)
    setModeleChoisi(modele)
    setEtape('preparation')
  }

  function lancer() {
    const modele = modeleChoisi!
    const valides = modele.entrees.filter((e) =>
      exercices.some((x) => x.id === e.id)
    )

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
        <p className="mb-6 text-sm leading-relaxed text-encre-douce">
          Une séance « {live.nom} » a été commencée {delai} et n&apos;a pas été
          terminée.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setEtape('seance')}
            className="rounded-bloc bg-accent px-6 py-3.5 font-semibold text-white
                       transition-colors hover:bg-accent-clair"
          >
            Reprendre
          </button>
          <button
            type="button"
            onClick={() => {
              enregistrer(null)
              setEtape('choix')
            }}
            className="rounded-bloc border border-bordure bg-verre px-6 py-3
                       text-sm font-semibold text-encre-douce transition-colors
                       hover:text-encre"
          >
            Abandonner
          </button>
        </div>
      </Cadre>
    )
  }

  if (etape === 'preparation' && modeleChoisi) {
    return (
      <Cadre titre={modeleChoisi.nom}>
        <p className="mb-5 text-sm leading-relaxed text-encre-douce">
          {modeleChoisi.entrees.map((e) => nomExo(e.id)).join(' · ')}
        </p>

        <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
          Échauffement
        </p>
        <div className="mb-2 flex flex-wrap gap-2">
          {DUREES_ECHAUFFEMENT.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              aria-pressed={minutes === m}
              className={`rounded-bloc border px-4 py-2 text-sm font-semibold
                transition-colors ${
                  minutes === m
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-bordure bg-verre text-encre-douce hover:text-encre'
                }`}
            >
              {m === 0 ? 'Aucun' : `${m} min`}
            </button>
          ))}
        </div>
        <p className="mb-6 font-mono text-[10.5px] leading-relaxed text-encre-douce">
          Un décompte plein écran avant de commencer. Ce choix est retenu pour
          tes prochaines séances.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={lancer}
            className="rounded-bloc bg-accent px-6 py-3.5 font-semibold text-white
                       transition-colors hover:bg-accent-clair"
          >
            Commencer
          </button>
          <button
            type="button"
            onClick={() => {
              setModeleChoisi(null)
              setEtape('choix')
            }}
            className="rounded-bloc border border-bordure bg-verre px-6 py-3
                       text-sm font-semibold text-encre-douce hover:text-encre"
          >
            Changer de modèle
          </button>
        </div>
      </Cadre>
    )
  }

  if (etape === 'choix' || !live) {
    return (
      <Cadre titre="Démarrer une séance">
        {erreur && <Alerte>{erreur}</Alerte>}

        {modeles.length === 0 ? (
          <>
            <p className="mb-6 text-sm leading-relaxed text-encre-douce">
              Tu n&apos;as pas encore de modèle. Crée-en un depuis la page
              Séances : c&apos;est lui qui te guidera en salle.
            </p>
            <button
              type="button"
              onClick={() => router.push('/seances')}
              className="w-full rounded-bloc bg-accent px-6 py-3.5 font-semibold
                         text-white transition-colors hover:bg-accent-clair"
            >
              Créer un modèle
            </button>
          </>
        ) : (
          <>
            <p className="mb-5 text-sm leading-relaxed text-encre-douce">
              Choisis ton modèle. Le carnet te guidera exercice par exercice, en
              te rappelant tes charges de la dernière fois.
            </p>
            <div className="flex flex-col gap-3">
              {modeles.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => choisirModele(m)}
                  className="rounded-bloc border border-bordure bg-verre p-4 text-left
                             transition-colors hover:border-accent"
                >
                  <p className="font-semibold">{m.nom}</p>
                  <p className="mt-1 font-mono text-[11px] text-encre-douce">
                    {m.entrees.map((e) => nomExo(e.id)).join(' · ')}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => router.push('/seances')}
          className="mt-6 w-full text-center font-mono text-xs text-encre-douce
                     underline underline-offset-4"
        >
          Retour au carnet
        </button>
      </Cadre>
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

    demarrer(async () => {
      const r = await enregistrerSeanceLive(blocs, live!.note.trim() || null, dureeSec)
      if (r.erreur) {
        setErreur(r.erreur)
        return
      }
      sonSeanceFinie()
      vibrer(30)
      enregistrer(null)
      router.push('/seances')
      router.refresh()
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
      <main className="securise flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          {fini ? 'Prêt' : 'Échauffement'}
        </p>

        <p
          className={`font-display leading-[0.85] text-[clamp(6rem,28vw,12rem)] ${
            fini ? 'text-accent-2' : 'text-accent'
          }`}
        >
          {fini ? '00:00' : mmss(restant)}
        </p>

        <p className="max-w-xs text-sm leading-relaxed text-encre-douce">
          {fini
            ? 'Échauffement terminé. Tu peux attaquer.'
            : 'Mobilité, cardio léger, séries à vide — ce qui te met en condition.'}
        </p>

        <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={() => enregistrer({ ...live, echauffementFin: null })}
            className={`rounded-bloc px-6 py-3.5 font-semibold transition-colors ${
              fini
                ? 'bg-accent text-white hover:bg-accent-clair'
                : 'border border-bordure bg-verre text-encre-douce hover:text-encre'
            }`}
          >
            {fini ? 'Commencer la séance' : "Passer l'échauffement"}
          </button>
          {!fini && (
            <button
              type="button"
              onClick={() =>
                enregistrer({
                  ...live,
                  echauffementFin: live.echauffementFin! + 60000,
                })
              }
              className="font-mono text-xs text-encre-douce underline underline-offset-4"
            >
              + 1 minute
            </button>
          )}
        </div>
      </main>
    )
  }

  /* ---- Écran de fin ---- */
  if (finie) {
    if (!live.fin) enregistrer({ ...live, fin: Date.now(), reposDebut: null })

    const volume = live.blocs.reduce(
      (t, b) =>
        t +
        b.series.reduce(
          (x, s) => x + (parseFloat(s.poids) || 0) * (parseInt(s.reps, 10) || 0),
          0
        ),
      0
    )

    return (
      <Cadre titre="Séance terminée">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-2">
          {faits} exercice{faits > 1 ? 's' : ''} · {Math.round(volume)} kg ·{' '}
          {mmss(dureeLive(live))}
        </p>

        <ul className="mb-5 divide-y divide-filet">
          {live.blocs
            .filter((b) => b.series.length > 0)
            .map((b) => (
              <li
                key={b.exerciceId}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="text-sm">{nomExo(b.exerciceId)}</span>
                  <span className="mt-0.5 block font-mono text-[10.5px] text-encre-douce">
                    {b.series.map((s) => `${s.poids}×${s.reps}`).join(', ')}
                  </span>
                </span>
              </li>
            ))}
        </ul>

        <label className="mb-5 block">
          <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
            Note de séance
          </span>
          <textarea
            value={live.note}
            onChange={(e) => enregistrer({ ...live, note: e.target.value })}
            rows={3}
            maxLength={280}
            placeholder="ex : jambes lourdes mais PR au squat"
            className="w-full resize-y rounded-bloc border border-bordure bg-verre
                       px-4 py-3 text-sm focus:border-accent focus:outline-none"
          />
        </label>

        {erreur && <Alerte>{erreur}</Alerte>}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={enCours}
            onClick={terminer}
            className="rounded-bloc bg-accent px-6 py-3.5 font-semibold text-white
                       transition-colors hover:bg-accent-clair disabled:opacity-50"
          >
            {enCours ? 'Enregistrement…' : 'Enregistrer la séance'}
          </button>
          <button
            type="button"
            onClick={() => {
              const dernier = live.blocs.map((b, i) => ({ b, i })).filter((x) => x.b.termine).pop()
              if (!dernier) return
              enregistrer({
                ...live,
                fin: null,
                index: dernier.i,
                blocs: live.blocs.map((b, j) =>
                  j === dernier.i ? { ...b, termine: false } : b
                ),
              })
            }}
            className="rounded-bloc border border-bordure bg-verre px-6 py-3 text-sm
                       font-semibold text-encre-douce transition-colors hover:text-encre"
          >
            Revenir en arrière
          </button>
        </div>
      </Cadre>
    )
  }

  /* ---- Exercice en cours ---- */

  const bloc = live.blocs[live.index]
  const derniere = dernierPassage(seances, bloc.exerciceId)
  const saisies = bloc.series
    .map((x) => ({ poids: parseFloat(x.poids), reps: parseInt(x.reps, 10) }))
    .filter((x) => Number.isFinite(x.poids) && Number.isFinite(x.reps))

  const rmSeance = meilleur1RM(saisies)
  const rmPasse = derniere ? meilleur1RM(derniere.series) : null

  const disponibles = exercices.filter(
    (e) => !live.blocs.some((b) => b.exerciceId === e.id)
  )
  const alternatives = bloc.alternatives.filter((a) =>
    disponibles.some((e) => e.id === a)
  )

  return (
    <div className="plein-ecran securise-haut flex flex-col">
      {/* En-tête */}
      {/* En-tête réduit au strict nécessaire : tout l'espace
          vertical gagné va aux charges. */}
      <header className="shrink-0 border-b border-filet px-5 py-3">
        <div className="flex items-baseline justify-between gap-4 pr-12">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-encre-douce">
            {live.nom} · {live.index + 1}/{total}
          </p>
          <p className="shrink-0 font-mono text-sm text-accent-2">
            {mmss(live.fin ? dureeLive(live) : maintenant - live.debut)}
          </p>
        </div>
      </header>

      <button
        type="button"
        onClick={() => router.push('/seances')}
        aria-label="Quitter"
        className="securise-haut absolute right-3 top-0 z-10 flex h-9 w-9 items-center justify-center
                   text-sm text-encre-douce hover:text-encre"
      >
        ✕
      </button>

      {/* Corps */}
      <div
        className={`mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 pb-8 pt-6
                    transition-opacity ${live.reposDebut ? 'opacity-40' : ''}`}
      >
        <h1 className="text-4xl leading-[1.05] sm:text-5xl">
          {nomExo(bloc.exerciceId)}
        </h1>
        <p className="mt-2 font-mono text-[11px] text-encre-douce">
          {derniere
            ? `dernière fois : ${derniere.series.map((x) => `${x.poids}×${x.reps}`).join(', ')}`
            : 'première fois sur cet exercice'}
        </p>

        {/* Séries en lignes séparées plutôt qu'en cartes. Les
            chiffres gagnent en taille, ce qui compte quand
            l'écran est posé sur un banc à un mètre. */}
        <div className="mt-6 flex flex-col">
          {bloc.series.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-filet py-3"
            >
              <span
                className={`w-4 shrink-0 font-mono text-[11px] ${
                  refusees.includes(i)
                    ? 'text-refus'
                    : s.faite
                      ? 'text-valide'
                      : 'text-encre-douce'
                }`}
              >
                {i + 1}
              </span>

              <label className="min-w-0 flex-1">
                <span className="sr-only">Poids série {i + 1}</span>
                <span className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={s.poids}
                  onChange={(e) =>
                    majBloc(live.index, (b) => ({
                      ...b,
                      series: b.series.map((x, k) =>
                        k === i ? { ...x, poids: e.target.value } : x
                      ),
                    }))
                  }
                  placeholder={
                    derniere?.series[i]
                      ? String(derniere.series[i].poids)
                      : (derniere?.series.at(-1)?.poids.toString() ?? 'kg')
                  }
                  className="min-w-0 flex-1 bg-transparent font-display text-3xl
                             text-encre placeholder:text-encre-douce/35
                             focus:outline-none"
                />
                {/* L'unité juste après le chiffre : deux champs
                    nus côte à côte ne disent pas lequel est quoi. */}
                <span className="shrink-0 font-mono text-[10px] text-encre-douce">
                  kg
                </span>
                </span>
              </label>

              <label className="min-w-0 flex-1">
                <span className="sr-only">Répétitions série {i + 1}</span>
                <span className="flex items-baseline gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.reps}
                  onChange={(e) =>
                    majBloc(live.index, (b) => ({
                      ...b,
                      series: b.series.map((x, k) =>
                        k === i ? { ...x, reps: e.target.value } : x
                      ),
                    }))
                  }
                  placeholder={
                    derniere?.series[i]
                      ? String(derniere.series[i].reps)
                      : (derniere?.series.at(-1)?.reps.toString() ?? 'reps')
                  }
                  className="min-w-0 flex-1 bg-transparent font-display text-3xl
                             text-encre placeholder:text-encre-douce/35
                             focus:outline-none"
                />
                <span className="shrink-0 font-mono text-[10px] text-encre-douce">
                  rep
                </span>
                </span>
              </label>

              <button
                type="button"
                onClick={() => validerSerie(i)}
                aria-label={s.faite ? 'Annuler la série' : 'Valider la série'}
                className={`appui flex h-8 w-8 shrink-0 items-center justify-center
                  rounded-full border transition-colors ${
                    refusees.includes(i)
                      ? 'tremblement border-refus bg-refus text-fond'
                      : s.faite
                        ? 'impulsion border-valide bg-valide text-fond'
                        : 'border-bordure text-encre-douce/50'
                  }`}
              >
                {refusees.includes(i) ? (
                  <IconeCroix className="h-4 w-4" />
                ) : (
                  <IconeCoche className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  majBloc(live.index, (b) => ({
                    ...b,
                    series:
                      b.series.length > 1
                        ? b.series.filter((_, k) => k !== i)
                        : [{ poids: '', reps: '', faite: false }],
                  }))
                }
                aria-label={`Supprimer la série ${i + 1}`}
                className="shrink-0 text-xs text-encre-douce/40 hover:text-accent"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Le 1RM se met à jour pendant la saisie : il donne un
            repère immédiat sur la valeur de la série qu'on vient
            de faire, sans attendre la fin de la séance. */}
        {rmSeance !== null && (
          <div className="mt-4 flex items-baseline justify-between gap-3
                          border-b border-filet pb-3">
            <span className="section-titre">1RM estimé</span>
            <span className="text-right">
              <span className="font-display text-2xl text-accent-2">
                {rmSeance}
                <span className="ml-1 font-corps text-[10px] text-encre-douce">
                  kg
                </span>
              </span>
              {rmPasse !== null && (
                <span className="ml-3 font-mono text-[10.5px] text-encre-douce">
                  {rmSeance > rmPasse
                    ? `+${Math.round((rmSeance - rmPasse) * 10) / 10} vs dernière`
                    : rmSeance < rmPasse
                      ? `${Math.round((rmSeance - rmPasse) * 10) / 10} vs dernière`
                      : 'comme la dernière fois'}
                </span>
              )}
            </span>
          </div>
        )}

        {derniere && (
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-encre-douce/70">
            Les chiffres grisés rappellent ta dernière séance. Ils ne
            s&apos;enregistrent pas. Le 1RM est une estimation, pas une mesure.
          </p>
        )}

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
          className="w-full border-b border-filet py-3.5 text-left font-mono
                     text-[11px] text-encre-douce transition-colors hover:text-encre"
        >
          + ajouter une série
        </button>

        {alternatives.length > 0 && (
          <div className="mt-6">
            <p className="section-titre mb-2.5">Si la machine est prise</p>
            <div className="flex flex-wrap gap-2">
              {alternatives.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => remplacer(id)}
                  className="rounded-bloc bg-verre px-4 py-2 text-sm font-semibold
                             transition-colors hover:bg-verre-fort hover:text-accent-2"
                >
                  {nomExo(id)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Récapitulatif */}
        <div className="mt-8">
          <p className="section-titre mb-3">Séance</p>
          <ul className="flex flex-col gap-2">
            {live.blocs.map((b, i) => (
              <li
                key={`${b.exerciceId}-${i}`}
                className={`flex justify-between gap-3 text-sm ${
                  b.termine ? 'text-accent-2' : 'text-encre-douce'
                }`}
              >
                <span>
                  {b.termine && '✓ '}
                  {nomExo(b.exerciceId)}
                </span>
                <span className="font-mono text-[11px]">
                  {b.termine
                    ? b.series.length
                      ? `${b.series.length} série${b.series.length > 1 ? 's' : ''}`
                      : 'passé'
                    : i === live.index
                      ? 'en cours'
                      : 'à venir'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Repos : toute la largeur, chiffre en 64 px. C'est le
          moment où l'écran est posé sur un banc et regardé de
          loin — il mérite d'être lu d'un coup d'œil. */}
      {live.reposDebut && (
        <div className="shrink-0 border-t border-accent-2/40 bg-accent-2/[0.12]
                        px-5 py-5 text-center">
          <p className="section-titre text-accent-2">Repos</p>
          <p className="arrivee-valeur mt-1.5 font-display text-6xl leading-none
                        tracking-tight text-accent-2">
            {mmss(maintenant - live.reposDebut)}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                enregistrer({ ...live, reposDebut: live.reposDebut! + 30000 })
              }
              className="rounded-bloc border border-bordure px-5 py-2.5 text-xs
                         font-semibold text-encre transition-colors hover:bg-verre"
            >
              + 30 s
            </button>
            <button
              type="button"
              onClick={() => enregistrer({ ...live, reposDebut: null })}
              className="rounded-bloc bg-verre-fort px-5 py-2.5 text-xs
                         font-semibold text-encre transition-colors hover:bg-verre"
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      {erreur && (
        <p className="shrink-0 border-t border-accent/40 bg-accent/10 px-5 py-2.5
                      font-mono text-xs text-accent">
          {erreur}
        </p>
      )}

      {/* Actions collées en bas, atteignables au pouce. Un seul
          bouton orange : c'est le geste principal. */}
      <div className="shrink-0 marge-basse pb-0">
        <div className="grid grid-cols-2 gap-px bg-filet">
          <button
            type="button"
            onClick={repousser}
            className="bg-fond py-3.5 text-[13px] font-semibold text-encre-douce
                       transition-colors hover:text-encre"
          >
            Repousser
          </button>
          <button
            type="button"
            onClick={() => {
              const suivant = disponibles.find((e) => e.id !== bloc.exerciceId)
              if (suivant) remplacer(suivant.id)
            }}
            disabled={disponibles.length === 0}
            className="bg-fond py-3.5 text-[13px] font-semibold text-encre-douce
                       transition-colors hover:text-encre disabled:opacity-40"
          >
            Remplacer
          </button>
        </div>
        <button
          type="button"
          onClick={exerciceSuivant}
          className="appui w-full bg-accent py-4 text-sm font-semibold text-white
                     transition-colors hover:bg-accent-clair"
        >
          Exercice suivant
        </button>
      </div>
    </div>
  )
}

/* ---- Pièces ---- */

function Cadre({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className="securise flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-carte border border-bordure bg-verre p-6">
        <h1 className="mb-4 text-3xl">{titre}</h1>
        {children}
      </div>
    </main>
  )
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
