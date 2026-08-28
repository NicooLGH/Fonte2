'use client'

import { useEffect } from 'react'
import { signalerPresence } from '@/app/(carnet)/amis/actions'

/**
 * Signale la présence, sans rien afficher.
 *
 * Deux précautions : on ne signale que si l'onglet est visible —
 * une page laissée ouverte en arrière-plan ne doit pas faire
 * passer pour connecté — et l'intervalle est de trois minutes,
 * ce qui suffit pour un statut « en ligne » à cinq minutes près.
 */
export function Presence() {
  useEffect(() => {
    const signaler = () => {
      if (!document.hidden) void signalerPresence()
    }

    signaler()
    const minuteur = setInterval(signaler, 3 * 60 * 1000)
    document.addEventListener('visibilitychange', signaler)

    return () => {
      clearInterval(minuteur)
      document.removeEventListener('visibilitychange', signaler)
    }
  }, [])

  return null
}
