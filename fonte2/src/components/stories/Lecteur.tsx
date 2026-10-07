'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { dateRelative } from '@/lib/social'
import { SIGNES_STORY, type GroupeStories } from '@/lib/stories'
import { AvatarCadre } from '@/components/AvatarCadre'
import { EtiquetteStory } from './EtiquetteStory'
import {
  masquerStory,
  reagirStory,
  signalerStory,
  supprimerStory,
  voirStory,
} from '@/app/story/actions'

/* ============================================================
   Lecteur de stories
   ============================================================
   Plein écran, toujours sombre. Toucher à droite avance, à
   gauche revient ; appuyer longuement met en pause. Une story
   dure six secondes, puis on passe à la suivante, puis à l'ami
   suivant.
   ============================================================ */

const DUREE_MS = 6000

const MOTIFS = [
  { cle: 'inapproprie', nom: 'Contenu inapproprié' },
  { cle: 'harcelement', nom: 'Harcèlement ou moquerie' },
  { cle: 'spam', nom: 'Spam' },
  { cle: 'autre', nom: 'Autre chose' },
]

export function Lecteur({ groupes, depart }: { groupes: GroupeStories[]; depart: number }) {
  const router = useRouter()
  const [g, setG] = useState(depart)
  const [i, setI] = useState(() => {
    // On reprend à la première story pas encore vue.
    const k = groupes[depart]?.stories.findIndex((s) => !s.vue) ?? -1
    return k >= 0 ? k : 0
  })
  const [pause, setPause] = useState(false)
  const [menu, setMenu] = useState<'ferme' | 'options' | 'signaler'>('ferme')
  const [reactions, setReactions] = useState<Record<string, string | null>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [, demarrer] = useTransition()
  const [avance, setAvance] = useState(0)
  const debut = useRef(Date.now())
  const ecoule = useRef(0)

  const groupe = groupes[g]
  const story = groupe?.stories[i]

  const fermer = useCallback(() => {
    router.push('/')
    router.refresh()
  }, [router])

  const suivante = useCallback(() => {
    if (!groupe) return
    if (i < groupe.stories.length - 1) setI(i + 1)
    else if (g < groupes.length - 1) {
      setG(g + 1)
      setI(0)
    } else fermer()
  }, [g, i, groupe, groupes.length, fermer])

  const precedente = useCallback(() => {
    if (i > 0) setI(i - 1)
    else if (g > 0) {
      setG(g - 1)
      setI(groupes[g - 1].stories.length - 1)
    }
  }, [g, i, groupes])

  // Nouvelle story : chrono remis à zéro, vue signalée à la base.
  useEffect(() => {
    debut.current = Date.now()
    ecoule.current = 0
    setAvance(0)
    setMessage(null)
    if (story && !groupe.moi) void voirStory(story.id)
  }, [story, groupe])

  // Le temps ne file que si rien n'est ouvert et qu'on n'appuie pas.
  const arrete = pause || menu !== 'ferme'
  useEffect(() => {
    if (arrete) {
      ecoule.current += Date.now() - debut.current
      return
    }
    debut.current = Date.now()
    const t = setInterval(() => {
      const total = ecoule.current + Date.now() - debut.current
      setAvance(Math.min(1, total / DUREE_MS))
      if (total >= DUREE_MS) suivante()
    }, 50)
    return () => clearInterval(t)
  }, [arrete, suivante])

  // Échap ferme, flèches naviguent.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer()
      if (e.key === 'ArrowRight') suivante()
      if (e.key === 'ArrowLeft') precedente()
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [fermer, suivante, precedente])

  if (!groupe || !story) {
    return (
      <main className="sombre flex min-h-dvh flex-col items-center justify-center gap-4 bg-fond px-6 text-center">
        <p className="font-display text-[40px] leading-none">Plus de story</p>
        <p className="text-[15px] text-encre-douce">Les stories restent en ligne 24 heures.</p>
        <button type="button" onClick={fermer} className="mt-2 h-12 rounded-pilule bg-accent px-6 text-[16px] font-bold text-white">
          Retour
        </button>
      </main>
    )
  }

  const maReaction = story.id in reactions ? reactions[story.id] : story.maReaction

  function reagir(signe: string) {
    const nouveau = maReaction === signe ? null : signe
    setReactions((r) => ({ ...r, [story!.id]: nouveau }))
    demarrer(async () => {
      const r = await reagirStory(story!.id, nouveau)
      if (r.erreur) setMessage(r.erreur)
    })
  }

  function agir(action: () => Promise<{ erreur?: string; succes?: string }>, passer = true) {
    setMenu('ferme')
    demarrer(async () => {
      const r = await action()
      if (r.erreur) setMessage(r.erreur)
      else if (passer) suivante()
    })
  }

  return (
    <main
      className="sombre fixed inset-0 overflow-hidden bg-black text-encre select-none"
      onPointerDown={() => setPause(true)}
      onPointerUp={() => setPause(false)}
      onPointerCancel={() => setPause(false)}
    >
      {/* La photo */}
      {story.url ? (
        // Lien signé et temporaire : pas d'optimiseur d'images.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={story.id}
          src={story.url}
          alt={`Story de ${groupe.moi ? 'toi' : groupe.pseudo}`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-verre text-encre-douce">
          Photo indisponible
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Zones de navigation */}
      <button type="button" aria-label="Story précédente" onClick={precedente} className="absolute inset-y-0 left-0 z-10 w-1/3" />
      <button type="button" aria-label="Story suivante" onClick={suivante} className="absolute inset-y-0 right-0 z-10 w-2/3" />

      {/* Haut */}
      <div className="securise-haut absolute inset-x-0 top-0 z-20 px-3 pt-2">
        <div className="flex gap-1">
          {groupe.stories.map((s, k) => (
            <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                className="block h-full bg-white"
                style={{ width: `${k < i ? 100 : k === i ? avance * 100 : 0}%` }}
              />
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <AvatarCadre avatar={groupe.avatar ?? '💪'} cadre={groupe.cadre} taille={36} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-semibold">{groupe.moi ? 'Ta story' : groupe.pseudo}</span>
            <span className="text-[12px] text-white/70">{dateRelative(story.cree)}</span>
          </span>
          <button
            type="button"
            onClick={() => setMenu('options')}
            aria-label={groupe.moi ? 'Options de ta story' : 'Signaler ou masquer'}
            className="flex h-11 w-11 items-center justify-center rounded-full"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
          <button type="button" onClick={fermer} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Étiquette */}
      <div
        className="pointer-events-none absolute inset-x-4 z-[5] flex justify-center"
        style={{ top: `${story.position * 100}%`, transform: 'translateY(-50%)' }}
      >
        <EtiquetteStory etiquette={story.etiquette} />
      </div>

      {/* Bas */}
      <div className="securise absolute inset-x-0 bottom-0 z-20 px-4 pb-5">
        {message && (
          <p className="mb-3 rounded-2xl bg-black/60 px-4 py-2.5 text-center text-[14px]">{message}</p>
        )}
        {groupe.moi ? (
          <div className="flex items-center justify-between gap-3 rounded-full bg-black/45 px-5 py-3 text-[15px] backdrop-blur-md">
            <span>
              {story.nbVues ?? 0} vue{(story.nbVues ?? 0) > 1 ? 's' : ''}
            </span>
            <span className="flex gap-2">
              {Object.entries(story.reactions ?? {}).map(([s, n]) => (
                <span key={s}>
                  {s} {n}
                </span>
              ))}
            </span>
          </div>
        ) : (
          <div className="flex justify-center gap-2.5">
            {SIGNES_STORY.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => reagir(s)}
                aria-pressed={maReaction === s}
                aria-label={`Réagir ${s}`}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-[26px] backdrop-blur-md transition-transform active:scale-90 ${
                  maReaction === s ? 'bg-[#ff4b2b]/70 ring-2 ring-white' : 'bg-black/45'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      {menu !== 'ferme' && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/55" onClick={() => setMenu('ferme')}>
          <div
            className="securise w-full rounded-t-[24px] bg-verre px-4 pt-3 pb-6"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="mx-auto mb-3 block h-[5px] w-10 rounded-full bg-white/20" />
            {menu === 'options' &&
              (groupe.moi ? (
                <Option
                  danger
                  onClick={() => {
                    if (confirm('Supprimer ta story ?')) agir(() => supprimerStory(story.id))
                  }}
                >
                  Supprimer ma story
                </Option>
              ) : (
                <>
                  <Option onClick={() => agir(() => masquerStory(story.id))}>Masquer cette story</Option>
                  <Option danger onClick={() => setMenu('signaler')}>
                    Signaler…
                  </Option>
                </>
              ))}
            {menu === 'signaler' && (
              <>
                <p className="px-1 pb-2 text-[15px] text-encre-douce">
                  Pourquoi ? La story est masquée pour toi tout de suite. Après trois signalements,
                  elle est retirée pour tout le monde.
                </p>
                {MOTIFS.map((m) => (
                  <Option key={m.cle} onClick={() => agir(() => signalerStory(story.id, m.cle))}>
                    {m.nom}
                  </Option>
                ))}
              </>
            )}
            <Option onClick={() => setMenu('ferme')}>Annuler</Option>
          </div>
        </div>
      )}
    </main>
  )
}

function Option({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 w-full items-center rounded-bloc px-3 text-left text-[17px] font-semibold hover:bg-verre-fort ${
        danger ? 'text-accent' : ''
      }`}
    >
      {children}
    </button>
  )
}
