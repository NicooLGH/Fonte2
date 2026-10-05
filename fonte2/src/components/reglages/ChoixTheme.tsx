'use client'

import { useState } from 'react'
import { BANNIERES, banniere as trouverBanniere, fondBanniere } from '@/lib/bannieres'
import { MOTIFS, motifCss } from '@/lib/motifs'
import { CADRES } from '@/lib/recompenses'
import { AvatarCadre } from '@/components/AvatarCadre'
import { changerPersonnalisation } from '@/app/(carnet)/reglages/actions'

/* ============================================================
   Thème du profil
   ============================================================
   Teinte, motif et cadre se choisissent ensemble, avec un aperçu
   au-dessus qui reprend la vraie disposition de l'en-tête.

   Ce qui n'est pas encore débloqué reste visible, assombri, avec
   un cadenas et le niveau requis : on sait ce qui nous attend.
   La base revérifie le niveau à l'enregistrement.
   ============================================================ */

export function ChoixTheme({
  bio,
  banniere,
  motif,
  cadre,
  niveau,
  pseudo,
  avatar,
  enCours,
  onAgir,
}: {
  bio: string
  banniere: string
  motif: string
  cadre: string
  niveau: number
  pseudo: string
  avatar: string
  enCours: boolean
  onAgir: (a: () => Promise<{ erreur?: string; succes?: string }>) => void
}) {
  const [couleur, setCouleur] = useState(banniere)
  const [forme, setForme] = useState(motif)
  const [contour, setContour] = useState(cadre)

  const modifie = couleur !== banniere || forme !== motif || contour !== cadre
  const teinte = trouverBanniere(couleur)

  const compte = <T extends { niveau: number }>(liste: T[]) =>
    `${liste.filter((x) => x.niveau <= niveau).length} / ${liste.length}`

  return (
    <div className="flex flex-col gap-5">
      {/* ---- Aperçu ---- */}
      <div className="overflow-hidden rounded-bloc border border-bordure">
        <div className="relative p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: teinte.fond }}
          />
          {teinte.anime && (
            <div aria-hidden className="reflet-teinte pointer-events-none absolute inset-0" />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              maskImage: 'linear-gradient(to bottom, #000 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 70%, transparent 100%)',
              ...motifCss(forme),
            }}
          />

          <div className="relative flex items-start gap-3.5 py-1">
            <AvatarCadre avatar={avatar} cadre={contour} taille={52} />
            <div className="min-w-0">
              <p className="truncate font-display text-2xl">{pseudo}</p>
              {bio && (
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-encre-douce">
                  {bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Teinte ---- */}
      <Groupe titre="Teinte" compte={compte(BANNIERES)}>
        <div className="grid grid-cols-5 gap-1.5">
          {BANNIERES.map((b) => {
            const libre = b.niveau <= niveau
            return (
              <button
                key={b.cle}
                type="button"
                disabled={!libre}
                aria-label={libre ? b.nom : `${b.nom}, débloqué au niveau ${b.niveau}`}
                title={libre ? b.nom : `${b.nom} · niveau ${b.niveau}`}
                aria-pressed={couleur === b.cle}
                onClick={() => setCouleur(b.cle)}
                className={`appui relative flex h-12 items-center justify-center overflow-hidden rounded-bloc transition-colors ${
                  couleur === b.cle ? 'border-2 border-encre' : 'border border-bordure'
                }`}
                style={{ backgroundColor: 'var(--color-fond)' }}
              >
                <span
                  aria-hidden
                  className={`absolute inset-0 ${libre ? '' : 'opacity-40'}`}
                  style={{ background: fondBanniere(b.cle) }}
                />
                {!libre && <Cadenas niveau={b.niveau} />}
              </button>
            )
          })}
        </div>
      </Groupe>

      {/* ---- Motif ---- */}
      <Groupe titre="Motif" compte={compte(MOTIFS)}>
        <div className="grid grid-cols-5 gap-1.5">
          {MOTIFS.map((m) => {
            const libre = m.niveau <= niveau
            return (
              <button
                key={m.cle}
                type="button"
                disabled={!libre}
                aria-label={libre ? m.nom : `${m.nom}, débloqué au niveau ${m.niveau}`}
                title={libre ? m.nom : `${m.nom} · niveau ${m.niveau}`}
                aria-pressed={forme === m.cle}
                onClick={() => setForme(m.cle)}
                className={`appui relative flex h-12 items-center justify-center overflow-hidden rounded-bloc bg-verre transition-colors ${
                  forme === m.cle ? 'border-2 border-encre' : 'border border-bordure'
                }`}
              >
                {!libre ? (
                  <Cadenas niveau={m.niveau} />
                ) : m.cle === 'aucun' ? (
                  <span className="font-mono text-[9px] text-encre-douce">aucun</span>
                ) : (
                  <span aria-hidden className="absolute inset-0" style={motifCss(m.cle)} />
                )}
              </button>
            )
          })}
        </div>
      </Groupe>

      {/* ---- Cadre ---- */}
      <Groupe titre="Cadre" compte={compte(CADRES)}>
        <div className="grid grid-cols-4 gap-x-1.5 gap-y-3 sm:grid-cols-7">
          {CADRES.map((c) => {
            const libre = c.niveau <= niveau
            return (
              <button
                key={c.cle}
                type="button"
                disabled={!libre}
                aria-label={libre ? `Cadre ${c.nom}` : `Cadre ${c.nom}, débloqué au niveau ${c.niveau}`}
                aria-pressed={contour === c.cle}
                onClick={() => setContour(c.cle)}
                className="appui flex min-h-11 flex-col items-center gap-2 rounded-bloc py-1.5"
              >
                {libre ? (
                  <AvatarCadre avatar={avatar} cadre={c.cle} taille={42} />
                ) : (
                  <span
                    className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-dashed bg-white/[0.02]"
                    style={{ borderColor: `${c.couleur}59` }}
                  >
                    <Cadenas niveau={c.niveau} compact />
                  </span>
                )}
                <span
                  className={`font-mono text-[10px] ${
                    contour === c.cle ? 'text-encre underline underline-offset-4' : 'text-encre-douce'
                  }`}
                >
                  {libre ? c.nom.toLowerCase() : `niv. ${c.niveau}`}
                </span>
              </button>
            )
          })}
        </div>
      </Groupe>

      {/* ---- Validation ---- */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={enCours || !modifie}
          onClick={() =>
            onAgir(() => changerPersonnalisation(bio, couleur, forme, contour))
          }
          className="appui flex-1 rounded-bloc bg-accent px-5 py-2.5 text-sm
                     font-semibold text-white transition-colors
                     hover:bg-accent-clair disabled:opacity-40"
        >
          Appliquer
        </button>
        {modifie && (
          <button
            type="button"
            onClick={() => {
              setCouleur(banniere)
              setForme(motif)
              setContour(cadre)
            }}
            className="appui shrink-0 rounded-bloc border border-bordure px-5 py-2.5
                       text-sm font-semibold text-encre-douce transition-colors
                       hover:text-encre"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}

function Groupe({
  titre,
  compte,
  children,
}: {
  titre: string
  compte: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="section-titre">{titre}</p>
        <span className="font-mono text-[10.5px] text-encre-douce">{compte}</span>
      </div>
      {children}
    </div>
  )
}

function Cadenas({ niveau, compact = false }: { niveau: number; compact?: boolean }) {
  return (
    <span className="relative flex flex-col items-center justify-center gap-0.5 text-encre-douce">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      {!compact && <span className="font-mono text-[9px]">niv. {niveau}</span>}
    </span>
  )
}
