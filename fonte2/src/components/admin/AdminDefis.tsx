'use client'

import { useState, useTransition } from 'react'
import { Champ, Erreur, Succes } from '@/components/ui'
import { BadgeDefi } from '@/components/defis/BadgeDefi'
import {
  BADGE_PAR_DEFAUT,
  BORDURES_BADGE,
  COULEURS_BADGE,
  FONDS_BADGE,
  FORMES_BADGE,
  ICONES_BADGE,
  OBJECTIFS,
  OBJECTIFS_VERIFIES,
  libelleObjectif,
  type ConfigBadge,
  type DefiAdmin,
  type IconeBadge,
  type NouveauDefi,
  type Objectif,
} from '@/lib/defis'
import { enregistrerDefi, changerStatutDefi } from '@/app/(carnet)/admin/actions'

/* ============================================================
   Administration — défis
   ============================================================
   Créer un défi, dessiner son badge, le publier ou le garder en
   brouillon. Une fois publié, seuls le texte, l'XP et le badge
   restent modifiables : changer l'objectif en cours de route
   fausserait la progression de ceux qui participent.
   ============================================================ */

type Duree = NouveauDefi['duree']
type Repetition = NouveauDefi['repetition']

const VIDE: NouveauDefi = {
  titre: '',
  description: '',
  type: 'verifie',
  portee: 'individuel',
  objectif: 'seances',
  valeur: 3,
  xp: 100,
  duree: 'dimanche',
  dureeJours: 7,
  debut: null,
  fin: null,
  repetition: 'aucune',
  badge: BADGE_PAR_DEFAUT,
  annonce: true,
  statut: 'publie',
}

export function AdminDefis({ defis }: { defis: DefiAdmin[] }) {
  const [d, setD] = useState<NouveauDefi>(VIDE)
  const [edite, setEdite] = useState<DefiAdmin | null>(null)
  const [programme, setProgramme] = useState(false)
  const [debutLocal, setDebutLocal] = useState('')
  const [finLocal, setFinLocal] = useState('')
  const [message, setMessage] = useState<{ ok?: string; ko?: string }>({})
  const [enCours, demarrer] = useTransition()

  // Une fois publié, l'objectif et le calendrier sont figés.
  const fige = edite !== null && edite.statut !== 'brouillon'

  const maj = <K extends keyof NouveauDefi>(cle: K, v: NouveauDefi[K]) =>
    setD((x) => ({ ...x, [cle]: v }))
  const majBadge = <K extends keyof ConfigBadge>(cle: K, v: ConfigBadge[K]) =>
    setD((x) => ({ ...x, badge: { ...x.badge, [cle]: v } }))

  function choisirType(type: NouveauDefi['type']) {
    setD((x) => ({
      ...x,
      type,
      objectif: type === 'honneur' ? 'jours' : 'seances',
      // Un total commun ne repose pas sur des déclarations.
      portee: type === 'honneur' ? 'individuel' : x.portee,
    }))
  }

  function editer(e: DefiAdmin) {
    setEdite(e)
    setD({
      titre: e.titre,
      description: e.description,
      type: e.type,
      portee: e.portee,
      objectif: e.objectif,
      valeur: e.valeur,
      xp: e.xp,
      duree: e.duree,
      dureeJours: e.dureeJours,
      debut: e.debut,
      fin: e.fin,
      repetition: e.repetition,
      badge: e.badge,
      annonce: e.annonce,
      statut: e.statut === 'brouillon' ? 'brouillon' : 'publie',
    })
    setMessage({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reinitialiser() {
    setEdite(null)
    setD(VIDE)
    setProgramme(false)
    setDebutLocal('')
    setFinLocal('')
  }

  function envoyer(statut: 'publie' | 'brouillon') {
    const debut =
      !fige && programme && debutLocal ? new Date(debutLocal).toISOString() : fige ? d.debut : null
    // La date de fin choisie est incluse : le défi s'arrête à
    // minuit le soir de ce jour.
    let fin = d.fin
    if (!fige && d.duree === 'dates') {
      if (!finLocal) {
        setMessage({ ko: 'Choisis la date de fin.' })
        return
      }
      const f = new Date(`${finLocal}T00:00`)
      f.setDate(f.getDate() + 1)
      fin = f.toISOString()
    }

    setMessage({})
    demarrer(async () => {
      const r = await enregistrerDefi({ ...d, debut, fin, statut }, edite?.id ?? null)
      setMessage({ ok: r.succes, ko: r.erreur })
      if (!r.erreur) reinitialiser()
    })
  }

  function statut(id: string, s: 'publie' | 'archive') {
    setMessage({})
    demarrer(async () => {
      const r = await changerStatutDefi(id, s)
      setMessage({ ok: r.succes, ko: r.erreur })
    })
  }

  const objectifs: Objectif[] = d.type === 'honneur' ? ['jours'] : OBJECTIFS_VERIFIES

  return (
    <section className="section pb-6">
      <p className="section-titre mb-1">
        {edite ? `Modifier « ${edite.titre} »` : 'Nouveau défi'}
      </p>
      {edite && (
        <button
          type="button"
          onClick={reinitialiser}
          className="mb-3 font-mono text-[11px] text-accent-2 underline underline-offset-4"
        >
          Annuler la modification
        </button>
      )}

      <div className="mt-3 flex flex-col gap-4">
        <p className="section-titre text-[9.5px]">1 · Le défi</p>
        <Champ
          libelle="Titre"
          value={d.titre}
          onChange={(e) => maj('titre', e.target.value)}
          maxLength={60}
          placeholder="ex : Semaine de feu"
        />
        <label className="block">
          <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
            Description
          </span>
          <textarea
            value={d.description}
            onChange={(e) => maj('description', e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="ex : 4 séances avant dimanche soir."
            className="w-full resize-y rounded-bloc border border-bordure bg-verre px-4 py-3
                       text-base focus:border-accent focus:outline-none"
          />
        </label>

        <Segments
          libelle="Type"
          options={[
            ['verifie', 'Vérifié'],
            ['honneur', "Sur l'honneur"],
          ]}
          valeur={d.type}
          desactive={fige}
          onChange={(v) => choisirType(v as NouveauDefi['type'])}
        />
        <Segments
          libelle="Portée"
          options={[
            ['individuel', 'Individuel'],
            ['collectif', 'Collectif'],
          ]}
          valeur={d.portee}
          desactive={fige || d.type === 'honneur'}
          onChange={(v) => maj('portee', v as NouveauDefi['portee'])}
          aide={
            d.type === 'honneur'
              ? "Un défi sur l'honneur est toujours individuel."
              : d.portee === 'collectif'
                ? 'Total commun de tous les participants. Chaque contributeur gagne si le total est atteint.'
                : undefined
          }
        />

        <div>
          <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
            Objectif
          </span>
          <div className="flex gap-2">
            <select
              value={d.objectif}
              disabled={fige || d.type === 'honneur'}
              onChange={(e) => maj('objectif', e.target.value as Objectif)}
              aria-label="Type d'objectif"
              className="h-[50px] min-w-0 flex-1 rounded-bloc border border-bordure bg-verre px-3
                         text-base text-encre focus:border-accent focus:outline-none disabled:opacity-60"
            >
              {objectifs.map((o) => (
                <option key={o} value={o}>
                  {OBJECTIFS[o].libelle}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={Number.isFinite(d.valeur) ? d.valeur : ''}
              disabled={fige}
              onChange={(e) => maj('valeur', parseFloat(e.target.value))}
              aria-label="Valeur de l'objectif"
              className="h-[50px] w-24 rounded-bloc border border-bordure bg-verre px-3 text-center
                         text-base text-encre focus:border-accent focus:outline-none disabled:opacity-60"
            />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-encre-douce">
            {d.valeur > 0 &&
              (d.type === 'honneur'
                ? `${d.valeur} jour${d.valeur > 1 ? 's' : ''} à cocher pendant le défi`
                : libelleObjectif(d.objectif, d.valeur))}
          </p>
        </div>

        <Champ
          libelle="Récompense (XP)"
          type="number"
          inputMode="numeric"
          min={0}
          max={2000}
          value={Number.isFinite(d.xp) ? d.xp : ''}
          onChange={(e) => maj('xp', parseInt(e.target.value, 10))}
        />

        <p className="section-titre mt-3 text-[9.5px]">2 · Quand</p>
        <Segments
          libelle="Répétition"
          options={[
            ['aucune', 'Aucune'],
            ['semaine', 'Chaque semaine'],
            ['mois', 'Chaque mois'],
          ]}
          valeur={d.repetition}
          desactive={fige}
          onChange={(v) => maj('repetition', v as Repetition)}
          aide={
            d.repetition === 'semaine'
              ? 'Une édition par semaine, du lundi au dimanche.'
              : d.repetition === 'mois'
                ? 'Une édition par mois, du 1er au dernier jour.'
                : undefined
          }
        />
        {d.repetition === 'aucune' && (
          <Segments
            libelle="Durée"
            options={[
              ['dimanche', "Jusqu'à dimanche"],
              ['jours', 'N jours'],
              ['dates', "Jusqu'au…"],
            ]}
            valeur={d.duree}
            desactive={fige}
            onChange={(v) => maj('duree', v as Duree)}
          />
        )}
        {d.repetition === 'aucune' && d.duree === 'jours' && (
          <Champ
            libelle="Nombre de jours"
            type="number"
            inputMode="numeric"
            min={1}
            max={90}
            disabled={fige}
            value={d.dureeJours ?? ''}
            onChange={(e) => maj('dureeJours', parseInt(e.target.value, 10) || null)}
            aide="Aujourd'hui compte comme le premier jour."
          />
        )}
        {d.repetition === 'aucune' && d.duree === 'dates' && !fige && (
          <Champ
            libelle="Dernier jour (inclus)"
            type="date"
            value={finLocal}
            onChange={(e) => setFinLocal(e.target.value)}
          />
        )}
        {!fige && (
          <>
            <Segments
              libelle="Démarrage"
              options={[
                ['maintenant', 'Maintenant'],
                ['programme', 'Programmé'],
              ]}
              valeur={programme ? 'programme' : 'maintenant'}
              onChange={(v) => setProgramme(v === 'programme')}
            />
            {programme && (
              <Champ
                libelle="Début"
                type="datetime-local"
                value={debutLocal}
                onChange={(e) => setDebutLocal(e.target.value)}
              />
            )}
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span className="text-sm">Annonce à tout le monde à la publication</span>
              <input
                type="checkbox"
                checked={d.annonce}
                onChange={(e) => maj('annonce', e.target.checked)}
                className="h-[22px] w-[22px] accent-[#ff4b2b]"
              />
            </label>
          </>
        )}

        <p className="section-titre mt-3 text-[9.5px]">3 · Le badge</p>
        <div
          className="flex flex-col items-center gap-2.5 rounded-[18px] border border-bordure p-4.5"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 50% 20%, ${d.badge.couleur}22, transparent 70%), rgb(255 255 255 / 0.03)`,
          }}
        >
          <BadgeDefi badge={d.badge} taille={120} />
          <span className="font-display text-[22px] uppercase">{d.titre || 'Titre du défi'}</span>
          <span className="font-mono text-[10px] text-encre-douce">aperçu en direct</span>
        </div>

        <Grille libelle="Forme" colonnes={6}>
          {FORMES_BADGE.map((f) => (
            <Case key={f} actif={d.badge.forme === f} libelle={f} onClick={() => majBadge('forme', f)}>
              <BadgeDefi badge={{ ...d.badge, forme: f, texte: '' }} taille={36} />
            </Case>
          ))}
        </Grille>

        <Grille libelle="Couleur" colonnes={6}>
          {COULEURS_BADGE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Couleur ${c}`}
              aria-pressed={d.badge.couleur === c}
              onClick={() => majBadge('couleur', c)}
              className={`min-h-[38px] rounded-[10px] ${
                d.badge.couleur === c ? 'ring-2 ring-encre ring-offset-2 ring-offset-fond' : ''
              }`}
              style={{ background: c }}
            />
          ))}
          <label
            className="relative flex min-h-[38px] cursor-pointer items-center justify-center overflow-hidden
                       rounded-[10px] border border-dashed border-white/30 font-mono text-[10px] text-encre-douce"
          >
            #hex
            <input
              type="color"
              value={d.badge.couleur}
              onChange={(e) => majBadge('couleur', e.target.value)}
              aria-label="Couleur libre"
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </Grille>

        <Grille libelle="Icône" colonnes={8}>
          {(Object.keys(ICONES_BADGE) as IconeBadge[]).map((k) => (
            <Case key={k} actif={d.badge.icone === k} libelle={k} onClick={() => majBadge('icone', k)}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={d.badge.icone === k ? 'text-encre' : 'text-encre-douce'}
                dangerouslySetInnerHTML={{ __html: ICONES_BADGE[k] }}
              />
            </Case>
          ))}
        </Grille>

        <Grille libelle="Fond" colonnes={4}>
          {FONDS_BADGE.map((f) => (
            <Case key={f} actif={d.badge.fond === f} libelle={f} onClick={() => majBadge('fond', f)}>
              <BadgeDefi badge={{ ...d.badge, fond: f, forme: 'cercle', texte: '' }} taille={36} />
            </Case>
          ))}
        </Grille>

        <Grille libelle="Bordure" colonnes={3}>
          {BORDURES_BADGE.map((b) => (
            <Case key={b} actif={d.badge.bordure === b} libelle={b} onClick={() => majBadge('bordure', b)}>
              <BadgeDefi badge={{ ...d.badge, bordure: b, forme: 'cercle', texte: '' }} taille={36} />
            </Case>
          ))}
        </Grille>

        <Champ
          libelle="Texte court (facultatif)"
          value={d.badge.texte}
          maxLength={4}
          onChange={(e) => majBadge('texte', e.target.value.toUpperCase())}
          placeholder="ex : 10K"
          aide="4 caractères au maximum. Il prend la moitié basse du badge."
        />

        <Erreur>{message.ko}</Erreur>
        <Succes>{message.ok}</Succes>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={enCours}
            onClick={() => envoyer('publie')}
            className="appui h-[50px] rounded-bloc bg-accent text-[15px] font-semibold text-white
                       transition-colors hover:bg-accent-clair disabled:opacity-60"
          >
            {edite && edite.statut !== 'brouillon' ? 'Enregistrer les modifications' : 'Publier le défi'}
          </button>
          {(!edite || edite.statut === 'brouillon') && (
            <button
              type="button"
              disabled={enCours}
              onClick={() => envoyer('brouillon')}
              className="h-[46px] rounded-bloc border border-bordure bg-verre text-sm font-semibold
                         text-encre transition-colors hover:bg-verre-fort disabled:opacity-60"
            >
              Enregistrer en brouillon
            </button>
          )}
        </div>
      </div>

      {/* ---- Liste ---- */}
      {defis.length > 0 && (
        <div className="mt-8">
          <p className="section-titre mb-1">Défis créés</p>
          <ul>
            {defis.map((e) => (
              <li key={e.id} className="flex items-center gap-3 border-b border-filet py-3">
                <BadgeDefi badge={e.badge} taille={44} verrouille={e.statut === 'archive'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.titre}</p>
                  <p className="font-mono text-[10.5px] text-encre-douce">
                    {e.statut === 'brouillon'
                      ? 'brouillon'
                      : e.statut === 'archive'
                        ? 'archivé'
                        : e.repetition !== 'aucune'
                          ? `chaque ${e.repetition === 'semaine' ? 'semaine' : 'mois'}`
                          : e.editionFin && new Date(e.editionFin).getTime() < Date.now()
                            ? 'terminé'
                            : 'en cours'}{' '}
                    · {e.portee === 'collectif' ? 'collectif' : e.type === 'honneur' ? "sur l'honneur" : 'vérifié'} · +{e.xp} XP
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {e.statut !== 'archive' && (
                    <PetitBouton onClick={() => editer(e)} desactive={enCours}>
                      Modifier
                    </PetitBouton>
                  )}
                  {e.statut === 'publie' ? (
                    <PetitBouton onClick={() => statut(e.id, 'archive')} desactive={enCours}>
                      Archiver
                    </PetitBouton>
                  ) : (
                    <PetitBouton onClick={() => statut(e.id, 'publie')} desactive={enCours}>
                      Publier
                    </PetitBouton>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-encre-douce">
            Archiver retire le défi de l&apos;application. L&apos;XP et les badges déjà
            gagnés restent acquis. Aucune donnée de participant n&apos;est visible ici.
          </p>
        </div>
      )}
    </section>
  )
}

/* ---- Pièces ---- */

function Segments({
  libelle,
  options,
  valeur,
  onChange,
  desactive = false,
  aide,
}: {
  libelle: string
  options: [string, string][]
  valeur: string
  onChange: (v: string) => void
  desactive?: boolean
  aide?: string
}) {
  return (
    <div>
      <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
        {libelle}
      </span>
      <div className="flex gap-1 rounded-bloc border border-bordure bg-verre p-1">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            disabled={desactive}
            aria-pressed={valeur === v}
            onClick={() => onChange(v)}
            className={`min-h-[38px] flex-1 rounded-[9px] px-2 text-[12.5px] font-semibold transition-colors
              disabled:cursor-not-allowed disabled:opacity-50 ${
                valeur === v ? 'bg-encre text-fond' : 'text-encre-douce hover:text-encre'
              }`}
          >
            {l}
          </button>
        ))}
      </div>
      {aide && <p className="mt-1.5 font-mono text-[10px] text-encre-douce">{aide}</p>}
    </div>
  )
}

function Grille({
  libelle,
  colonnes,
  children,
}: {
  libelle: string
  colonnes: number
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
        {libelle}
      </span>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))` }}
      >
        {children}
      </div>
    </div>
  )
}

function Case({
  actif,
  libelle,
  onClick,
  children,
}: {
  actif: boolean
  libelle: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      aria-pressed={actif}
      onClick={onClick}
      className={`flex min-h-[46px] items-center justify-center rounded-[10px] bg-white/[0.03] p-1
        transition-colors ${actif ? 'border-2 border-encre' : 'border border-bordure hover:border-encre-douce'}`}
    >
      {children}
    </button>
  )
}

function PetitBouton({
  onClick,
  desactive,
  children,
}: {
  onClick: () => void
  desactive: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      className="min-h-9 rounded-bloc bg-verre px-2.5 text-[11px] font-semibold text-encre-douce
                 transition-colors hover:bg-verre-fort hover:text-encre disabled:opacity-50"
    >
      {children}
    </button>
  )
}
