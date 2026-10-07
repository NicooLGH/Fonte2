'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { creerClient } from '@/lib/supabase/client'
import {
  SIGNAL_LIVE_MS,
  lireEncouragement,
  signalerLive,
  type EncouragementLive,
} from '@/lib/live-social'
import { vibrer } from '@/lib/sons'

/* ============================================================
   Encouragements reçus pendant la séance
   ============================================================
   Deux rôles :
   1. dire à la base « je suis toujours en séance » toutes les
      deux minutes, tant que l'écran est ouvert ;
   2. afficher les smileys envoyés par les amis : ils montent
      dans un coin et s'effacent, avec une ligne discrète
      « X t'encourage ».

   Réception en temps réel via Supabase Realtime, doublée d'une
   vérification toutes les vingt secondes : le wifi d'une salle
   de sport n'est pas fiable, et un écran mis en veille coupe la
   connexion. Chaque encouragement n'est affiché qu'une fois.

   Rien ne s'affiche par-dessus les champs : les smileys passent
   dans la marge droite, sans capter les appuis.
   ============================================================ */

const VERIFICATION_MS = 20 * 1000
const DUREE_ENVOL_MS = 3200
const DUREE_BULLE_MS = 3800

type Envol = { cle: string; signe: string; decalage: number }

export function Encouragements({
  debut,
  actif,
}: {
  /** Départ du chrono, pour que les amis voient la bonne durée. */
  debut: number
  /** Faux sur l'écran de fin : on n'annonce plus la séance. */
  actif: boolean
}) {
  const [envols, setEnvols] = useState<Envol[]>([])
  const [bulle, setBulle] = useState<{ cle: string; texte: string } | null>(null)
  const [monte, setMonte] = useState(false)
  const vus = useRef(new Set<string>())
  const depuis = useRef(new Date().toISOString())

  useEffect(() => setMonte(true), [])

  /* ---- Signal de présence en séance ---- */
  useEffect(() => {
    if (!actif) return
    void signalerLive(debut)
    const t = setInterval(() => {
      if (!document.hidden) void signalerLive(debut)
    }, SIGNAL_LIVE_MS)
    const auRetour = () => {
      if (!document.hidden) void signalerLive(debut)
    }
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [actif, debut])

  /* ---- Réception ---- */
  useEffect(() => {
    if (!actif) return
    const supabase = creerClient()
    let annule = false

    function recevoir(e: EncouragementLive) {
      if (!e.id || vus.current.has(e.id)) return
      vus.current.add(e.id)
      if (e.date > depuis.current) depuis.current = e.date

      const cle = e.id
      setEnvols((l) => [
        ...l.slice(-7),
        { cle, signe: e.signe, decalage: Math.round(Math.random() * 28) - 14 },
      ])
      setTimeout(
        () => setEnvols((l) => l.filter((x) => x.cle !== cle)),
        DUREE_ENVOL_MS
      )

      setBulle({ cle, texte: `${e.pseudo} t'encourage ${e.signe}` })
      setTimeout(
        () => setBulle((b) => (b?.cle === cle ? null : b)),
        DUREE_BULLE_MS
      )
      vibrer(8)
    }

    async function rattraper() {
      if (document.hidden) return
      const { data } = await supabase.rpc('mes_encouragements_live', {
        depuis: depuis.current,
      })
      if (annule || !Array.isArray(data)) return
      for (const brut of data) recevoir(lireEncouragement(brut))
    }

    // Le temps réel filtre côté serveur sur le destinataire, et
    // la règle de lecture de la table empêche d'écouter ceux des
    // autres. On lui transmet le jeton de session explicitement :
    // selon les versions du client, il ne le prend pas toujours
    // seul.
    let canal: ReturnType<typeof supabase.channel> | null = null
    void (async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (annule || !session) return
      void supabase.realtime.setAuth(session.access_token)
      canal = supabase
        .channel(`live-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'encouragements_live',
            filter: `destinataire_id=eq.${session.user.id}`,
          },
          (p) => recevoir(lireEncouragement(p.new as Record<string, unknown>))
        )
        .subscribe()
    })()

    const t = setInterval(rattraper, VERIFICATION_MS)
    document.addEventListener('visibilitychange', rattraper)

    return () => {
      annule = true
      clearInterval(t)
      document.removeEventListener('visibilitychange', rattraper)
      if (canal) void supabase.removeChannel(canal)
    }
  }, [actif])

  if (!monte) return null

  return createPortal(
    <>
      {bulle && (
        <div
          key={bulle.cle}
          role="status"
          className="bulle-live pointer-events-none fixed left-1/2 z-40 -translate-x-1/2
                     whitespace-nowrap rounded-full bg-verre px-4 py-2 text-[15px]
                     font-semibold shadow-lg ring-1 ring-accent/30"
          style={{ top: 'calc(env(safe-area-inset-top) + 4.25rem)' }}
        >
          {bulle.texte}
        </div>
      )}

      <div
        aria-hidden
        className="pointer-events-none fixed right-3 z-40 w-12"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 8.5rem)' }}
      >
        {envols.map((e) => (
          <span
            key={e.cle}
            className="envol-live-long absolute bottom-0 left-1/2 text-[34px] leading-none"
            style={{ marginLeft: `${e.decalage - 17}px` }}
          >
            {e.signe}
          </span>
        ))}
      </div>
    </>,
    document.body
  )
}
