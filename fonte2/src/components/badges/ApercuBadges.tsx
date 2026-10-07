import Link from 'next/link'
import { Badge } from './Badge'
import { BADGES, TOTAL_PALIERS, obtenus, type EtatBadge } from '@/lib/badges'

/**
 * Aperçu des badges sur mon profil : les cinq plus récents
 * obtenus, et un lien vers la page complète.
 */
export function ApercuBadges({ etats }: { etats: EtatBadge[] }) {
  const parId = new Map(etats.map((e) => [e.id, e]))
  const total = etats.reduce((t, e) => t + obtenus(e), 0)
  const recents = BADGES.map((b) => {
    const e = parId.get(b.id)
    const n = obtenus(e)
    return { b, n, date: n > 0 ? (e?.dates[n - 1] ?? '') : '' }
  })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <Link href="/badges" className="bloc appui relative flex flex-col gap-3 px-4 pt-3.5 pb-4">
      <span className="flex items-baseline justify-between">
        <span className="text-[16px] font-semibold">Badges</span>
        <span className="font-mono text-[13px] text-encre-douce">
          {total} / {TOTAL_PALIERS} ›
        </span>
      </span>
      {recents.length === 0 ? (
        <span className="text-[15px] text-encre-douce">
          Ton premier badge arrive avec ta première séance.
        </span>
      ) : (
        <span className="grid grid-cols-5 gap-2">
          {recents.map(({ b, n }) => (
            <span key={b.id} className="flex items-center justify-center">
              <Badge def={b} palier={n - 1} taille={52} />
            </span>
          ))}
        </span>
      )}
    </Link>
  )
}
