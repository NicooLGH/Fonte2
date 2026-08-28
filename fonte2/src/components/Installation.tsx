'use client'

import { useEffect, useState } from 'react'

/* ============================================================
   Application installable
   ============================================================ */

type EvenementInstall = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

/** Enregistre le service worker. N'affiche rien. */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Refusé ou indisponible : l'application fonctionne
      // normalement, elle n'est simplement pas installable.
    })
  }, [])

  return null
}

/**
 * Bouton d'installation.
 *
 * Chrome et Edge fournissent un événement dédié. Safari sur
 * iPhone n'en propose aucun : il faut passer par le bouton
 * Partager, d'où le texte d'explication.
 */
export function BoutonInstallation() {
  const [invite, setInvite] = useState<EvenementInstall | null>(null)
  const [installee, setInstallee] = useState(false)

  useEffect(() => {
    setInstallee(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
    )

    const surInvite = (e: Event) => {
      e.preventDefault()
      setInvite(e as EvenementInstall)
    }
    const surInstall = () => {
      setInvite(null)
      setInstallee(true)
    }

    window.addEventListener('beforeinstallprompt', surInvite)
    window.addEventListener('appinstalled', surInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', surInvite)
      window.removeEventListener('appinstalled', surInstall)
    }
  }, [])

  if (installee)
    return (
      <span className="font-mono text-[11px] text-accent-2">
        ✓ Application installée
      </span>
    )

  if (!invite)
    return (
      <span className="font-mono text-[10.5px] leading-relaxed text-encre-douce">
        Sur iPhone : bouton Partager, puis « Sur l&apos;écran d&apos;accueil ».
        Sur Android, ton navigateur te le proposera.
      </span>
    )

  return (
    <button
      type="button"
      onClick={async () => {
        await invite.prompt()
        await invite.userChoice
        setInvite(null)
      }}
      className="w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold
                 text-white transition-colors hover:bg-accent-clair"
    >
      Installer l&apos;application
    </button>
  )
}
