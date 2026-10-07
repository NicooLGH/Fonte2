'use client'

import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { Bouton, Erreur, Succes } from '@/components/ui'
import { volumeSeance } from '@/lib/xp'
import { seanceEnTexte, partagerTexte } from '@/lib/export-seance'
import { activite, resumeCardio, type Cardio } from '@/lib/cardio'
import { cleSemaine, semaineCourante, bornesSemaine } from '@/lib/semaine'
import type { Exercice, SeanceComplete } from '@/lib/carnet'
import { SaisieMuscu } from './Saisie'
import {
  enregistrerSeance,
  supprimerSeance,
  supprimerCardio,
} from '@/app/(carnet)/seances/actions'

/* ============================================================
   Historique
   ============================================================
   Séances de muscu et de cardio mêlées, regroupées par semaine.
   Un appui ouvre le détail : séries, modifier, exporter,
   supprimer.
   ============================================================ */

type Ligne =
  | { genre: 'muscu'; date: string; tri: string; seance: SeanceComplete }
  | { genre: 'cardio'; date: string; tri: string; cardio: Cardio }

const APERCU_SEMAINES = 4

export function Historique({
  seances,
  cardio,
  exercices,
  pseudo,
}: {
  seances: SeanceComplete[]
  cardio: Cardio[]
  exercices: Exercice[]
  pseudo: string
}) {
  const [recherche, setRecherche] = useState('')
  const [tout, setTout] = useState(false)
  const [ouverte, setOuverte] = useState<Ligne | null>(null)
  const [modifiee, setModifiee] = useState<SeanceComplete | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  const nomExo = (id: string) => exercices.find((e) => e.id === id)?.nom ?? 'Exercice supprimé'

  const lignes: Ligne[] = [
    ...seances.map((s, i) => ({
      genre: 'muscu' as const,
      date: s.date,
      // Les séances arrivent déjà triées : on garde leur ordre dans la journée.
      tri: `${s.date}-1-${String(9999 - i).padStart(4, '0')}`,
      seance: s,
    })),
    ...cardio.map((c, i) => ({
      genre: 'cardio' as const,
      date: c.date,
      tri: `${c.date}-0-${String(9999 - i).padStart(4, '0')}`,
      cardio: c,
    })),
  ].sort((a, b) => (a.tri < b.tri ? 1 : -1))

  // La recherche porte sur la date, le nom, les exercices, l'activité et la note.
  const q = recherche.trim().toLowerCase()
  const filtrees = q
    ? lignes.filter((l) => {
        const texte =
          l.genre === 'muscu'
            ? [
                l.date,
                l.seance.nom ?? '',
                l.seance.note ?? '',
                ...l.seance.blocs.map((b) => nomExo(b.exerciceId)),
              ]
            : [l.date, 'cardio', activite(l.cardio.activite).nom, l.cardio.note ?? '']
        return texte.join(' ').toLowerCase().includes(q)
      })
    : lignes

  // Regroupement par semaine, dans l'ordre d'arrivée (le plus récent d'abord).
  const semaines: { cle: string; lignes: Ligne[] }[] = []
  for (const l of filtrees) {
    const cle = cleSemaine(new Date(l.date + 'T12:00:00'))
    const derniere = semaines[semaines.length - 1]
    if (derniere?.cle === cle) derniere.lignes.push(l)
    else semaines.push({ cle, lignes: [l] })
  }
  const visibles = tout || q ? semaines : semaines.slice(0, APERCU_SEMAINES)
  const reste = semaines.length - visibles.length

  function supprimer(l: Ligne) {
    const quoi =
      l.genre === 'muscu' ? `la séance du ${dateLongue(l.date)}` : `ce cardio du ${dateLongue(l.date)}`
    if (!confirm(`Supprimer ${quoi} ?\n\nL'XP qu'il a rapportée sera retirée.`)) return
    setErreur(null)
    demarrer(async () => {
      const r =
        l.genre === 'muscu' ? await supprimerSeance(l.seance.id) : await supprimerCardio(l.cardio.id)
      if (r.erreur) setErreur(r.erreur)
      else {
        setSucces(r.succes ?? null)
        setOuverte(null)
      }
    })
  }

  function exporter(s: SeanceComplete) {
    void partagerTexte(
      seanceEnTexte(s, exercices, pseudo),
      `fonte-seance-${s.date}.txt`,
      `Séance du ${s.date}`
    )
  }

  if (lignes.length === 0) {
    return (
      <div className="rounded-carte bg-verre px-5 py-8 text-center">
        <p className="font-display text-[34px] leading-none">Rien pour l&apos;instant</p>
        <p className="mt-3 text-[15px] leading-relaxed text-encre-douce">
          Ta première séance apparaîtra ici. Lance-la en direct, ou ajoute-la après coup.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {lignes.length > 3 && (
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher un exercice, une date, une note…"
          aria-label="Chercher dans l'historique"
          className="h-12 w-full rounded-bloc border border-transparent bg-verre px-4 text-base
                     placeholder:text-encre-douce/60 focus:border-accent focus:outline-none"
        />
      )}

      <Succes>{succes}</Succes>
      <Erreur>{erreur}</Erreur>

      {filtrees.length === 0 && (
        <p className="text-[15px] text-encre-douce">
          Rien ne correspond à « {recherche.trim()} ».
        </p>
      )}

      {visibles.map((sem) => (
        <section key={sem.cle}>
          <div className="mb-1 flex items-baseline justify-between px-1">
            <p className="etiquette">
              {sem.cle === semaineCourante() ? 'Cette semaine' : bornesSemaine(sem.cle)}
            </p>
            <p className="font-mono text-[12px] text-encre-douce">
              {sem.lignes.length} {sem.lignes.length > 1 ? 'activités' : 'activité'}
            </p>
          </div>
          <ul className="flex flex-col">
            {sem.lignes.map((l) => (
              <li key={l.genre + (l.genre === 'muscu' ? l.seance.id : l.cardio.id)}>
                <button
                  type="button"
                  onClick={() => {
                    setSucces(null)
                    setOuverte(l)
                  }}
                  className="appui flex w-full items-center gap-3.5 rounded-bloc py-3 text-left
                             transition-colors hover:bg-verre"
                >
                  <TuileDate iso={l.date} cardio={l.genre === 'cardio'} />
                  {l.genre === 'muscu' ? (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[17px] font-semibold">
                          {l.seance.nom || nomsCourts(l.seance, nomExo)}
                        </span>
                        <span className="block truncate text-[14px] text-encre-douce">
                          {l.seance.nom
                            ? nomsCourts(l.seance, nomExo)
                            : `${l.seance.blocs.length} exercice${l.seance.blocs.length > 1 ? 's' : ''}`}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="font-display text-[26px] leading-none">
                          {formaterTonnage(volumeSeance(l.seance))}
                        </span>
                        <span className="ml-1 font-mono text-[12px] text-encre-douce">kg</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[17px] font-semibold">
                          {activite(l.cardio.activite).nom}
                        </span>
                        <span className="block truncate text-[14px] text-encre-douce">
                          {resumeCardio(l.cardio)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-pilule bg-accent-2/15 px-2.5 py-1 font-mono text-[12px] text-accent-2">
                        cardio
                      </span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {reste > 0 && (
        <button
          type="button"
          onClick={() => setTout(true)}
          className="appui h-12 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce
                     transition-colors hover:text-encre"
        >
          {reste === 1 ? 'Voir la semaine précédente' : `Voir les ${reste} semaines précédentes`}
        </button>
      )}

      {/* Détail */}
      <Modale
        titre={
          ouverte?.genre === 'muscu'
            ? ouverte.seance.nom || 'Séance'
            : ouverte
              ? `Cardio · ${activite(ouverte.cardio.activite).nom}`
              : ''
        }
        sousTitre={ouverte ? dateLongue(ouverte.date) : undefined}
        ouverte={ouverte !== null}
        onFermer={() => setOuverte(null)}
      >
        {ouverte?.genre === 'muscu' && (
          <DetailSeance
            seance={ouverte.seance}
            nomExo={nomExo}
            enCours={enCours}
            onModifier={() => {
              setModifiee(ouverte.seance)
              setOuverte(null)
            }}
            onExporter={() => exporter(ouverte.seance)}
            onSupprimer={() => supprimer(ouverte)}
          />
        )}
        {ouverte?.genre === 'cardio' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2.5">
              <Chiffre valeur={String(ouverte.cardio.dureeMin)} unite="min" libelle="Durée" />
              <Chiffre
                valeur={
                  ouverte.cardio.distanceKm != null
                    ? ouverte.cardio.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                    : '—'
                }
                unite="km"
                libelle="Distance"
              />
            </div>
            {ouverte.cardio.note && (
              <p className="text-[15px] leading-relaxed text-encre-douce">{ouverte.cardio.note}</p>
            )}
            <Bouton variante="discret" type="button" disabled={enCours} onClick={() => supprimer(ouverte)}>
              Supprimer
            </Bouton>
          </div>
        )}
      </Modale>

      {/* Modification d'une séance de muscu */}
      <Modale
        titre="Modifier la séance"
        sousTitre={modifiee ? dateLongue(modifiee.date) : undefined}
        ouverte={modifiee !== null}
        onFermer={() => setModifiee(null)}
      >
        {modifiee && (
          <SaisieMuscu
            date={modifiee.date}
            exercices={exercices}
            seances={seances}
            existante={modifiee}
            enCours={enCours}
            onEnregistrer={(date, blocs, note) => {
              setErreur(null)
              demarrer(async () => {
                const r = await enregistrerSeance(date, blocs, note, modifiee.id)
                if (r.erreur) setErreur(r.erreur)
                else {
                  setSucces(r.succes ?? null)
                  setModifiee(null)
                }
              })
            }}
          />
        )}
      </Modale>
    </div>
  )
}

/* ---- Détail d'une séance ---- */

function DetailSeance({
  seance,
  nomExo,
  enCours,
  onModifier,
  onExporter,
  onSupprimer,
}: {
  seance: SeanceComplete
  nomExo: (id: string) => string
  enCours: boolean
  onModifier: () => void
  onExporter: () => void
  onSupprimer: () => void
}) {
  const series = seance.blocs.reduce((n, b) => n + b.series.length, 0)
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        <Chiffre valeur={formaterTonnage(volumeSeance(seance))} unite="kg" libelle="Tonnage" />
        <Chiffre valeur={String(series)} unite="" libelle="Séries" />
        <Chiffre
          valeur={seance.dureeSec ? String(Math.round(seance.dureeSec / 60)) : '—'}
          unite={seance.dureeSec ? 'min' : ''}
          libelle="Durée"
        />
      </div>

      <ul className="flex flex-col gap-3">
        {seance.blocs.map((b) => (
          <li key={b.exerciceId}>
            <p className="text-[17px] font-semibold">{nomExo(b.exerciceId)}</p>
            <p className="mt-0.5 font-mono text-[14px] text-encre-douce">
              {b.series.map((s) => `${s.poids}×${s.reps}`).join('  ·  ')}
            </p>
          </li>
        ))}
      </ul>

      {seance.note && (
        <p className="rounded-bloc bg-verre px-4 py-3 text-[15px] leading-relaxed text-encre-douce">
          {seance.note}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Bouton type="button" onClick={onModifier} disabled={enCours}>
          Modifier
        </Bouton>
        <div className="grid grid-cols-2 gap-2">
          <Bouton variante="discret" type="button" onClick={onExporter}>
            Exporter
          </Bouton>
          <Bouton variante="discret" type="button" onClick={onSupprimer} disabled={enCours}>
            Supprimer
          </Bouton>
        </div>
      </div>
    </div>
  )
}

function Chiffre({ valeur, unite, libelle }: { valeur: string; unite: string; libelle: string }) {
  return (
    <div className="rounded-bloc bg-verre px-3 py-3">
      <p className="text-[13px] text-encre-douce">{libelle}</p>
      <p className="mt-1">
        <span className="font-display text-[30px] leading-none">{valeur}</span>
        {unite && <span className="ml-1 font-mono text-[12px] text-encre-douce">{unite}</span>}
      </p>
    </div>
  )
}

function TuileDate({ iso, cardio }: { iso: string; cardio: boolean }) {
  const d = new Date(iso + 'T12:00:00')
  return (
    <span
      className={`flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-bloc ${
        cardio ? 'bg-accent-2/15 text-accent-2' : 'bg-verre'
      }`}
    >
      <span className="font-display text-[24px] leading-none">{d.getDate()}</span>
      <span className={`font-mono text-[10px] uppercase ${cardio ? '' : 'text-encre-douce'}`}>
        {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
      </span>
    </span>
  )
}

/* ---- Utilitaires ---- */

function nomsCourts(s: SeanceComplete, nomExo: (id: string) => string) {
  return s.blocs.map((b) => nomExo(b.exerciceId)).join(', ')
}

function formaterTonnage(kg: number) {
  return Math.round(kg).toLocaleString('fr-FR')
}

function dateLongue(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
