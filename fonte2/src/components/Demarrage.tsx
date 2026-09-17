'use client'

import { useEffect, useState } from 'react'
import { IconeSeances } from '@/components/Icones'

/* ============================================================
   Écran de démarrage
   ============================================================
   Uniquement à l'ouverture de l'application installée, pas entre
   les pages. Il remplace l'écran noir que le système affiche
   pendant que la page se charge.

   Dans un navigateur ordinaire, il ne s'affiche pas : on vient
   d'ailleurs, on ne « lance » rien.
   ============================================================ */

const DUREE_MIN = 700

export function Demarrage() {
  const [visible, setVisible] = useState(false)
  const [sort, setSort] = useState(false)

  useEffect(() => {
    const installee =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true

    if (!installee) return

    // Une seule fois par session : revenir sur l'application
    // depuis l'arrière-plan n'est pas un lancement.
    try {
      if (sessionStorage.getItem('fonte-demarre')) return
      sessionStorage.setItem('fonte-demarre', '1')
    } catch {
      // Stockage refusé : on affiche quand même
    }

    setVisible(true)
    const t1 = setTimeout(() => setSort(true), DUREE_MIN)
    const t2 = setTimeout(() => setVisible(false), DUREE_MIN + 400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[300] flex flex-col items-center justify-center
                  bg-fond transition-opacity duration-400
                  ${sort ? 'opacity-0' : 'opacity-100'}`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 12%, rgb(255 75 43 / 0.22), transparent 58%),' +
          'radial-gradient(circle at 85% 80%, rgb(76 201 240 / 0.14), transparent 55%)',
      }}
    >
      <div className="flex flex-col items-center gap-7">
        <span className="demarrage-respire flex h-16 w-16 items-center justify-center
                         rounded-carte border border-bordure bg-verre text-encre">
          <IconeSeances className="h-8 w-8" />
        </span>
        <p className="font-display text-4xl tracking-wide">
          FONTE<span className="text-accent">.</span>
        </p>
      </div>

      <p className="section-titre absolute bottom-10">Carnet de performance</p>
    </div>
  )
}
