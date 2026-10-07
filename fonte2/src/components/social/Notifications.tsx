'use client'

import Link from 'next/link'
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
        className="relative flex h-11 w-11 shrink-0 items-center justify-center
                   rounded-bloc text-encre transition-colors hover:bg-verre"
      >
        <IconeCloche className="h-[22px] w-[22px]" />

        {nonLues > 0 && (
          <span
            aria-hidden
            className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full border-2 border-fond bg-accent"
          />
        )}
      </button>

      <Modale titre="Notifications" ouverte={ouvert} onFermer={() => setOuvert(false)}>
        {notifications.length === 0 ? (
          <p className="text-[15px] text-encre-douce">Rien de neuf pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col">
            {groupes(notifications).map((g) => (
              <section key={g.titre} className="flex flex-col">
                <p className="px-0.5 pt-3 pb-1 text-[15px] font-bold text-encre-douce">{g.titre}</p>
                {g.liste.map((n) => {
                  const nouvelle = !n.lue && !lues
                  const lien = lienDe(n.type)
                  const contenu = (
                    <>
                      <Icone type={n.type} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={`text-[16px] ${nouvelle ? 'font-semibold' : 'text-encre/85'}`}>
                          {n.titre}
                        </span>
                        {n.corps && (
                          <span className="text-[14px] leading-snug text-encre-douce">{n.corps}</span>
                        )}
                        <span className="text-[12px] text-encre-douce/80">{dateRelative(n.date)}</span>
                      </span>
                      {nouvelle && <span aria-label="Non lue" className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </>
                  )
                  return lien ? (
                    <Link
                      key={n.id}
                      href={lien}
                      onClick={() => setOuvert(false)}
                      className="flex min-h-16 items-center gap-3 px-0.5 py-2"
                    >
                      {contenu}
                    </Link>
                  ) : (
                    <div key={n.id} className="flex min-h-16 items-center gap-3 px-0.5 py-2">
                      {contenu}
                    </div>
                  )
                })}
              </section>
            ))}
          </div>
        )}
      </Modale>
    </>
  )
}

/* ---- Pièces ---- */

function groupes(liste: Notification[]) {
  const debutJour = new Date()
  debutJour.setHours(0, 0, 0, 0)
  const debutSemaine = new Date(debutJour.getTime() - 6 * 86400000)
  const g: { titre: string; liste: Notification[] }[] = [
    { titre: "Aujourd'hui", liste: [] },
    { titre: 'Cette semaine', liste: [] },
    { titre: 'Plus tôt', liste: [] },
  ]
  for (const n of liste) {
    const d = new Date(n.date)
    g[d >= debutJour ? 0 : d >= debutSemaine ? 1 : 2].liste.push(n)
  }
  return g.filter((x) => x.liste.length > 0)
}

function lienDe(type: string): string | null {
  if (type === 'ami_demande') return '/amis?onglet=amis'
  if (type === 'ami_accepte' || type === 'reaction' || type === 'encouragement') return '/amis'
  if (type === 'reaction_story') return '/'
  return null
}

function Icone({ type }: { type: string }) {
  const style =
    type === 'reaction' || type === 'reaction_story' || type === 'encouragement'
      ? 'bg-accent/15 text-accent-clair'
      : type.startsWith('ami')
        ? 'bg-accent-2/15 text-accent-2'
        : 'bg-verre text-encre'
  return (
    <span className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] ${style}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {type === 'reaction' || type === 'reaction_story' || type === 'encouragement' ? (
          <path d="M12 22c4 0 7-2.7 7-6.8 0-3.2-2-5.6-3.6-7.3-.4 1.9-1.4 3.1-2.6 3.6.3-3.4-1.3-6.6-4.3-8.5.2 3.1-1.5 5-3 6.8C4.3 11.3 5 13.6 5 15.2 5 19.3 8 22 12 22z" />
        ) : type.startsWith('ami') ? (
          <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
          </>
        ) : (
          <>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
          </>
        )}
      </svg>
    </span>
  )
}
