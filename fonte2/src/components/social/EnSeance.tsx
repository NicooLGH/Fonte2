'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  SIGNES_LIVE,
  depuisLisible,
  encourager,
  rechargerAmisEnSeance,
  type AmiEnSeance,
  type SigneLive,
} from '@/lib/live-social'
import { vibrer } from '@/lib/sons'

/* ============================================================
   En séance maintenant
   ============================================================
   Affiché en haut de l'accueil, seulement quand au moins un ami
   s'entraîne. On ne montre que le fait et la durée — c'est tout
   ce que la base renvoie de toute façon.

   Un encouragement par minute et par ami : le bouton se grise
   et un décompte indique quand le suivant sera possible. La
   base applique la même règle, le décompte n'est qu'un reflet.
   ============================================================ */

const RAFRAICHIR_MS = 45 * 1000

type Etat = AmiEnSeance & {
  /** Horodatage à partir duquel on peut réagir de nouveau. */
  pretA: number
  /** Référence pour recalculer « depuis X min » sans requête. */
  recuA: number
}

function versEtat(liste: AmiEnSeance[], avant: Etat[] = []): Etat[] {
  const t = Date.now()
  return liste.map((a) => {
    const precedent = avant.find((x) => x.id === a.id)
    const pretServeur = t + a.attenteSec * 1000
    return {
      ...a,
      recuA: t,
      // On garde le délai local s'il est plus long : la réponse
      // du serveur peut précéder l'enregistrement de l'envoi.
      pretA: Math.max(pretServeur, precedent?.pretA ?? 0),
    }
  })
}

export function EnSeance({ initiaux }: { initiaux: AmiEnSeance[] }) {
  const [amis, setAmis] = useState<Etat[]>(() => versEtat(initiaux))
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const [envols, setEnvols] = useState<{ cle: number; ami: string; signe: string }[]>([])
  const [erreur, setErreur] = useState<{ ami: string; texte: string } | null>(null)

  // La liste se rafraîchit seule : un ami qui commence ou finit
  // apparaît ou disparaît sans recharger la page. En arrière-plan,
  // on ne demande rien.
  useEffect(() => {
    const rafraichir = async () => {
      if (document.hidden) return
      const liste = await rechargerAmisEnSeance()
      if (liste) setAmis((avant) => versEtat(liste, avant))
    }
    const t = setInterval(rafraichir, RAFRAICHIR_MS)
    document.addEventListener('visibilitychange', rafraichir)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', rafraichir)
    }
  }, [])

  // Le battement à la seconde ne tourne que s'il y a quelqu'un à
  // afficher : sert au décompte et à « depuis X min ».
  useEffect(() => {
    if (amis.length === 0) return
    const t = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(t)
  }, [amis.length])

  if (amis.length === 0) return null

  async function envoyer(ami: Etat, signe: SigneLive) {
    if (maintenant < ami.pretA) return
    setErreur(null)

    // Optimiste : le bouton se grise tout de suite. En cas de
    // refus, on remet l'état d'avant.
    const pretA = Date.now() + 60 * 1000
    setAmis((l) => l.map((a) => (a.id === ami.id ? { ...a, pretA } : a)))
    const cle = Date.now()
    setEnvols((e) => [...e, { cle, ami: ami.id, signe }])
    setTimeout(() => setEnvols((e) => e.filter((x) => x.cle !== cle)), 1400)
    vibrer(10)

    const r = await encourager(ami.id, signe)
    if (r.erreur) {
      setErreur({ ami: ami.id, texte: r.erreur })
      const liste = await rechargerAmisEnSeance()
      if (liste) setAmis(versEtat(liste))
    }
  }

  return (
    <section>
      <p className="section-titre mb-3 flex items-center gap-2">
        <span className="pouls-live h-1.5 w-1.5 rounded-full bg-valide" />
        En séance maintenant
      </p>

      <div className="divide-y divide-filet border-y border-filet">
        {amis.map((a) => {
          const restant = Math.ceil((a.pretA - maintenant) / 1000)
          const bloque = restant > 0
          const depuis = a.depuisSec + Math.floor((maintenant - a.recuA) / 1000)

          return (
            <div key={a.id} className="py-3.5">
              <div className="flex items-center gap-3">
                <Link
                  href={`/u/${encodeURIComponent(a.pseudo)}`}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center
                             rounded-bloc bg-verre text-lg"
                >
                  {a.avatar ?? '💪'}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full
                               border-2 border-fond bg-valide"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/u/${encodeURIComponent(a.pseudo)}`}
                    className="block truncate font-semibold"
                  >
                    {a.pseudo}
                  </Link>
                  <p className="font-mono text-[11px] text-encre-douce">
                    s&apos;entraîne {depuisLisible(depuis)}
                  </p>
                </div>
                {bloque && (
                  <span className="shrink-0 font-mono text-[11px] text-encre-douce">
                    0:{String(restant).padStart(2, '0')}
                  </span>
                )}
              </div>

              <div className="relative mt-3 grid grid-cols-5 gap-1.5">
                {SIGNES_LIVE.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={bloque}
                    onClick={() => envoyer(a, s)}
                    aria-label={`Encourager ${a.pseudo} avec ${s}`}
                    className="appui relative flex h-11 items-center justify-center
                               rounded-bloc bg-verre text-xl transition
                               hover:bg-verre-fort disabled:opacity-30"
                  >
                    {s}
                    {envols
                      .filter((e) => e.ami === a.id && e.signe === s)
                      .map((e) => (
                        <span
                          key={e.cle}
                          aria-hidden
                          className="envol-live pointer-events-none absolute inset-0
                                     flex items-center justify-center text-2xl"
                        >
                          {s}
                        </span>
                      ))}
                  </button>
                ))}
              </div>

              {erreur?.ami === a.id && (
                <p className="mt-2 font-mono text-[11px] text-accent">{erreur.texte}</p>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-2 font-mono text-[10px] text-encre-douce/70">
        Un encouragement par minute et par ami. Seul le fait de
        s&apos;entraîner est partagé, jamais le contenu de la séance.
      </p>
    </section>
  )
}
