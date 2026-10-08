'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

/* ============================================================
   Pastille glissante
   ============================================================
   Pour toutes les rangées de choix où l'élément actif est sur
   fond encre : au lieu de s'allumer d'un coup, la pastille
   glisse jusqu'au nouveau choix.

   Utilisation :
     const p = usePastille(valeur)
     <div ref={p.ref} className="relative …">
       <Pastille pos={p.pos} />
       <button data-actif={choisi} className={`relative … ${choisi ? `${p.fond} text-fond` : …}`}>
   `p.fond` garde un fond encre tant que la pastille n'est pas
   encore placée (premier affichage), pour que le texte reste
   lisible.
   ============================================================ */

type Position = { x: number; y: number; l: number; h: number }

export function usePastille<T extends HTMLElement = HTMLDivElement>(cle: unknown) {
  // Ref « callback » : la mesure se fait aussi quand la rangée
  // apparaît plus tard (écran affiché après coup).
  const [boite, setBoite] = useState<T | null>(null)
  const ref = useCallback((el: T | null) => setBoite(el), [])
  const [pos, setPos] = useState<Position | null>(null)

  useLayoutEffect(() => {
    if (!boite) return
    function mesurer() {
      const actif = boite?.querySelector<HTMLElement>('[data-actif="true"]')
      if (!actif) return setPos(null)
      const p = { x: actif.offsetLeft, y: actif.offsetTop, l: actif.offsetWidth, h: actif.offsetHeight }
      setPos((avant) =>
        avant && avant.x === p.x && avant.y === p.y && avant.l === p.l && avant.h === p.h ? avant : p
      )
    }
    mesurer()
    const obs = new ResizeObserver(mesurer)
    obs.observe(boite)
    return () => obs.disconnect()
  }, [boite, cle])

  return { ref, pos, fond: pos ? '' : 'bg-encre' }
}

export function Pastille({
  pos,
  arrondi = 'rounded-pilule',
}: {
  pos: Position | null
  /** Même arrondi que les boutons de la rangée. */
  arrondi?: string
}) {
  // Pas d'animation pour la première pose : elle apparaît en place.
  const [anime, setAnime] = useState(false)
  const place = pos !== null
  useEffect(() => {
    if (!place) return
    const id = requestAnimationFrame(() => setAnime(true))
    return () => cancelAnimationFrame(id)
  }, [place])

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-0 left-0 bg-encre ${arrondi} ${anime ? 'pastille-glisse' : ''}`}
      style={
        pos
          ? { width: pos.l, height: pos.h, transform: `translate(${pos.x}px, ${pos.y}px)` }
          : { width: 0, height: 0, opacity: 0 }
      }
    />
  )
}
