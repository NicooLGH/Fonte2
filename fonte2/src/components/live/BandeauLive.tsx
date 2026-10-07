'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cleLive, DUREE_MAX_MS, type SeanceLive } from '@/lib/live'

/* ============================================================
   Séance réduite
   ============================================================
   Quand on quitte l'écran de séance par « Réduire », la séance
   reste dans le stockage local. Ce bandeau, posé au-dessus de
   la barre du bas, la rappelle et permet d'y revenir d'un appui.
   ============================================================ */

export function BandeauLive({ userId }: { userId: string }) {
  const chemin = usePathname()
  const [seance, setSeance] = useState<Pick<SeanceLive, 'nom' | 'debut' | 'fin'> | null>(null)
  const [maintenant, setMaintenant] = useState(() => Date.now())

  // Relu à chaque page et à chaque retour sur l'application.
  useEffect(() => {
    const lire = () => {
      try {
        const brut = localStorage.getItem(cleLive(userId))
        if (!brut) return setSeance(null)
        const s = JSON.parse(brut) as SeanceLive
        setSeance(Date.now() - s.debut > DUREE_MAX_MS ? null : s)
      } catch {
        setSeance(null)
      }
    }
    lire()
    document.addEventListener('visibilitychange', lire)
    return () => document.removeEventListener('visibilitychange', lire)
  }, [userId, chemin])

  useEffect(() => {
    if (!seance) return
    const t = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(t)
  }, [seance])

  if (!seance) return null

  const ms = (seance.fin ?? maintenant) - seance.debut
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = String(t % 60).padStart(2, '0')
  const chrono = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`

  return (
    <Link
      href="/live?reprendre=1"
      className="appui fixed inset-x-4 z-30 mx-auto flex h-14 max-w-md items-center gap-3 rounded-pilule
                 bg-accent pr-2 pl-5 text-white shadow-lg"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.75rem)' }}
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white" />
      <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">
        {seance.nom || 'Séance'} en cours
      </span>
      <span className="font-mono text-[16px] tabular-nums">{chrono}</span>
      <span className="flex h-10 items-center rounded-pilule bg-white/20 px-4 text-[15px] font-bold">
        Reprendre
      </span>
    </Link>
  )
}
