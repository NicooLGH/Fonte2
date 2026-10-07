'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ecrireAttente, lireAttente } from '@/lib/attente'
import { enregistrerSeanceLive } from '@/app/(carnet)/seances/actions'

/**
 * Envoie les séances gardées hors ligne dès que le réseau revient,
 * et le dit d'une ligne en haut de l'écran.
 */
export function EnvoiEnAttente({ userId }: { userId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [restantes, setRestantes] = useState(0)
  const enCours = useRef(false)

  useEffect(() => {
    const envoyer = async () => {
      const liste = lireAttente(userId)
      setRestantes(liste.length)
      if (!liste.length || enCours.current || navigator.onLine === false) return
      enCours.current = true
      let envoyees = 0
      const reste: typeof liste = []
      for (const s of liste) {
        try {
          const r = await enregistrerSeanceLive(s.blocs, s.note, s.dureeSec, s.nom, s.id, s.date)
          // Une séance refusée par la base (session expirée) reste en attente.
          if (r.erreur && r.erreur.includes('Session')) reste.push(s)
          else envoyees++
        } catch {
          reste.push(s)
        }
      }
      ecrireAttente(userId, reste)
      setRestantes(reste.length)
      enCours.current = false
      if (envoyees > 0) {
        setMessage(envoyees > 1 ? `${envoyees} séances envoyées` : 'Séance envoyée')
        router.refresh()
        setTimeout(() => setMessage(null), 4000)
      }
    }

    void envoyer()
    window.addEventListener('online', envoyer)
    document.addEventListener('visibilitychange', envoyer)
    return () => {
      window.removeEventListener('online', envoyer)
      document.removeEventListener('visibilitychange', envoyer)
    }
  }, [userId, router])

  if (!message && restantes === 0) return null

  return (
    <p
      role="status"
      className={`fixed inset-x-0 z-40 mx-auto w-fit rounded-pilule px-4 py-2 text-[14px] font-semibold shadow-lg ${
        message ? 'bg-accent-2 text-fond' : 'bg-verre text-encre'
      }`}
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      {message ??
        `${restantes} séance${restantes > 1 ? 's' : ''} en attente de réseau`}
    </p>
  )
}
