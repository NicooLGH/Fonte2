'use client'

import { useEffect, useState } from 'react'

/* ============================================================
   Écran de démarrage
   ============================================================
   Le navigateur qui a installé l'application affiche son propre
   écran avant que le moindre code ne s'exécute : icône centrée,
   nom en dessous, fond pris dans le manifeste. Il n'est pas
   supprimable.

   Celui-ci le prolonge plutôt que de le remplacer. Même fond,
   même composition, même icône — le passage de l'un à l'autre
   est invisible, et on ne voit qu'un seul démarrage.

   C'est pour ça que l'icône reprend le « F » du manifeste et non
   un autre motif : deux images différentes à la suite feraient
   un clignotement.
   ============================================================ */

const DUREE_MIN = 550

export function Demarrage() {
  const [visible, setVisible] = useState(false)
  const [sort, setSort] = useState(false)

  useEffect(() => {
    const installee =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true

    if (!installee) return

    // Une seule fois par session : revenir depuis l'arrière-plan
    // n'est pas un lancement.
    try {
      if (sessionStorage.getItem('fonte-demarre')) return
      sessionStorage.setItem('fonte-demarre', '1')
    } catch {
      // Stockage refusé : on affiche quand même
    }

    setVisible(true)
    const t1 = setTimeout(() => setSort(true), DUREE_MIN)
    const t2 = setTimeout(() => setVisible(false), DUREE_MIN + 350)

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
                  bg-fond transition-opacity duration-350
                  ${sort ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Même composition que l'écran du navigateur : l'icône,
          puis le nom juste en dessous. */}
      <div className="flex flex-col items-center gap-5">
        <span
          className="flex h-[88px] w-[88px] items-center justify-center rounded-[20px]"
          style={{
            background:
              'radial-gradient(circle at 25% 20%, #3a1c15, #0e0f11 70%)',
          }}
        >
          <span className="font-display text-[52px] leading-none text-encre">
            F<span className="text-accent">.</span>
          </span>
        </span>

        <p className="font-display text-[26px] tracking-wide">
          FONTE<span className="text-accent">.</span>
        </p>
      </div>

      <p className="section-titre absolute bottom-12">Carnet de performance</p>
    </div>
  )
}
