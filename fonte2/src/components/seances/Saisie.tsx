'use client'

import { useState } from 'react'
import { Bouton } from '@/components/ui'
import { Onglets, Puce } from '@/components/ui/Controles'
import { ACTIVITES, JOURS_SAISIE, type CleActivite } from '@/lib/cardio'
import type { Exercice, SeanceComplete } from '@/lib/carnet'
import type { BlocSaisi } from '@/app/(carnet)/seances/actions'

/* ============================================================
   Ajouter une séance après coup
   ============================================================
   Deux saisies dans la même fenêtre : muscu (exercices et
   séries) ou cardio (activité, durée, distance). Le jour se
   choisit dans la semaine écoulée.
   ============================================================ */

type SerieSaisie = { poids: string; reps: string }
type BlocEnCours = { exerciceId: string; series: SerieSaisie[] }

export type EnvoiCardio = {
  date: string
  activite: CleActivite
  dureeMin: number
  distanceKm: number | null
  note: string | null
}

export function AjoutSeance({
  exercices,
  seances,
  typeInitial = 'muscu',
  enCours,
  onMuscu,
  onCardio,
}: {
  exercices: Exercice[]
  seances: SeanceComplete[]
  typeInitial?: 'muscu' | 'cardio'
  enCours: boolean
  onMuscu: (date: string, blocs: BlocSaisi[], note: string | null) => void
  onCardio: (c: EnvoiCardio) => void
}) {
  const jours = joursDisponibles()
  const [type, setType] = useState<'muscu' | 'cardio'>(typeInitial)
  const [date, setDate] = useState(jours[0].iso)

  return (
    <div className="flex flex-col gap-5">
      <Onglets
        etiquette="Type de séance"
        actif={type}
        onChange={(c) => setType(c as 'muscu' | 'cardio')}
        onglets={[
          { cle: 'muscu', libelle: 'Muscu' },
          { cle: 'cardio', libelle: 'Cardio' },
        ]}
      />

      <div className="-mx-6 flex gap-2 overflow-x-auto px-6">
        {jours.map((j) => (
          <Puce key={j.iso} choisie={date === j.iso} onClick={() => setDate(j.iso)}>
            {j.nom}
          </Puce>
        ))}
      </div>

      {type === 'muscu' ? (
        exercices.length === 0 ? (
          <p className="text-[15px] leading-relaxed text-encre-douce">
            Crée d&apos;abord un exercice, dans l&apos;onglet Exercices.
          </p>
        ) : (
          <SaisieMuscu
            key={date}
            date={date}
            exercices={exercices}
            seances={seances}
            enCours={enCours}
            onEnregistrer={onMuscu}
          />
        )
      ) : (
        <SaisieCardio date={date} enCours={enCours} onEnregistrer={onCardio} />
      )}
    </div>
  )
}

/* ============================================================
   Muscu
   ============================================================ */

export function SaisieMuscu({
  date,
  exercices,
  seances,
  existante,
  enCours,
  onEnregistrer,
}: {
  date: string
  exercices: Exercice[]
  seances: SeanceComplete[]
  /** Séance à modifier : son contenu est repris. */
  existante?: SeanceComplete
  enCours: boolean
  onEnregistrer: (date: string, blocs: BlocSaisi[], note: string | null) => void
}) {
  const [blocs, setBlocs] = useState<BlocEnCours[]>(() =>
    existante
      ? existante.blocs.map((b) => ({
          exerciceId: b.exerciceId,
          series: b.series.map((s) => ({ poids: String(s.poids), reps: String(s.reps) })),
        }))
      : []
  )
  const [note, setNote] = useState(existante?.note ?? '')

  function ajouterExercice(id: string) {
    if (blocs.some((b) => b.exerciceId === id)) return
    setBlocs([...blocs, { exerciceId: id, series: [{ poids: '', reps: '' }] }])
  }

  function majBloc(i: number, f: (b: BlocEnCours) => BlocEnCours) {
    setBlocs(blocs.map((b, j) => (j === i ? f(b) : b)))
  }

  const disponibles = exercices.filter((e) => !blocs.some((b) => b.exerciceId === e.id))

  return (
    <div className="flex flex-col gap-4">
      {blocs.map((bloc, iBloc) => {
        const exo = exercices.find((e) => e.id === bloc.exerciceId)
        const derniere = dernierPassage(seances, bloc.exerciceId, existante?.id)

        return (
          <div key={bloc.exerciceId} className="rounded-carte bg-verre p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-[17px] font-semibold">{exo?.nom}</p>
              <button
                type="button"
                onClick={() => setBlocs(blocs.filter((_, i) => i !== iBloc))}
                aria-label={`Retirer ${exo?.nom}`}
                className="flex h-10 w-10 items-center justify-center rounded-full text-encre-douce
                           transition-colors hover:text-accent"
              >
                ✕
              </button>
            </div>

            {derniere && (
              <p className="mb-3 font-mono text-[13px] text-accent-2">
                Dernière fois · {derniere.map((s) => `${s.poids}×${s.reps}`).join(', ')}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {bloc.series.map((serie, iSerie) => (
                <div key={iSerie} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 font-mono text-[13px] text-encre-douce">
                    {iSerie + 1}
                  </span>
                  <ChampChiffre
                    valeur={serie.poids}
                    onChange={(v) =>
                      majBloc(iBloc, (b) => ({
                        ...b,
                        series: b.series.map((s, j) => (j === iSerie ? { ...s, poids: v } : s)),
                      }))
                    }
                    indice={
                      derniere?.[iSerie]
                        ? String(derniere[iSerie].poids)
                        : (derniere?.at(-1)?.poids.toString() ?? 'kg')
                    }
                    libelle={`Poids série ${iSerie + 1}`}
                    decimal
                  />
                  <span className="font-mono text-[13px] text-encre-douce">×</span>
                  <ChampChiffre
                    valeur={serie.reps}
                    onChange={(v) =>
                      majBloc(iBloc, (b) => ({
                        ...b,
                        series: b.series.map((s, j) => (j === iSerie ? { ...s, reps: v } : s)),
                      }))
                    }
                    indice={
                      derniere?.[iSerie]
                        ? String(derniere[iSerie].reps)
                        : (derniere?.at(-1)?.reps.toString() ?? 'reps')
                    }
                    libelle={`Répétitions série ${iSerie + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      majBloc(iBloc, (b) => ({
                        ...b,
                        series:
                          b.series.length > 1
                            ? b.series.filter((_, j) => j !== iSerie)
                            : [{ poids: '', reps: '' }],
                      }))
                    }
                    aria-label={`Supprimer la série ${iSerie + 1}`}
                    className="flex h-10 w-8 shrink-0 items-center justify-center text-encre-douce
                               transition-colors hover:text-accent"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                majBloc(iBloc, (b) => ({
                  ...b,
                  series: [...b.series, b.series[b.series.length - 1] ?? { poids: '', reps: '' }],
                }))
              }
              className="appui mt-3 h-10 rounded-pilule bg-verre-fort px-4 text-[14px] font-semibold
                         text-encre-douce transition-colors hover:text-encre"
            >
              + Série
            </button>
          </div>
        )
      })}

      {disponibles.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[15px] font-semibold text-encre-douce">
            {blocs.length === 0 ? 'Choisis un exercice' : 'Ajouter un exercice'}
          </p>
          <div className="flex flex-wrap gap-2">
            {disponibles.map((e) => (
              <Puce key={e.id} onClick={() => ajouterExercice(e.id)}>
                {e.nom}
              </Puce>
            ))}
          </div>
        </div>
      )}

      <ChampNote valeur={note} onChange={setNote} />

      <Bouton
        type="button"
        disabled={enCours || blocs.length === 0}
        onClick={() =>
          onEnregistrer(
            date,
            blocs.map((b) => ({
              exerciceId: b.exerciceId,
              series: b.series.map((s) => ({
                poids: parseFloat(s.poids.replace(',', '.')),
                reps: parseInt(s.reps, 10),
              })),
            })),
            note.trim() || null
          )
        }
      >
        {enCours ? 'Enregistrement…' : existante ? 'Mettre à jour' : 'Enregistrer'}
      </Bouton>
    </div>
  )
}

/* ============================================================
   Cardio
   ============================================================ */

function SaisieCardio({
  date,
  enCours,
  onEnregistrer,
}: {
  date: string
  enCours: boolean
  onEnregistrer: (c: EnvoiCardio) => void
}) {
  const [activite, setActivite] = useState<CleActivite>('course')
  const [duree, setDuree] = useState('')
  const [distance, setDistance] = useState('')
  const [note, setNote] = useState('')

  const dureeMin = parseInt(duree, 10)
  const valide = Number.isFinite(dureeMin) && dureeMin > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {ACTIVITES.map((a) => {
          const choisie = activite === a.cle
          return (
            <button
              key={a.cle}
              type="button"
              aria-pressed={choisie}
              onClick={() => setActivite(a.cle)}
              className={`appui flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-carte transition-colors ${
                choisie
                  ? 'bg-accent-2/15 text-accent-2 ring-2 ring-accent-2 ring-inset'
                  : 'bg-verre text-encre-douce hover:text-encre'
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                dangerouslySetInnerHTML={{ __html: a.icone }}
              />
              <span className={`text-[14px] ${choisie ? 'font-semibold text-encre' : ''}`}>
                {a.nom}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <GrosChamp libelle="Durée" unite="min" valeur={duree} onChange={setDuree} />
        <GrosChamp
          libelle="Distance"
          unite="km"
          valeur={distance}
          onChange={setDistance}
          decimal
          facultatif
        />
      </div>

      <ChampNote valeur={note} onChange={setNote} />

      <Bouton
        type="button"
        disabled={enCours || !valide}
        onClick={() =>
          onEnregistrer({
            date,
            activite,
            dureeMin,
            distanceKm: distance.trim() ? parseFloat(distance.replace(',', '.')) : null,
            note: note.trim() || null,
          })
        }
      >
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </Bouton>
    </div>
  )
}

/* ---- Pièces ---- */

function ChampChiffre({
  valeur,
  onChange,
  indice,
  libelle,
  decimal = false,
}: {
  valeur: string
  onChange: (v: string) => void
  indice: string
  libelle: string
  decimal?: boolean
}) {
  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={valeur}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
      placeholder={indice}
      aria-label={libelle}
      className="h-12 min-w-0 flex-1 rounded-bloc border border-transparent bg-fond px-3
                 text-center font-display text-[28px] leading-none placeholder:text-encre-douce/40
                 focus:border-accent focus:outline-none"
    />
  )
}

function GrosChamp({
  libelle,
  unite,
  valeur,
  onChange,
  decimal = false,
  facultatif = false,
}: {
  libelle: string
  unite: string
  valeur: string
  onChange: (v: string) => void
  decimal?: boolean
  facultatif?: boolean
}) {
  return (
    <label className="flex flex-col gap-0.5 rounded-carte bg-verre px-4 py-3">
      <span className="text-[14px] text-encre-douce">
        {libelle}
        {facultatif && <span className="text-encre-douce/60"> · facultatif</span>}
      </span>
      <span className="flex items-baseline gap-1.5">
        <input
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          value={valeur}
          onChange={(e) => onChange(e.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, ''))}
          placeholder="0"
          className="w-full min-w-0 bg-transparent p-0 font-display text-[52px] leading-none
                     placeholder:text-encre-douce/30 focus:outline-none"
        />
        <span className="font-mono text-[14px] text-encre-douce">{unite}</span>
      </span>
    </label>
  )
}

function ChampNote({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="sr-only">Note</span>
      <textarea
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={280}
        placeholder="Une note ? (facultatif)"
        className="w-full resize-none rounded-carte border border-transparent bg-verre px-4 py-3.5
                   text-base placeholder:text-encre-douce/60 focus:border-accent focus:outline-none"
      />
    </label>
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
          : d
              .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
              .replace(/^./, (c) => c.toUpperCase())
    return { iso, nom }
  })
}

/** Séries du dernier passage sur cet exercice, hors séance modifiée. */
function dernierPassage(seances: SeanceComplete[], exerciceId: string, sauf?: string) {
  for (const s of seances) {
    if (s.id === sauf) continue
    const bloc = s.blocs.find((b) => b.exerciceId === exerciceId)
    if (bloc && bloc.series.length) return bloc.series
  }
  return null
}
