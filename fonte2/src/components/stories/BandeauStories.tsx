import Link from 'next/link'
import type { GroupeStories } from '@/lib/stories'

/**
 * Stories, en haut de l'accueil : vignettes rectangulaires.
 * La première est la mienne (ou « + » pour en publier une).
 * Un contour en dégradé signale des stories pas encore vues.
 */
export function BandeauStories({ groupes }: { groupes: GroupeStories[] }) {
  const mienne = groupes.find((g) => g.moi)
  const amis = groupes.filter((g) => !g.moi)

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:-mx-6 md:px-6" aria-label="Stories">
      {mienne ? (
        <Vignette groupe={mienne} libelle="Toi" />
      ) : (
        <Link
          href="/story/nouvelle"
          aria-label="Publier une story"
          className="appui flex h-[100px] w-[72px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[16px]
                     border-[1.5px] border-dashed border-encre/25 text-encre-douce"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[12px]">Toi</span>
        </Link>
      )}
      {amis.map((g) => (
        <Vignette key={g.userId} groupe={g} libelle={g.pseudo} />
      ))}
    </div>
  )
}

function Vignette({ groupe, libelle }: { groupe: GroupeStories; libelle: string }) {
  const s = groupe.stories.find((x) => !x.vue) ?? groupe.stories[groupe.stories.length - 1]
  const neuf = groupe.aVoir && !groupe.moi

  return (
    <Link
      href={`/story?u=${groupe.userId}`}
      aria-label={groupe.moi ? 'Voir ma story' : `Story de ${groupe.pseudo}${neuf ? ', pas encore vue' : ''}`}
      className="appui h-[100px] w-[72px] shrink-0 rounded-[16px] p-[2px]"
      style={{
        background: neuf || groupe.moi
          ? 'linear-gradient(160deg, #ff4b2b, #ff8a63 50%, #4cc9f0)'
          : 'var(--color-verre-fort)',
      }}
    >
      <span
        className="relative flex h-full w-full items-end overflow-hidden rounded-[14px] border-2 border-fond bg-verre bg-cover bg-center p-[7px]"
        style={s?.url ? { backgroundImage: `url("${s.url}")` } : undefined}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className={`relative truncate text-[12px] font-semibold ${neuf || groupe.moi ? 'text-white' : 'text-white/80'}`}>
          {libelle}
        </span>
      </span>
    </Link>
  )
}
