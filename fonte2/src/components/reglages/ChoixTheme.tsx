'use client'

import { useState, useTransition } from 'react'
import { BANNIERES, banniere as trouverBanniere, fondBanniere } from '@/lib/bannieres'
import { MOTIFS, motifCss } from '@/lib/motifs'
import { CADRES, CADRES_BOUTIQUE } from '@/lib/recompenses'
import { possede, type Possession } from '@/lib/boutique'
import Link from 'next/link'
import { AvatarCadre } from '@/components/AvatarCadre'
import { changerPersonnalisation, changerAvatar } from '@/app/(carnet)/reglages/actions'
import { Onglets } from '@/components/ui/Controles'
import { ChoixAvatar } from './ChoixAvatar'
import { TexteAjuste } from '@/components/ui/TexteAjuste'

/* ============================================================
   Thème du profil
   ============================================================
   Teinte, motif et cadre se choisissent ensemble, avec un aperçu
   au-dessus qui reprend la vraie disposition de l'en-tête.

   Ce qui n'est pas encore débloqué reste visible, assombri, avec
   un cadenas et le niveau requis : on sait ce qui nous attend.
   La base revérifie le niveau à l'enregistrement.
   ============================================================ */

type Onglet = 'teinte' | 'motif' | 'cadre' | 'avatar'

export function ChoixTheme({
  bio,
  banniere,
  motif,
  cadre,
  niveau,
  pseudo,
  avatar,
  possessions = [],
}: {
  bio: string
  banniere: string
  motif: string
  cadre: string
  niveau: number
  pseudo: string
  avatar: string
  /** Objets achetés en boutique. */
  possessions?: Possession[]
}) {
  const [onglet, setOnglet] = useState<Onglet>('teinte')
  const [couleur, setCouleur] = useState(banniere)
  const [forme, setForme] = useState(motif)
  const [contour, setContour] = useState(cadre)
  const [visage, setVisage] = useState(avatar)
  const [message, setMessage] = useState<{ ok?: string; ko?: string }>({})
  const [enCours, demarrer] = useTransition()

  const modifie = couleur !== banniere || forme !== motif || contour !== cadre
  const teinte = trouverBanniere(couleur)

  function appliquer() {
    setMessage({})
    demarrer(async () => {
      const r = await changerPersonnalisation(bio, couleur, forme, contour)
      setMessage({ ok: r.succes, ko: r.erreur })
    })
  }

  function choisirAvatar(a: string) {
    setVisage(a)
    setMessage({})
    demarrer(async () => {
      const r = await changerAvatar(a)
      if (r.erreur) setMessage({ ko: r.erreur })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Aperçu */}
      <div className="relative -mx-4 h-[190px] overflow-hidden md:mx-0 md:rounded-carte">
        <div aria-hidden className="absolute inset-0" style={{ background: teinte.fond }} />
        {teinte.anime && <div aria-hidden className="reflet-teinte absolute inset-0" />}
        <div aria-hidden className="absolute inset-0" style={motifCss(forme)} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-fond" />
        <div className="absolute inset-x-4 bottom-3 flex items-end gap-3.5">
          <AvatarCadre avatar={visage} cadre={contour} taille={72} />
          <span className="min-w-0 flex-1 pb-1">
            <TexteAjuste max={40} min={20} className="font-display leading-[0.9]">
              {pseudo}
            </TexteAjuste>
          </span>
        </div>
      </div>

      <Onglets
        etiquette="Personnalisation"
        actif={onglet}
        onChange={(c) => setOnglet(c as Onglet)}
        onglets={[
          { cle: 'teinte', libelle: 'Teinte' },
          { cle: 'motif', libelle: 'Motif' },
          { cle: 'cadre', libelle: 'Cadre' },
          { cle: 'avatar', libelle: 'Avatar' },
        ]}
      />

      {onglet === 'teinte' && (
        <div className="grid grid-cols-4 gap-2">
          {BANNIERES.map((b) => {
            const libre = b.boutique ? possede(possessions, 'teinte', b.cle) : b.niveau <= niveau
            return (
              <button
                key={b.cle}
                type="button"
                disabled={!libre}
                aria-label={libre ? b.nom : b.boutique ? `${b.nom}, en boutique` : `${b.nom}, débloqué au niveau ${b.niveau}`}
                aria-pressed={couleur === b.cle}
                onClick={() => setCouleur(b.cle)}
                className={`appui relative flex h-[72px] items-end overflow-hidden rounded-bloc p-2 ${
                  couleur === b.cle ? 'ring-[3px] ring-encre ring-inset' : ''
                }`}
                style={{ backgroundColor: 'var(--color-fond)' }}
              >
                <span aria-hidden className={`absolute inset-0 ${libre ? '' : 'opacity-35'}`} style={{ background: fondBanniere(b.cle) }} />
                {libre ? (
                  <span className="relative truncate text-[12px] font-semibold">{b.nom}</span>
                ) : (
                  <Cadenas niveau={b.niveau} boutique={b.boutique} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {onglet === 'motif' && (
        <div className="grid grid-cols-4 gap-2">
          {MOTIFS.map((m) => {
            const libre = m.boutique ? possede(possessions, 'motif', m.cle) : m.niveau <= niveau
            return (
              <button
                key={m.cle}
                type="button"
                disabled={!libre}
                aria-label={libre ? m.nom : m.boutique ? `${m.nom}, en boutique` : `${m.nom}, débloqué au niveau ${m.niveau}`}
                aria-pressed={forme === m.cle}
                onClick={() => setForme(m.cle)}
                className={`appui relative flex h-[72px] items-end overflow-hidden rounded-bloc bg-verre p-2 ${
                  forme === m.cle ? 'ring-[3px] ring-encre ring-inset' : ''
                }`}
              >
                {libre && m.cle !== 'aucun' && <span aria-hidden className="absolute inset-0" style={motifCss(m.cle)} />}
                {libre ? (
                  <span className="relative truncate text-[12px] font-semibold">{m.nom}</span>
                ) : (
                  <Cadenas niveau={m.niveau} boutique={m.boutique} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {onglet === 'cadre' && (
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {[...CADRES, ...CADRES_BOUTIQUE.map((c) => ({ ...c, boutique: true }))].map((c) => {
            const enBoutique = 'boutique' in c
            const libre = enBoutique ? possede(possessions, 'cadre', c.cle) : c.niveau <= niveau
            return (
              <button
                key={c.cle}
                type="button"
                disabled={!libre}
                aria-label={libre ? `Cadre ${c.nom}` : enBoutique ? `Cadre ${c.nom}, en boutique` : `Cadre ${c.nom}, débloqué au niveau ${c.niveau}`}
                aria-pressed={contour === c.cle}
                onClick={() => setContour(c.cle)}
                className="appui flex flex-col items-center gap-2 rounded-bloc py-1.5"
              >
                {libre ? (
                  <AvatarCadre avatar={visage} cadre={c.cle} taille={52} />
                ) : (
                  <span
                    className="relative flex h-[52px] w-[52px] items-center justify-center rounded-[13px] border border-dashed"
                    style={{ borderColor: `${c.couleur}66` }}
                  >
                    <Cadenas niveau={c.niveau} compact />
                  </span>
                )}
                <span
                  className={`text-[13px] ${contour === c.cle ? 'font-semibold text-encre' : 'text-encre-douce'}`}
                >
                  {libre ? c.nom : enBoutique ? 'boutique' : `niv. ${c.niveau}`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {onglet === 'avatar' && (
        <ChoixAvatar avatar={visage} cadre={contour} enCours={enCours} onChoisir={choisirAvatar} possessions={possessions} />
      )}

      <p className="px-0.5 text-[13px] text-encre-douce">
        Le cadenas indique le niveau qui débloque l&apos;élément. « Boutique » : il s&apos;achète avec
        des Lingots.{' '}
        <Link href="/boutique" className="font-semibold text-accent-2">Ouvrir la boutique</Link>
      </p>

      {message.ko && <p className="rounded-bloc bg-accent/10 px-4 py-3 font-mono text-[12px] text-accent">{message.ko}</p>}
      {message.ok && <p className="rounded-bloc bg-accent-2/10 px-4 py-3 font-mono text-[12px] text-accent-2">{message.ok}</p>}

      {onglet !== 'avatar' && (
        <button
          type="button"
          disabled={enCours || !modifie}
          onClick={appliquer}
          className="appui h-[56px] rounded-carte bg-accent text-[17px] font-bold text-white transition-colors
                     hover:bg-accent-clair disabled:opacity-40"
        >
          {enCours ? 'Enregistrement…' : 'Appliquer'}
        </button>
      )}
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

function Cadenas({ niveau, compact = false, boutique = false }: { niveau: number; compact?: boolean; boutique?: boolean }) {
  return (
    <span className="relative m-auto flex flex-col items-center justify-center gap-0.5 text-encre">
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
      {!compact && <span className="font-mono text-[11px]">{boutique ? 'boutique' : `niv. ${niveau}`}</span>}
    </span>
  )
}
