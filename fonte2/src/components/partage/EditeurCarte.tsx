'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePastille, Pastille } from '@/components/ui/Pastille'
import {
  ACCENTS,
  COULEURS_FOND,
  OPTIONS_DEFAUT,
  carteEnFichier,
  dessinerCarteSeance,
  type DonneesCarte,
  type FondCarte,
  type IdentiteCarte,
  type OptionsCarte,
} from '@/lib/carte-seance'
import { banniere } from '@/lib/bannieres'
import { chargerIdentiteCarte } from '@/app/(carnet)/partage/actions'

/* ============================================================
   Éditeur de carte de séance
   ============================================================
   Un aperçu fidèle (c'est la vraie image, redessinée à chaque
   réglage) et trois onglets : fond, contenu, style. La photo
   choisie reste sur le téléphone : elle n'est lue que pour être
   dessinée sur la carte.
   ============================================================ */

type Onglet = 'fond' | 'contenu' | 'style'

const CLE_REGLAGES = 'fonte-carte-seance'

export function EditeurCarte({
  donnees,
  ouvert,
  onFermer,
}: {
  donnees: DonneesCarte
  ouvert: boolean
  onFermer: () => void
}) {
  const [monte, setMonte] = useState(false)
  const [identite, setIdentite] = useState<IdentiteCarte | null>(null)
  const [o, setO] = useState<OptionsCarte>(OPTIONS_DEFAUT)
  const [onglet, setOnglet] = useState<Onglet>('fond')
  const [photo, setPhoto] = useState<ImageBitmap | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const champPhoto = useRef<HTMLInputElement>(null)
  const pastille = usePastille(onglet)

  useEffect(() => setMonte(true), [])

  // À l'ouverture : mon identité, et mes derniers réglages.
  useEffect(() => {
    if (!ouvert) return
    let actif = true
    chargerIdentiteCarte().then((i) => actif && setIdentite(i))
    try {
      const brut = localStorage.getItem(CLE_REGLAGES)
      if (brut) {
        const r = JSON.parse(brut) as Partial<OptionsCarte>
        // La photo n'est jamais gardée : on revient sur la teinte.
        setO({ ...OPTIONS_DEFAUT, ...r, fond: r.fond === 'photo' ? 'teinte' : (r.fond ?? 'teinte') })
      }
    } catch {
      // Réglages illisibles : valeurs par défaut.
    }
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      actif = false
      document.body.style.overflow = avant
    }
  }, [ouvert])

  // L'aperçu est la vraie image, redessinée après chaque réglage.
  useEffect(() => {
    if (!ouvert || !identite) return
    let annule = false
    const minuteur = setTimeout(async () => {
      const toile = await dessinerCarteSeance(donnees, identite, o, photo)
      if (annule) return
      toile.toBlob(
        (b) => {
          if (annule || !b) return
          setApercu((ancien) => {
            if (ancien) URL.revokeObjectURL(ancien)
            return URL.createObjectURL(b)
          })
        },
        o.fond === 'transparent' ? 'image/png' : 'image/jpeg',
        0.85
      )
    }, 120)
    return () => {
      annule = true
      clearTimeout(minuteur)
    }
  }, [ouvert, identite, o, photo, donnees])

  function changer(p: Partial<OptionsCarte>) {
    setO((avant) => {
      const n = { ...avant, ...p }
      try {
        localStorage.setItem(CLE_REGLAGES, JSON.stringify(n))
      } catch {
        // Stockage indisponible : tant pis.
      }
      return n
    })
  }

  async function choisirPhoto(f: File | undefined) {
    if (!f) return
    try {
      setPhoto(await createImageBitmap(f))
      changer({ fond: 'photo' })
    } catch {
      setMessage('Cette photo ne peut pas être lue.')
    }
  }

  async function fichier(): Promise<File | null> {
    if (!identite) return null
    const toile = await dessinerCarteSeance(donnees, identite, o, photo)
    return carteEnFichier(toile, o.fond === 'transparent', `fonte-${donnees.date}`)
  }

  async function partager() {
    setEnCours(true)
    setMessage(null)
    try {
      const f = await fichier()
      if (!f) return
      if (navigator.canShare?.({ files: [f] })) {
        try {
          await navigator.share({ files: [f], title: donnees.titre })
        } catch {
          // Partage annulé.
        }
        return
      }
      telecharger(f)
    } finally {
      setEnCours(false)
    }
  }

  async function enregistrer() {
    setEnCours(true)
    try {
      const f = await fichier()
      if (f) telecharger(f)
    } finally {
      setEnCours(false)
    }
  }

  function telecharger(f: File) {
    const lien = document.createElement('a')
    lien.href = URL.createObjectURL(f)
    lien.download = f.name
    lien.click()
    setTimeout(() => URL.revokeObjectURL(lien.href), 1000)
    setMessage('Image enregistrée.')
  }

  if (!monte || !ouvert) return null

  const fonds: { cle: FondCarte; nom: string; fond: string; taille?: string }[] = [
    {
      cle: 'teinte',
      nom: 'Ma teinte',
      fond: identite ? `${banniere(identite.teinte).fond}, #0e0f11` : '#0e0f11',
    },
    { cle: 'photo', nom: 'Ma photo', fond: 'linear-gradient(170deg, #4a3a30, #121315)' },
    { cle: 'transparent', nom: 'Sans fond', fond: 'repeating-conic-gradient(#2a2d33 0% 25%, #1c1e22 0% 50%)', taille: '14px 14px' },
    { cle: 'uni', nom: 'Couleur', fond: o.couleurFond },
  ]

  const blocs: { cle: keyof OptionsCarte; nom: string; dispo: boolean }[] = [
    { cle: 'titre', nom: 'Titre et date', dispo: true },
    { cle: 'chiffres', nom: 'Chiffres', dispo: true },
    { cle: 'exercices', nom: 'Exercices', dispo: donnees.exercices.length > 0 },
    { cle: 'record', nom: 'Record', dispo: donnees.record !== null },
    { cle: 'identite', nom: 'Avatar et niveau', dispo: true },
    { cle: 'poids', nom: 'Afficher les poids', dispo: true },
  ]

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Partager ma séance"
      className="securise fixed inset-0 z-[80] overflow-y-auto bg-fond"
    >
      <div className="mx-auto flex max-w-md flex-col px-4 pt-3 pb-8">
        <header className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="flex h-11 w-11 items-center justify-center rounded-pilule bg-verre"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <h1 className="flex-1 text-[17px] font-bold">Partager ma séance</h1>
          <span className="font-mono text-[11px] text-encre-douce uppercase">Story 9:16</span>
        </header>

        {/* Aperçu */}
        <div className="mt-4 flex justify-center">
          <div
            className="relative aspect-[9/16] w-[min(62vw,280px)] overflow-hidden rounded-[18px] shadow-[0_18px_50px_rgb(0_0_0/0.5)]"
            style={
              o.fond === 'transparent'
                ? { background: 'repeating-conic-gradient(#2a2d33 0% 25%, #1c1e22 0% 50%)', backgroundSize: '16px 16px' }
                : { background: '#17191c' }
            }
          >
            {apercu ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apercu} alt="Aperçu de la carte" className="absolute inset-0 h-full w-full" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-encre-douce">
                Préparation…
              </span>
            )}
          </div>
        </div>

        {/* Onglets */}
        <div
          ref={pastille.ref}
          role="tablist"
          aria-label="Réglages de la carte"
          className="relative mt-5 grid grid-cols-3 gap-1 rounded-bloc bg-verre p-1"
        >
          <Pastille pos={pastille.pos} arrondi="rounded-[11px]" />
          {(
            [
              ['fond', 'Fond'],
              ['contenu', 'Contenu'],
              ['style', 'Style'],
            ] as [Onglet, string][]
          ).map(([cle, nom]) => (
            <button
              key={cle}
              type="button"
              role="tab"
              aria-selected={onglet === cle}
              data-actif={onglet === cle}
              onClick={() => setOnglet(cle)}
              className={`relative h-10 rounded-[11px] text-[15px] transition-colors duration-300 ${
                onglet === cle ? `${pastille.fond} font-semibold text-fond` : 'text-encre-douce'
              }`}
            >
              {nom}
            </button>
          ))}
        </div>

        <div className="mt-3.5 min-h-[200px]">
          {onglet === 'fond' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-4 gap-2">
                {fonds.map((f) => (
                  <button
                    key={f.cle}
                    type="button"
                    aria-pressed={o.fond === f.cle}
                    onClick={() => (f.cle === 'photo' && !photo ? champPhoto.current?.click() : changer({ fond: f.cle }))}
                    className="flex flex-col items-center gap-1.5 text-[12px]"
                  >
                    <span
                      className={`flex h-[76px] w-full items-center justify-center rounded-bloc ${
                        o.fond === f.cle ? 'ring-[2.5px] ring-encre' : ''
                      }`}
                      style={{ background: f.fond, backgroundSize: f.taille }}
                    >
                      {f.cle === 'photo' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4f3ee" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <rect x="3" y="5" width="18" height="14" rx="3" />
                          <circle cx="12" cy="12" r="3.5" />
                          <path d="M8 5l1.5-2h5L16 5" />
                        </svg>
                      )}
                    </span>
                    {f.nom}
                  </button>
                ))}
              </div>
              <input
                ref={champPhoto}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void choisirPhoto(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              {o.fond === 'photo' && (
                <button
                  type="button"
                  onClick={() => champPhoto.current?.click()}
                  className="appui h-11 rounded-bloc bg-verre text-[15px] font-semibold"
                >
                  {photo ? 'Changer de photo' : 'Choisir une photo'}
                </button>
              )}
              {o.fond === 'uni' && (
                <div className="flex gap-2.5">
                  {COULEURS_FOND.map((c) => (
                    <button
                      key={c.couleur}
                      type="button"
                      aria-label={c.nom}
                      aria-pressed={o.couleurFond === c.couleur}
                      onClick={() => changer({ couleurFond: c.couleur })}
                      className={`h-11 w-11 rounded-full ${o.couleurFond === c.couleur ? 'ring-2 ring-encre ring-offset-2 ring-offset-fond' : 'ring-1 ring-filet'}`}
                      style={{ background: c.couleur }}
                    />
                  ))}
                </div>
              )}
              <p className="px-0.5 text-[13px] leading-relaxed text-encre-douce">
                {o.fond === 'teinte' && 'Ta teinte et ton motif actuels.'}
                {o.fond === 'photo' && "Ta photo n'est jamais envoyée : tout se fait sur ton téléphone."}
                {o.fond === 'transparent' && 'Une image sans fond (PNG). Dans Instagram, ajoute-la en sticker sur ta photo.'}
                {o.fond === 'uni' && 'Un fond de couleur unie.'}
              </p>
            </div>
          )}

          {onglet === 'contenu' && (
            <div className="flex flex-col rounded-carte bg-verre px-3.5">
              {blocs
                .filter((b) => b.dispo)
                .map((b) => {
                  const actif = o[b.cle] === true
                  return (
                    <button
                      key={b.cle}
                      type="button"
                      role="switch"
                      aria-checked={actif}
                      onClick={() => changer({ [b.cle]: !actif } as Partial<OptionsCarte>)}
                      className="flex h-[50px] items-center justify-between gap-3 border-b border-filet text-left text-[15px] last:border-0"
                    >
                      {b.nom}
                      <span className={`relative h-7 w-[46px] shrink-0 rounded-pilule transition-colors ${actif ? 'bg-valide' : 'bg-verre-fort'}`}>
                        <span
                          className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-[left] duration-200"
                          style={{ left: actif ? 21 : 3 }}
                        />
                      </span>
                    </button>
                  )
                })}
            </div>
          )}

          {onglet === 'style' && (
            <div className="flex flex-col gap-4">
              <Segments
                titre="Position"
                valeur={o.position}
                options={[
                  ['haut', 'Haut'],
                  ['centre', 'Centre'],
                  ['bas', 'Bas'],
                ]}
                onChange={(v) => changer({ position: v as OptionsCarte['position'] })}
              />
              <Segments
                titre="Taille"
                valeur={o.grand ? 'grand' : 'compact'}
                options={[
                  ['compact', 'Compacte'],
                  ['grand', 'Grande'],
                ]}
                onChange={(v) => changer({ grand: v === 'grand' })}
              />
              <div className="flex flex-col gap-2">
                <span className="px-0.5 text-[14px] font-semibold text-encre-douce">Couleur d&apos;accent</span>
                <div className="flex gap-2.5">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.couleur}
                      type="button"
                      aria-label={a.nom}
                      aria-pressed={o.accent === a.couleur}
                      onClick={() => changer({ accent: a.couleur })}
                      className={`h-11 w-11 rounded-full ${o.accent === a.couleur ? 'ring-2 ring-encre ring-offset-2 ring-offset-fond' : ''}`}
                      style={{ background: a.couleur }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={partager}
            disabled={enCours || !identite || (o.fond === 'photo' && !photo)}
            className="appui flex h-14 items-center justify-center gap-2 rounded-bloc bg-accent text-[16px] font-bold text-white disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
            {enCours ? 'Préparation…' : 'Partager'}
          </button>
          <button
            type="button"
            onClick={enregistrer}
            disabled={enCours || !identite || (o.fond === 'photo' && !photo)}
            className="appui h-12 rounded-bloc bg-verre text-[15px] font-semibold disabled:opacity-50"
          >
            Enregistrer l&apos;image
          </button>
          <p className="text-center text-[12px] text-encre-douce">
            {message ?? 'Instagram, WhatsApp… Ta photo n’est jamais envoyée sur nos serveurs.'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Segments({
  titre,
  valeur,
  options,
  onChange,
}: {
  titre: string
  valeur: string
  options: [string, string][]
  onChange: (v: string) => void
}) {
  const pastille = usePastille(valeur)
  return (
    <div className="flex flex-col gap-2">
      <span className="px-0.5 text-[14px] font-semibold text-encre-douce">{titre}</span>
      <div
        ref={pastille.ref}
        className="relative grid gap-1 rounded-bloc bg-verre p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <Pastille pos={pastille.pos} arrondi="rounded-[11px]" />
        {options.map(([cle, nom]) => (
          <button
            key={cle}
            type="button"
            aria-pressed={valeur === cle}
            data-actif={valeur === cle}
            onClick={() => onChange(cle)}
            className={`relative h-[38px] rounded-[11px] text-[14px] transition-colors duration-300 ${
              valeur === cle ? `${pastille.fond} font-semibold text-fond` : 'text-encre-douce'
            }`}
          >
            {nom}
          </button>
        ))}
      </div>
    </div>
  )
}
