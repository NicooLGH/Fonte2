'use client'

import { useEffect } from 'react'

/**
 * Blocage du zoom.
 *
 * `user-scalable=no` ne suffit pas : Safari sur iPhone l'ignore
 * délibérément depuis iOS 10, pour des raisons d'accessibilité.
 * La balise fonctionne sur Android, pas sur iPhone.
 *
 * Il faut donc intercepter les gestes à la main. Trois cas :
 * le pincement (gesture*, propre à Safari), le pincement à deux
 * doigts (touchmove), et le double-appui.
 *
 * On ne bloque rien dans les champs de saisie : agrandir pour
 * relire ce qu'on tape reste légitime.
 */
export function Gestes() {
  useEffect(() => {
    const dansUnChamp = (cible: EventTarget | null) =>
      cible instanceof Element &&
      cible.closest('input, textarea, select, [contenteditable="true"]') !== null

    const bloquerGeste = (e: Event) => {
      if (!dansUnChamp(e.target)) e.preventDefault()
    }

    const bloquerPincement = (e: TouchEvent) => {
      if (e.touches.length > 1 && !dansUnChamp(e.target)) e.preventDefault()
    }

    // Double-appui : deux touchers rapprochés au même endroit.
    let dernierToucher = 0
    const bloquerDoubleAppui = (e: TouchEvent) => {
      const maintenant = Date.now()
      if (maintenant - dernierToucher < 300 && !dansUnChamp(e.target)) {
        e.preventDefault()
      }
      dernierToucher = maintenant
    }

    // Safari uniquement
    document.addEventListener('gesturestart', bloquerGeste)
    document.addEventListener('gesturechange', bloquerGeste)
    document.addEventListener('gestureend', bloquerGeste)

    // `passive: false` est indispensable : sans lui le navigateur
    // ignore `preventDefault` sur ces événements.
    document.addEventListener('touchmove', bloquerPincement, { passive: false })
    document.addEventListener('touchend', bloquerDoubleAppui, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', bloquerGeste)
      document.removeEventListener('gesturechange', bloquerGeste)
      document.removeEventListener('gestureend', bloquerGeste)
      document.removeEventListener('touchmove', bloquerPincement)
      document.removeEventListener('touchend', bloquerDoubleAppui)
    }
  }, [])

  return null
}
