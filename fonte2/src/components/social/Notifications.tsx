'use client'

import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { dateRelative } from '@/lib/social'
import { IconeCloche } from '@/components/Icones'
import type { Notification } from '@/lib/notifs'
import { marquerNotifsLues } from '@/app/(carnet)/reglages/notifs'

/**
 * Cloche et centre de notifications.
 *
 * Les notifications sont créées en base par déclencheur : elles
 * partent même si l'expéditeur ferme son onglet aussitôt après
 * avoir réagi.
 */
export function Notifications({ notifications }: { notifications: Notification[] }) {
  const [ouvert, setOuvert] = useState(false)
  const [lues, setLues] = useState(false)
  const [, demarrer] = useTransition()

  const nonLues = lues ? 0 : notifications.filter((n) => !n.lue).length

  function ouvrir() {
    setOuvert(true)
    if (nonLues > 0) {
      setLues(true)
      demarrer(async () => {
        await marquerNotifsLues()
      })
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        aria-label={
          nonLues > 0 ? `Notifications, ${nonLues} non lues` : 'Notifications'
        }
        className="relative flex h-9 w-9 shrink-0 items-center justify-center
                   rounded-bloc bg-verre text-encre-douce transition-colors
                   hover:bg-verre-fort hover:text-encre"
      >
        <IconeCloche className="h-[18px] w-[18px]" />

        {nonLues > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center
                       justify-center rounded-full bg-accent px-1 font-mono
                       text-[9px] text-white"
          >
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      <Modale
        titre="Notifications"
        ouverte={ouvert}
        onFermer={() => setOuvert(false)}
      >
        {notifications.length === 0 ? (
          <p className="text-sm italic text-encre-douce">Aucune notification.</p>
        ) : (
          <ul className="divide-y divide-filet">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`py-3.5 ${
                  !n.lue && !lues ? 'border-l-2 border-accent pl-3' : ''
                }`}
              >
                <p className="text-sm font-semibold">{n.titre}</p>
                {n.corps && (
                  <p className="mt-1 text-[13px] leading-relaxed text-encre-douce">
                    {n.corps}
                  </p>
                )}
                <p className="mt-1.5 font-mono text-[10.5px] text-encre-douce opacity-70">
                  {dateRelative(n.date)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Modale>
    </>
  )
}
