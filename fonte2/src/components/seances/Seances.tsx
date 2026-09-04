'use client'

import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { Bouton, Erreur } from '@/components/ui'
import { volumeSeance } from '@/lib/xp'
import type { Exercice, SeanceComplete } from '@/lib/carnet'
import {
  enregistrerSeance,
  supprimerSeance,
  type BlocSaisi,
} from '@/app/(carnet)/seances/actions'

/** Saisie possible sur les trois derniers jours. */
const JOURS_SAISIE = 3
const APERCU = 2

type SerieSaisie = { poids: string; reps: string }
type BlocEnCours = { exerciceId: string; series: SerieSaisie[] }

export function Seances({
  seances,
  exercices,
}: {
  seances: SeanceComplete[]
  exercices: Exercice[]
}) {
  const [ouvert, setOuvert] = useState(false)
  const [tout, setTout] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  const visibles = tout ? seances : seances.slice(0, APERCU)
  const reste = seances.length - visibles.length

  const nomExo = (id: string) =>
    exercices.find((e) => e.id === id)?.nom ?? '—'

  function supprimer(seance: SeanceComplete) {
    if (
      !confirm(
        `Supprimer la séance du ${seance.date} ?\n\n` +
          "L'XP et les records qu'elle a rapportés seront annulés."
      )
    )
      return
    demarrer(async () => {
      const r = await supprimerSeance(seance.id)
      if (r.erreur) setErreur(r.erreur)
    })
  }

  return (
    <section className="flex flex-col rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-1 text-2xl">Mes séances</h2>
      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Les exercices travaillés, série par série. Saisie possible sur les trois
        derniers jours.
      </p>

      <div className="flex-1">
        {seances.length === 0 ? (
          <p className="text-sm italic text-encre-douce">
            Aucune séance enregistrée.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-filet">
            {visibles.map((s) => (
              <li key={s.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-encre-douce">{s.date}</p>
                  <p className="mt-0.5 truncate text-sm">
                    {s.blocs.map((b) => nomExo(b.exerciceId)).join(', ')}
                  </p>
                  {s.note && (
                    <p className="mt-1 text-xs italic text-encre-douce">
                      📝 {s.note}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl">
                    {Math.round(volumeSeance(s))}
                    <span className="ml-1 font-corps text-[10px] text-encre-douce">
                      kg
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => supprimer(s)}
                    aria-label={`Supprimer la séance du ${s.date}`}
                    className="mt-1 text-xs text-encre-douce transition-colors hover:text-accent"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {reste > 0 && (
          <button
            type="button"
            onClick={() => setTout(true)}
            className="mt-3 w-full rounded-full border border-bordure bg-verre
                       py-2.5 text-xs font-semibold text-encre-douce
                       transition-colors hover:text-encre"
          >
            {reste === 1 ? "Voir l'autre" : `Voir les ${reste} autres`}
          </button>
        )}
      </div>

      <Erreur>{erreur}</Erreur>

      <Bouton
        type="button"
        className="mt-4"
        disabled={exercices.length === 0}
        onClick={() => setOuvert(true)}
      >
        {exercices.length === 0
          ? "Crée d'abord un exercice"
          : 'Ajouter une séance'}
      </Bouton>

      <Modale
        titre="Nouvelle séance"
        ouverte={ouvert}
        onFermer={() => setOuvert(false)}
      >
        <SaisieSeance
          exercices={exercices}
          seances={seances}
          enCours={enCours}
          onEnregistrer={(date, blocs, note) => {
            setErreur(null)
            demarrer(async () => {
              const r = await enregistrerSeance(date, blocs, note)
              if (r.erreur) setErreur(r.erreur)
              else setOuvert(false)
            })
          }}
        />
      </Modale>
    </section>
  )
}

/* ============================================================
   Saisie
   ============================================================ */

function SaisieSeance({
  exercices,
  seances,
  enCours,
  onEnregistrer,
}: {
  exercices: Exercice[]
  seances: SeanceComplete[]
  enCours: boolean
  onEnregistrer: (date: string, blocs: BlocSaisi[], note: string | null) => void
}) {
  const jours = joursDisponibles()
  const [date, setDate] = useState(jours[0].iso)
  const [blocs, setBlocs] = useState<BlocEnCours[]>(() => reprendre(seances, jours[0].iso))
  const [note, setNote] = useState(() => noteDe(seances, jours[0].iso))

  const existante = seances.find((s) => s.date === date)

  function changerJour(iso: string) {
    setDate(iso)
    setBlocs(reprendre(seances, iso))
    setNote(noteDe(seances, iso))
  }

  function ajouterExercice(id: string) {
    if (blocs.some((b) => b.exerciceId === id)) return
    setBlocs([...blocs, { exerciceId: id, series: [{ poids: '', reps: '' }] }])
  }

  function majSerie(iBloc: number, iSerie: number, champ: 'poids' | 'reps', v: string) {
    setBlocs(
      blocs.map((b, i) =>
        i !== iBloc
          ? b
          : {
              ...b,
              series: b.series.map((s, j) =>
                j === iSerie ? { ...s, [champ]: v } : s
              ),
            }
      )
    )
  }

  const disponibles = exercices.filter(
    (e) => !blocs.some((b) => b.exerciceId === e.id)
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Choix du jour */}
      <div>
        <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
          Quel jour ?
        </span>
        <div className="flex flex-col gap-2">
          {jours.map((j) => {
            const prise = seances.some((s) => s.date === j.iso)
            return (
              <button
                key={j.iso}
                type="button"
                onClick={() => changerJour(j.iso)}
                aria-pressed={date === j.iso}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3
                  text-left text-sm transition-colors ${
                    date === j.iso
                      ? 'border-accent bg-accent/10'
                      : 'border-bordure bg-verre hover:bg-verre-fort'
                  }`}
              >
                <span className="font-semibold">{j.nom}</span>
                <span className="font-mono text-[10.5px] text-encre-douce">
                  {prise ? 'séance existante · modifier' : 'aucune séance'}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-encre-douce">
          Une seule séance par jour. Choisir un jour déjà pris remplace son
          contenu.
        </p>
      </div>

      {/* Exercices de la séance */}
      {blocs.map((bloc, iBloc) => {
        const exo = exercices.find((e) => e.id === bloc.exerciceId)
        const derniere = dernierPassage(seances, bloc.exerciceId, date)

        return (
          <div key={bloc.exerciceId} className="rounded-2xl border border-bordure p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-semibold">{exo?.nom}</p>
              <button
                type="button"
                onClick={() => setBlocs(blocs.filter((_, i) => i !== iBloc))}
                aria-label={`Retirer ${exo?.nom}`}
                className="text-xs text-encre-douce transition-colors hover:text-accent"
              >
                ✕
              </button>
            </div>

            {derniere && (
              <p className="mb-3 font-mono text-[10.5px] text-accent-2">
                La dernière fois :{' '}
                {derniere.map((s) => `${s.poids}×${s.reps}`).join(', ')}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {bloc.series.map((serie, iSerie) => (
                <div key={iSerie} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 font-mono text-[10.5px] text-encre-douce">
                    #{iSerie + 1}
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={serie.poids}
                    onChange={(e) => majSerie(iBloc, iSerie, 'poids', e.target.value)}
                    placeholder={
                      derniere?.[iSerie]
                        ? String(derniere[iSerie].poids)
                        : (derniere?.at(-1)?.poids.toString() ?? 'kg')
                    }
                    aria-label={`Poids série ${iSerie + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-bordure bg-fond
                               px-3 py-2.5 text-center font-display text-xl
                               focus:border-accent focus:outline-none"
                  />
                  <span className="font-mono text-xs text-encre-douce">×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={serie.reps}
                    onChange={(e) => majSerie(iBloc, iSerie, 'reps', e.target.value)}
                    placeholder={
                      derniere?.[iSerie]
                        ? String(derniere[iSerie].reps)
                        : (derniere?.at(-1)?.reps.toString() ?? 'reps')
                    }
                    aria-label={`Répétitions série ${iSerie + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-bordure bg-fond
                               px-3 py-2.5 text-center font-display text-xl
                               focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBlocs(
                        blocs.map((b, i) =>
                          i !== iBloc
                            ? b
                            : {
                                ...b,
                                series:
                                  b.series.length > 1
                                    ? b.series.filter((_, j) => j !== iSerie)
                                    : [{ poids: '', reps: '' }],
                              }
                        )
                      )
                    }
                    aria-label={`Supprimer la série ${iSerie + 1}`}
                    className="shrink-0 px-1 text-xs text-encre-douce transition-colors hover:text-accent"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setBlocs(
                  blocs.map((b, i) =>
                    i !== iBloc
                      ? b
                      : {
                          ...b,
                          series: [
                            ...b.series,
                            b.series[b.series.length - 1] ?? { poids: '', reps: '' },
                          ],
                        }
                  )
                )
              }
              className="mt-3 rounded-full border border-bordure bg-verre px-4 py-2
                         text-xs font-semibold text-encre-douce transition-colors
                         hover:text-encre"
            >
              + Ajouter une série
            </button>
          </div>
        )
      })}

      {/* Ajout d'un exercice */}
      {disponibles.length > 0 && (
        <div>
          <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
            {blocs.length === 0 ? 'Choisis un exercice' : 'Ajouter un exercice'}
          </span>
          <div className="flex flex-wrap gap-2">
            {disponibles.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => ajouterExercice(e.id)}
                className="rounded-full border border-bordure bg-verre px-4 py-2
                           text-xs font-semibold text-encre-douce transition-colors
                           hover:border-accent hover:text-encre"
              >
                {e.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <label className="block">
        <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
          Note de séance
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="ex : jambes lourdes mais PR au squat"
          className="w-full resize-y rounded-2xl border border-bordure bg-verre
                     px-4 py-3 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      <Bouton
        type="button"
        disabled={enCours || blocs.length === 0}
        onClick={() =>
          onEnregistrer(
            date,
            blocs.map((b) => ({
              exerciceId: b.exerciceId,
              series: b.series.map((s) => ({
                poids: parseFloat(s.poids),
                reps: parseInt(s.reps, 10),
              })),
            })),
            note.trim() || null
          )
        }
      >
        {enCours
          ? 'Enregistrement…'
          : existante
            ? 'Mettre à jour la séance'
            : 'Enregistrer la séance'}
      </Bouton>
    </div>
  )
}

/* ---- Utilitaires ---- */

function joursDisponibles() {
  return Array.from({ length: JOURS_SAISIE }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const nom =
      i === 0
        ? "Aujourd'hui"
        : i === 1
          ? 'Hier'
          : d.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })
    return { iso, nom }
  })
}

/** Reprend le contenu d'une séance existante, pour la modifier. */
function reprendre(seances: SeanceComplete[], date: string): BlocEnCours[] {
  const s = seances.find((x) => x.date === date)
  if (!s) return []
  return s.blocs.map((b) => ({
    exerciceId: b.exerciceId,
    series: b.series.map((serie) => ({
      poids: String(serie.poids),
      reps: String(serie.reps),
    })),
  }))
}

function noteDe(seances: SeanceComplete[], date: string): string {
  return seances.find((x) => x.date === date)?.note ?? ''
}

/** Séries du dernier passage sur cet exercice, hors jour choisi. */
function dernierPassage(
  seances: SeanceComplete[],
  exerciceId: string,
  sauf: string
) {
  const passe = seances
    .filter((s) => s.date !== sauf)
    .sort((a, b) => b.date.localeCompare(a.date))

  for (const s of passe) {
    const bloc = s.blocs.find((b) => b.exerciceId === exerciceId)
    if (bloc && bloc.series.length) return bloc.series
  }
  return null
}
