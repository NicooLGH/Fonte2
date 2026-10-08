'use client'

import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react'

/* ============================================================
   Texte ajusté
   ============================================================
   Un texte qui tient sur une seule ligne : s'il est trop long
   pour la place disponible, la police rétrécit jusqu'à ce qu'il
   rentre. En dessous de la taille minimale, il est coupé avec
   « … » (cas rare : les pseudos font 16 caractères au plus).
   Le parent doit avoir une largeur bornée (min-w-0 en flex).
   ============================================================ */

export function TexteAjuste({
  children,
  max,
  min = 18,
  as: Balise = 'span',
  className = '',
}: {
  children: ReactNode
  /** Taille de police souhaitée, en px. */
  max: number
  /** Taille sous laquelle on ne descend pas, en px. */
  min?: number
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let largeur = -1

    function ajuster() {
      if (!el) return
      const dispo = el.clientWidth
      if (dispo === 0 || dispo === largeur) return
      largeur = dispo
      el.style.fontSize = `${max}px`
      el.style.overflow = ''
      el.style.textOverflow = ''
      const besoin = el.scrollWidth
      if (besoin <= dispo) return
      const taille = Math.floor(((max * dispo) / besoin) * 10) / 10
      el.style.fontSize = `${Math.max(min, taille)}px`
      if (taille < min) {
        el.style.overflow = 'hidden'
        el.style.textOverflow = 'ellipsis'
      }
    }

    ajuster()
    const obs = new ResizeObserver(ajuster)
    obs.observe(el)
    // La police d'affichage arrive parfois après le premier calcul.
    document.fonts?.ready.then(() => {
      largeur = -1
      ajuster()
    })
    return () => obs.disconnect()
  }, [max, min, children])

  return (
    <Balise
      ref={ref}
      className={`block max-w-full whitespace-nowrap ${className}`}
      style={{ fontSize: max }}
    >
      {children}
    </Balise>
  )
}
