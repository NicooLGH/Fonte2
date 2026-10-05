import { cadre as trouverCadre } from '@/lib/recompenses'

/* ============================================================
   Avatar avec son cadre
   ============================================================
   Bronze, argent, or, platine : un contour et une lueur.
   Diamant : un dégradé avec un reflet qui passe. Légende : un
   anneau doré qui tourne. Les deux derniers s'arrêtent si le
   téléphone demande des animations réduites (règle globale).
   ============================================================ */

const OMBRES: Record<string, string> = {
  bronze: '0 0 0 2px #c98a5b',
  argent: '0 0 0 2px #c4ccd6, 0 0 0 5px rgb(196 204 214 / 0.22)',
  or: '0 0 0 2px #f0c04a, 0 0 18px rgb(240 192 74 / 0.45)',
  platine: '0 0 0 2px #6fe0d2, 0 0 0 5px var(--color-fond), 0 0 0 6.5px #6fe0d2, 0 0 18px rgb(111 224 210 / 0.35)',
}

export function AvatarCadre({
  avatar,
  cadre,
  taille = 64,
  className = '',
}: {
  avatar: string
  cadre?: string | null
  /** Côté en pixels. */
  taille?: number
  className?: string
}) {
  const c = trouverCadre(cadre).cle
  const rayon = Math.round(taille * 0.24)
  const police = Math.round(taille * 0.48)

  const interieur = (fond: string) => (
    <span
      className="relative z-[1] flex items-center justify-center"
      style={{
        width: taille,
        height: taille,
        borderRadius: rayon - 2,
        background: fond,
        fontSize: police,
      }}
    >
      {avatar}
    </span>
  )

  if (c === 'diamant' || c === 'legende') {
    return (
      <span
        aria-hidden
        className={`${c === 'diamant' ? 'cadre-diamant' : 'cadre-legende'} relative inline-flex shrink-0 overflow-hidden ${className}`}
        style={{ borderRadius: rayon + 1, padding: c === 'diamant' ? 2.5 : 3 }}
      >
        {interieur(c === 'diamant' ? '#15161a' : '#17140c')}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center bg-verre ${
        c === 'aucun' ? 'border border-bordure' : ''
      } ${className}`}
      style={{
        width: taille,
        height: taille,
        borderRadius: rayon,
        fontSize: police,
        boxShadow: OMBRES[c],
        background: c === 'or' ? 'rgb(240 192 74 / 0.08)' : undefined,
      }}
    >
      {avatar}
    </span>
  )
}
