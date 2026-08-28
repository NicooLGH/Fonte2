'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  cleLive,
  dureeLive,
  mmss,
  DUREE_MAX_MS,
  type BlocLive,
  type Modele,
  type SeanceLive,
} from '@/lib/live'
import type { Exercice, SeanceComplete } from '@/lib/carnet'
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

type Etape = 'choix' | 'reprise' | 'seance'

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
  const [maintenant, setMaintenant] = useState(Date.now())
  const [erreur, setErreur] = useState<string | null>(null)
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

  /* ---- Chrono ---- */
  useEffect(() => {
    if (etape !== 'seance' || live?.fin) return
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
  function demarrerModele(modele: Modele) {
    const valides = modele.entrees.filter((e) =>
      exercices.some((x) => x.id === e.id)
    )
    if (valides.length === 0) {
      setErreur("Ce modèle n'a plus d'exercice valide.")
      return
    }

    enregistrer({
      nom: modele.nom,
      debut: Date.now(),
      fin: null,
      reposDebut: null,
      index: 0,
      note: '',
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
            className="rounded-full bg-accent px-6 py-3.5 font-semibold text-white
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
            className="rounded-full border border-bordure bg-verre px-6 py-3
                       text-sm font-semibold text-encre-douce transition-colors
                       hover:text-encre"
          >
            Abandonner
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
              className="w-full rounded-full bg-accent px-6 py-3.5 font-semibold
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
                  onClick={() => demarrerModele(m)}
                  className="rounded-2xl border border-bordure bg-verre p-4 text-left
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
      setErreur('Renseigne le poids et les répétitions.')
      return
    }
    setErreur(null)

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
    enregistrer({
      ...live!,
      blocs,
      index: prochain === -1 ? blocs.length : prochain,
      reposDebut: null,
    })
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
      enregistrer(null)
      router.push('/seances')
      router.refresh()
    })
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
            className="w-full resize-y rounded-2xl border border-bordure bg-verre
                       px-4 py-3 text-sm focus:border-accent focus:outline-none"
          />
        </label>

        {erreur && <Alerte>{erreur}</Alerte>}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={enCours}
            onClick={terminer}
            className="rounded-full bg-accent px-6 py-3.5 font-semibold text-white
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
            className="rounded-full border border-bordure bg-verre px-6 py-3 text-sm
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
  const disponibles = exercices.filter(
    (e) => !live.blocs.some((b) => b.exerciceId === e.id)
  )
  const alternatives = bloc.alternatives.filter((a) =>
    disponibles.some((e) => e.id === a)
  )

  return (
    <div className="flex min-h-dvh flex-col">
      {/* En-tête */}
      <header className="shrink-0 border-b border-filet px-5 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-4 pr-12">
          <p className="truncate font-display text-2xl uppercase">{live.nom}</p>
          <p className="shrink-0 font-mono text-sm text-accent-2">
            {mmss(live.fin ? dureeLive(live) : maintenant - live.debut)}
          </p>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-verre-fort">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${(faits / total) * 100}%` }}
          />
        </div>
      </header>

      <button
        type="button"
        onClick={() => router.push('/seances')}
        aria-label="Quitter"
        className="absolute right-4 top-3 z-10 flex h-9 w-9 items-center justify-center
                   rounded-full bg-verre text-xs text-encre-douce hover:text-encre"
      >
        ✕
      </button>

      {/* Corps */}
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 pb-8 pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent-2">
          Exercice {live.index + 1} sur {total}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{nomExo(bloc.exerciceId)}</h1>

        <div className="mt-5 rounded-2xl border border-accent-2/30 bg-accent-2/[0.07] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-encre-douce">
            {derniere ? `La dernière fois · ${derniere.date}` : 'Première fois sur cet exercice'}
          </p>
          {derniere && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {derniere.series.map((s, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-accent-2/10 px-2.5 py-1 font-mono text-xs text-accent-2"
                >
                  {s.poids} kg × {s.reps}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Séries */}
        <div className="mt-5 flex flex-col gap-2.5">
          {bloc.series.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-2xl border p-3 ${
                s.faite
                  ? 'border-accent-2/40 bg-accent-2/[0.07]'
                  : 'border-bordure bg-verre'
              }`}
            >
              <span className="w-6 shrink-0 font-mono text-[11px] text-encre-douce">
                #{i + 1}
              </span>
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
                placeholder="kg"
                aria-label={`Poids série ${i + 1}`}
                className="min-w-0 flex-1 rounded-xl border border-bordure bg-fond px-2 py-3
                           text-center font-display text-2xl focus:border-accent focus:outline-none"
              />
              <span className="font-mono text-xs text-encre-douce">×</span>
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
                placeholder="reps"
                aria-label={`Répétitions série ${i + 1}`}
                className="min-w-0 flex-1 rounded-xl border border-bordure bg-fond px-2 py-3
                           text-center font-display text-2xl focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => validerSerie(i)}
                aria-label={s.faite ? 'Annuler la série' : 'Valider la série'}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                  border text-base ${
                    s.faite
                      ? 'border-accent-2 bg-accent-2 text-fond'
                      : 'border-bordure bg-verre text-encre-douce'
                  }`}
              >
                ✓
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
                className="shrink-0 px-1 text-xs text-encre-douce hover:text-accent"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

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
          className="mt-3 rounded-full border border-bordure bg-verre px-4 py-2
                     text-xs font-semibold text-encre-douce hover:text-encre"
        >
          + Ajouter une série
        </button>

        {alternatives.length > 0 && (
          <div className="mt-5 rounded-2xl border border-bordure bg-verre p-4">
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-encre-douce">
              Alternatives si la machine est prise
            </p>
            <div className="flex flex-wrap gap-2">
              {alternatives.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => remplacer(id)}
                  className="rounded-full border border-bordure bg-fond px-4 py-2
                             text-sm font-semibold hover:border-accent-2 hover:text-accent-2"
                >
                  {nomExo(id)}
                </button>
              ))}
            </div>
          </div>
        )}

        {erreur && <div className="mt-4"><Alerte>{erreur}</Alerte></div>}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <BoutonAction onClick={repousser}>↻ Repousser</BoutonAction>
          <BoutonAction
            onClick={() => {
              const suivant = disponibles.find((e) => e.id !== bloc.exerciceId)
              if (suivant) remplacer(suivant.id)
            }}
            desactive={disponibles.length === 0}
          >
            Remplacer
          </BoutonAction>
          <button
            type="button"
            onClick={exerciceSuivant}
            className="col-span-2 rounded-full bg-accent px-6 py-3.5 font-semibold
                       text-white transition-colors hover:bg-accent-clair"
          >
            Exercice suivant
          </button>
        </div>

        {/* Récapitulatif */}
        <div className="mt-8 border-t border-filet pt-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.08em] text-encre-douce">
            Séance
          </p>
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

      {/* Repos */}
      {live.reposDebut && (
        <div className="shrink-0 border-t border-filet bg-accent-2/[0.07] px-5 py-4 text-center">
          <p className="font-display text-4xl text-accent-2">
            {mmss(maintenant - live.reposDebut)}
          </p>
          <p className="mb-3 mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-encre-douce">
            Repos en cours
          </p>
          <button
            type="button"
            onClick={() => enregistrer({ ...live, reposDebut: null })}
            className="rounded-full border border-bordure bg-verre px-5 py-2 text-xs
                       font-semibold text-encre-douce hover:text-encre"
          >
            Terminer le repos
          </button>
        </div>
      )}
    </div>
  )
}

/* ---- Pièces ---- */

function Cadre({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
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
      className="mb-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3
                 font-mono text-xs text-accent"
    >
      {children}
    </p>
  )
}

function BoutonAction({
  children,
  onClick,
  desactive,
}: {
  children: React.ReactNode
  onClick: () => void
  desactive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      className="rounded-full border border-bordure bg-verre px-4 py-3 text-sm
                 font-semibold transition-colors hover:bg-verre-fort
                 disabled:opacity-40"
    >
      {children}
    </button>
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
