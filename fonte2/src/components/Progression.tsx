'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/* ============================================================
   Fil de progression
   ============================================================
   Les pages du carnet sont rendues côté serveur : l'attente se
   compte souvent en centaines de millisecondes. Un écran de
   chargement complet qui apparaît et disparaît aussitôt donne
   une impression de saccade.

   Un fil en haut de l'écran passe inaperçu quand c'est rapide,
   rassure quand c'est lent, et laisse la navigation utilisable —
   on peut changer d'avis en route.
   ============================================================ */

/** En dessous, l'apparition ferait scintiller plus qu'informer. */
const DELAI_AVANT_AFFICHAGE = 120

export function Progression() {
  const chemin = usePathname()
  const [visible, setVisible] = useState(false)
  const [avancement, setAvancement] = useState(0)

  useEffect(() => {
    let montre: ReturnType<typeof setTimeout>
    let progresse: ReturnType<typeof setInterval>

    function demarrer() {
      montre = setTimeout(() => {
        setVisible(true)
        setAvancement(8)
        // Progression logarithmique : le fil avance vite au début
        // puis ralentit, sans jamais atteindre la fin. Annoncer
        // 100 % avant l'arrivée serait mentir.
        progresse = setInterval(() => {
          setAvancement((a) => (a >= 90 ? a : a + (90 - a) * 0.12))
        }, 160)
      }, DELAI_AVANT_AFFICHAGE)
    }

    function arreter() {
      clearTimeout(montre)
      clearInterval(progresse)
      setAvancement(100)
      // On laisse le fil finir sa course avant de disparaître.
      setTimeout(() => {
        setVisible(false)
        setAvancement(0)
      }, 260)
    }

    // Un clic sur un lien interne annonce une navigation.
    function surClic(e: MouseEvent) {
      const lien = (e.target as Element | null)?.closest?.('a')
      if (!(lien instanceof HTMLAnchorElement)) return
      if (lien.target === '_blank' || e.metaKey || e.ctrlKey) return

      const url = new URL(lien.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname) return

      demarrer()
    }

    document.addEventListener('click', surClic)
    return () => {
      document.removeEventListener('click', surClic)
      clearTimeout(montre)
      clearInterval(progresse)
    }
  }, [])

  // L'adresse a changé : la page est arrivée.
  useEffect(() => {
    setAvancement(100)
    const t = setTimeout(() => {
      setVisible(false)
      setAvancement(0)
    }, 260)
    return () => clearTimeout(t)
  }, [chemin])

  if (!visible) return null

  return (
    <div
      role="progressbar"
      aria-label="Chargement de la page"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(avancement)}
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px]"
    >
      <div
        className="h-full bg-accent transition-[width] duration-200 ease-out"
        style={{
          width: `${avancement}%`,
          // Une lueur discrète en bout de fil, comme un point qui
          // file vers la droite.
          boxShadow: '0 0 8px 1px rgb(255 75 43 / 0.5)',
        }}
      />
    </div>
  )
}
