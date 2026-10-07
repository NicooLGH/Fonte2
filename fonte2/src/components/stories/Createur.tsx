'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { depuisFichier, envoyerStory, recadrer, type Etiquette, type TypeEtiquette } from '@/lib/stories'
import { EtiquetteStory } from './EtiquetteStory'
import { publierStory } from '@/app/story/actions'

/* ============================================================
   Créer une story
   ============================================================
   Le viseur de l'appareil photo (ou une photo de la galerie),
   une étiquette à poser dessus, et c'est publié pour 24 h.
   L'aperçu de l'étiquette est indicatif : c'est la base qui la
   remplit avec les vraies données au moment de publier.
   ============================================================ */

export type Apercus = {
  seance: Extract<Etiquette, { type: 'seance' }> | null
  record: Extract<Etiquette, { type: 'record' }> | null
  niveau: Extract<Etiquette, { type: 'niveau' }>
}

export function Createur({
  userId,
  apercus,
  typeInitial,
}: {
  userId: string
  apercus: Apercus
  typeInitial: TypeEtiquette
}) {
  const router = useRouter()
  const video = useRef<HTMLVideoElement>(null)
  const galerie = useRef<HTMLInputElement>(null)
  const flux = useRef<MediaStream | null>(null)
  const zone = useRef<HTMLDivElement>(null)

  const [face, setFace] = useState<'environment' | 'user'>('environment')
  const [cameraKo, setCameraKo] = useState(false)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)
  const [type, setType] = useState<TypeEtiquette>(() => {
    if (typeInitial === 'seance' && apercus.seance) return 'seance'
    if (typeInitial === 'record' && apercus.record) return 'record'
    if (typeInitial === 'niveau') return 'niveau'
    return apercus.seance ? 'seance' : 'aucune'
  })
  const [position, setPosition] = useState(0.62)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  /* ---- Caméra ---- */
  const arreter = useCallback(() => {
    flux.current?.getTracks().forEach((t) => t.stop())
    flux.current = null
  }, [])

  useEffect(() => {
    if (photo) return
    let annule = false
    ;(async () => {
      try {
        const f = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: face, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (annule) {
          f.getTracks().forEach((t) => t.stop())
          return
        }
        arreter()
        flux.current = f
        if (video.current) {
          video.current.srcObject = f
          await video.current.play().catch(() => {})
        }
        setCameraKo(false)
      } catch {
        setCameraKo(true)
      }
    })()
    return () => {
      annule = true
    }
  }, [face, photo, arreter])

  useEffect(() => () => arreter(), [arreter])
  useEffect(() => () => {
    if (apercu) URL.revokeObjectURL(apercu)
  }, [apercu])

  async function prendre() {
    const v = video.current
    if (!v || !v.videoWidth) return
    try {
      const b = await recadrer(v, v.videoWidth, v.videoHeight, face === 'user')
      garder(b)
    } catch {
      setErreur('La photo n’a pas pu être prise.')
    }
  }

  async function choisir(f: File | undefined) {
    if (!f) return
    try {
      garder(await depuisFichier(f))
    } catch {
      setErreur('Cette image ne peut pas être lue.')
    }
  }

  function garder(b: Blob) {
    arreter()
    setPhoto(b)
    setApercu(URL.createObjectURL(b))
    setErreur(null)
  }

  function reprendre() {
    setPhoto(null)
    setApercu(null)
  }

  async function publier() {
    if (!photo) return
    setEnvoi(true)
    setErreur(null)
    const e = await envoyerStory(userId, photo)
    if (!e.chemin) {
      setErreur(e.erreur ?? 'Envoi impossible.')
      setEnvoi(false)
      return
    }
    const r = await publierStory(e.chemin, type, position)
    if (r.erreur) {
      setErreur(r.erreur)
      setEnvoi(false)
      return
    }
    router.push(`/story?u=${userId}`)
    router.refresh()
  }

  /* ---- Étiquette déplaçable (verticalement) ---- */
  function glisser(e: React.PointerEvent) {
    const el = zone.current
    if (!el) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const bouger = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect()
      setPosition(Math.min(0.9, Math.max(0.12, (ev.clientY - r.top) / r.height)))
    }
    const lacher = () => {
      window.removeEventListener('pointermove', bouger)
      window.removeEventListener('pointerup', lacher)
    }
    window.addEventListener('pointermove', bouger)
    window.addEventListener('pointerup', lacher)
  }

  const etiquette: Etiquette =
    type === 'seance' && apercus.seance
      ? apercus.seance
      : type === 'record' && apercus.record
        ? apercus.record
        : type === 'niveau'
          ? apercus.niveau
          : { type: 'aucune' }

  const choix: { cle: TypeEtiquette; nom: string; possible: boolean }[] = [
    { cle: 'seance', nom: 'Séance', possible: !!apercus.seance },
    { cle: 'record', nom: 'Record', possible: !!apercus.record },
    { cle: 'niveau', nom: 'Niveau', possible: true },
    { cle: 'aucune', nom: 'Aucune', possible: true },
  ]

  return (
    <main className="sombre fixed inset-0 flex flex-col bg-black text-encre">
      <input
        ref={galerie}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void choisir(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {/* Viseur ou aperçu */}
      <div ref={zone} className="relative mx-auto w-full max-w-md flex-1 overflow-hidden rounded-b-[28px] bg-[#16181b]">
        {apercu ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="Aperçu de ta story" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video
            ref={video}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${face === 'user' ? '-scale-x-100' : ''}`}
          />
        )}

        {cameraKo && !apercu && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-[16px] leading-relaxed text-encre-douce">
              L&apos;appareil photo n&apos;est pas accessible. Autorise-le dans ton navigateur, ou
              choisis une photo.
            </p>
            <button
              type="button"
              onClick={() => galerie.current?.click()}
              className="h-12 rounded-full bg-white px-6 text-[16px] font-bold text-black"
            >
              Choisir une photo
            </button>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />

        {/* Haut */}
        <div className="securise-haut absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-2">
          <button
            type="button"
            onClick={() => {
              arreter()
              router.back()
            }}
            aria-label="Fermer"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {apercu && (
            <button
              type="button"
              onClick={reprendre}
              className="h-11 rounded-full bg-black/35 px-4 text-[15px] font-semibold"
            >
              Reprendre
            </button>
          )}
        </div>

        {/* Étiquette, déplaçable */}
        {etiquette.type !== 'aucune' && (
          <div
            className="absolute inset-x-4 flex justify-center"
            style={{ top: `${position * 100}%`, transform: 'translateY(-50%)' }}
          >
            <div
              onPointerDown={glisser}
              className="cursor-grab touch-none active:cursor-grabbing"
              role="slider"
              aria-label="Position de l'étiquette"
              aria-valuemin={12}
              aria-valuemax={90}
              aria-valuenow={Math.round(position * 100)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') setPosition((p) => Math.max(0.12, p - 0.04))
                if (e.key === 'ArrowDown') setPosition((p) => Math.min(0.9, p + 0.04))
              }}
            >
              <EtiquetteStory etiquette={etiquette} />
            </div>
          </div>
        )}

        {/* Choix de l'étiquette */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 px-3">
          {choix
            .filter((c) => c.possible)
            .map((c) => (
              <button
                key={c.cle}
                type="button"
                aria-pressed={type === c.cle}
                onClick={() => setType(c.cle)}
                className={`h-10 rounded-full px-4 text-[15px] backdrop-blur-md ${
                  type === c.cle ? 'bg-white font-semibold text-black' : 'bg-black/45'
                }`}
              >
                {c.nom}
              </button>
            ))}
        </div>
      </div>

      {/* Commandes */}
      <div className="securise mx-auto w-full max-w-md px-6 pt-5 pb-4">
        {erreur && <p className="mb-3 text-center text-[14px] text-[#ff8a63]">{erreur}</p>}

        {apercu ? (
          <button
            type="button"
            onClick={publier}
            disabled={envoi}
            className="appui h-[58px] w-full rounded-[16px] bg-accent text-[17px] font-bold text-white disabled:opacity-60"
          >
            {envoi ? 'Publication…' : 'Publier ma story'}
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => galerie.current?.click()}
              aria-label="Choisir dans la galerie"
              className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/12"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </button>
            <button
              type="button"
              onClick={prendre}
              disabled={cameraKo}
              aria-label="Prendre la photo"
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white disabled:opacity-30"
            >
              <span className="h-[60px] w-[60px] rounded-full bg-white transition-transform active:scale-90" />
            </button>
            <button
              type="button"
              onClick={() => setFace(face === 'environment' ? 'user' : 'environment')}
              disabled={cameraKo}
              aria-label="Changer de caméra"
              className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/12 disabled:opacity-30"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12a8 8 0 0 1 14-5.3L20 8M20 12a8 8 0 0 1-14 5.3L4 16M20 4v4h-4M4 20v-4h4" />
              </svg>
            </button>
          </div>
        )}
        <p className="mt-3 text-center font-mono text-[12px] text-white/60">
          Visible par tes amis pendant 24 h · 1 par jour
        </p>
      </div>
    </main>
  )
}
