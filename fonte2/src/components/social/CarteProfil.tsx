'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { IconeCroix, IconePartage } from '@/components/Icones'

/* ============================================================
   Carte de profil partageable
   ============================================================
   Le haut reprend l'identité sombre du carnet et la teinte de la
   bannière. Le bas est une bande claire qui porte le QR code.

   Cette bande n'est pas un choix esthétique : un QR code doit
   être sombre sur fond clair. L'inverse fonctionne mal — beaucoup
   d'appareils photo ne le détectent pas, surtout en photo
   d'écran, qui est précisément l'usage ici.

   Pas de statistiques sur la carte : elle circule, et des
   chiffres deviendraient faux dès le lendemain.
   ============================================================ */

const L = 900
const H = 1200
const BANDE = 300

/** Couleur de chaque teinte, reprise des bannières. */
const TEINTES: Record<string, string> = {
  braise: '255,75,43',
  nuit: '76,201,240',
  acier: '148,163,184',
  foret: '22,163,74',
  prune: '162,28,175',
  sable: '217,119,6',
}

export function CarteProfil({
  pseudo,
  avatar,
  niveau,
  rang,
  banniere,
}: {
  pseudo: string
  avatar: string
  niveau: number
  rang: string
  banniere: string | null
}) {
  const [enCours, setEnCours] = useState(false)
  const [apercu, setApercu] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [monte, setMonte] = useState(false)

  useEffect(() => setMonte(true), [])

  async function generer(): Promise<Blob | null> {
    // Calculée ici et non au rendu : le composant passe d'abord
    // par le serveur, où `window` n'existe pas.
    const adresse = `${window.location.origin}/u/${encodeURIComponent(pseudo)}`

    try {
      await Promise.all([
        document.fonts.load('400 120px "Bebas Neue"'),
        document.fonts.load('400 30px "IBM Plex Mono"'),
        document.fonts.load('600 30px Inter'),
      ])
    } catch {
      // Polices indisponibles : on dessine quand même
    }

    const toile = document.createElement('canvas')
    toile.width = L
    toile.height = H
    const ctx = toile.getContext('2d')
    if (!ctx) return null

    /* ---- Fond sombre et teinte ---- */
    ctx.fillStyle = '#0e0f11'
    ctx.fillRect(0, 0, L, H)

    const rgb = TEINTES[banniere ?? 'braise'] ?? TEINTES.braise
    const teinte = ctx.createRadialGradient(L / 2, 0, 0, L / 2, 0, H * 0.75)
    teinte.addColorStop(0, `rgba(${rgb},0.34)`)
    teinte.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = teinte
    ctx.fillRect(0, 0, L, H - BANDE)

    /* ---- Logo ---- */
    ctx.font = '400 54px "Bebas Neue", sans-serif'
    ctx.fillStyle = '#f4f3ee'
    ctx.fillText('FONTE', 72, 120)
    const largeurLogo = ctx.measureText('FONTE').width
    ctx.fillStyle = '#ff4b2b'
    ctx.fillText('.', 72 + largeurLogo, 120)

    /* ---- Avatar ---- */
    ctx.font = '110px sans-serif'
    ctx.fillText(avatar, 72, 470)

    /* ---- Pseudo, ajusté à la largeur ---- */
    let taille = 150
    ctx.font = `400 ${taille}px "Bebas Neue", sans-serif`
    while (ctx.measureText(pseudo.toUpperCase()).width > L - 144 && taille > 60) {
      taille -= 6
      ctx.font = `400 ${taille}px "Bebas Neue", sans-serif`
    }
    ctx.fillStyle = '#f4f3ee'
    ctx.fillText(pseudo.toUpperCase(), 72, 640)

    ctx.font = '400 30px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#4cc9f0'
    ctx.fillText(`NIVEAU ${niveau} · ${rang.toUpperCase()}`, 72, 700)

    /* ---- Bande claire et QR ---- */
    ctx.fillStyle = '#f4f3ee'
    ctx.fillRect(0, H - BANDE, L, BANDE)

    const qr = await QRCode.toDataURL(adresse, {
      margin: 0,
      width: 400,
      // Correction d'erreur moyenne : le code reste lisible même
      // un peu abîmé par une compression d'image.
      errorCorrectionLevel: 'M',
      color: { dark: '#0e0f11', light: '#f4f3ee' },
    })
    const image = await charger(qr)
    const coteQr = 200
    ctx.drawImage(image, 72, H - BANDE + 50, coteQr, coteQr)

    ctx.font = '600 38px Inter, sans-serif'
    ctx.fillStyle = '#16181b'
    ctx.fillText('Scanne pour me suivre', 72 + coteQr + 44, H - BANDE + 138)

    ctx.font = '400 26px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#5f6368'
    const court = adresse.replace(/^https?:\/\//, '')
    ctx.fillText(tronquer(ctx, court, L - (72 + coteQr + 44) - 60), 72 + coteQr + 44, H - BANDE + 186)

    return await new Promise((resoudre) =>
      toile.toBlob((b) => resoudre(b), 'image/jpeg', 0.92)
    )
  }

  async function ouvrir() {
    setErreur(null)
    setEnCours(true)
    try {
      const blob = await generer()
      if (!blob) throw new Error()
      setApercu(URL.createObjectURL(blob))
    } catch {
      setErreur('La carte ne peut pas être générée.')
    } finally {
      setEnCours(false)
    }
  }

  async function partager() {
    const blob = await generer()
    if (!blob) return

    const fichier = new File([blob], `fonte-${pseudo}.jpg`, { type: 'image/jpeg' })

    // Sur téléphone, la feuille de partage du système propose
    // directement les messageries. Ailleurs, on télécharge.
    if (navigator.canShare?.({ files: [fichier] })) {
      try {
        await navigator.share({ files: [fichier], title: `${pseudo} sur FONTE` })
        return
      } catch {
        // Partage annulé : rien à faire
        return
      }
    }

    const lien = document.createElement('a')
    lien.href = URL.createObjectURL(blob)
    lien.download = fichier.name
    lien.click()
    setTimeout(() => URL.revokeObjectURL(lien.href), 1000)
  }

  function fermer() {
    if (apercu) URL.revokeObjectURL(apercu)
    setApercu(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        disabled={enCours}
        aria-label="Partager mon profil"
        title="Partager mon profil"
        className="appui flex h-10 w-10 items-center justify-center rounded-bloc
                   bg-verre text-encre-douce transition-colors
                   hover:bg-verre-fort hover:text-encre disabled:opacity-50"
      >
        <IconePartage className="h-[18px] w-[18px]" />
      </button>

      {erreur && <p className="mt-2 font-mono text-[11px] text-accent">{erreur}</p>}

      {/* L'aperçu est déplacé à la racine du document. Sans ça, un
          parent qui borne ses descendants l'empêchait de couvrir
          tout l'écran — même cause que pour les notifications. */}
      {apercu &&
        monte &&
        createPortal(
          <div
            className="voile fixed inset-0 z-[150] flex flex-col items-center
                       justify-center gap-4 bg-black/85 p-5"
            onClick={(e) => {
              if (e.target === e.currentTarget) fermer()
            }}
          >
            <button
              type="button"
              onClick={fermer}
              aria-label="Fermer"
              className="absolute right-4 top-4 flex h-10 w-10 items-center
                         justify-center rounded-bloc bg-verre text-encre"
              style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            >
              <IconeCroix className="h-4 w-4" />
            </button>

            {/* `min-h-0` est indispensable : sans lui, l'image
                déborde du conteneur au lieu de se réduire, et la
                page se met à défiler. */}
            <div className="flex min-h-0 flex-1 items-center justify-center py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={apercu}
                alt="Aperçu de ta carte de profil"
                className="carte-monte max-h-full w-auto max-w-full rounded-carte
                           object-contain"
              />
            </div>

            <button
              type="button"
              onClick={partager}
              className="appui mb-[env(safe-area-inset-bottom)] shrink-0 rounded-bloc
                         bg-accent px-8 py-3.5 font-semibold text-white"
            >
              Partager
            </button>
          </div>,
          document.body
        )}
    </>
  )
}

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const img = new Image()
    img.onload = () => resoudre(img)
    img.onerror = rejeter
    img.src = src
  })
}

function tronquer(ctx: CanvasRenderingContext2D, texte: string, max: number): string {
  if (ctx.measureText(texte).width <= max) return texte
  let t = texte
  while (t.length > 4 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}
