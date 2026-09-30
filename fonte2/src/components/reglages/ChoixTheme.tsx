'use client'

import { useState } from 'react'
import { BANNIERES, fondBanniere } from '@/lib/bannieres'
import { MOTIFS, motifCss } from '@/lib/motifs'
import { changerPersonnalisation } from '@/app/(carnet)/reglages/actions'

/* ============================================================
   Thème du profil
   ============================================================
   Couleur et motif se choisissent ensemble, avec un aperçu
   au-dessus. Avant, on appliquait puis on découvrait : il
   fallait aller voir son profil pour juger, et revenir si ça ne
   plaisait pas.

   L'aperçu reprend la vraie disposition de l'en-tête — un
   échantillon de couleur ne dit rien de ce que donnera un motif
   derrière un pseudo.
   ============================================================ */

export function ChoixTheme({
  bio,
  banniere,
  motif,
  pseudo,
  avatar,
  enCours,
  onAgir,
}: {
  bio: string
  banniere: string
  motif: string
  pseudo: string
  avatar: string
  enCours: boolean
  onAgir: (a: () => Promise<{ erreur?: string; succes?: string }>) => void
}) {
  const [couleur, setCouleur] = useState(banniere)
  const [forme, setForme] = useState(motif)

  const modifie = couleur !== banniere || forme !== motif

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Aperçu ---- */}
      <div className="overflow-hidden rounded-bloc border border-bordure">
        <div className="relative p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: fondBanniere(couleur) }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              maskImage: 'linear-gradient(to bottom, #000 70%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, #000 70%, transparent 100%)',
              ...motifCss(forme),
            }}
          />

          <div className="relative flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center
                         rounded-bloc border border-bordure bg-verre text-2xl"
            >
              {avatar}
            </span>
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

      {/* ---- Couleur ---- */}
      <div>
        <p className="section-titre mb-2">Couleur</p>
        <div className="flex flex-wrap gap-2">
          {BANNIERES.map((b) => (
            <button
              key={b.cle}
              type="button"
              aria-label={b.nom}
              aria-pressed={couleur === b.cle}
              onClick={() => setCouleur(b.cle)}
              className={`appui relative h-10 w-14 overflow-hidden rounded-bloc
                border transition-colors ${
                  couleur === b.cle ? 'border-accent' : 'border-bordure'
                }`}
              style={{ backgroundColor: 'var(--color-fond)' }}
            >
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ background: fondBanniere(b.cle) }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ---- Motif ---- */}
      <div>
        <p className="section-titre mb-2">Motif</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {MOTIFS.map((m) => (
            <button
              key={m.cle}
              type="button"
              aria-label={m.nom}
              title={m.nom}
              aria-pressed={forme === m.cle}
              onClick={() => setForme(m.cle)}
              className={`appui relative h-11 overflow-hidden rounded-bloc border
                bg-verre transition-colors ${
                  forme === m.cle ? 'border-accent' : 'border-bordure'
                }`}
            >
              {m.cle === 'aucun' ? (
                <span className="font-mono text-[9px] text-encre-douce">—</span>
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={motifCss(m.cle)}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Validation ---- */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={enCours || !modifie}
          onClick={() => onAgir(() => changerPersonnalisation(bio, couleur, forme))}
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
