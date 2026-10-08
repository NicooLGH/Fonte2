import { cadre as trouverCadre } from '@/lib/recompenses'
import { Visage } from './Visage'

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
  // Boutique
  cuivre: '0 0 0 2.5px #d08a5a, 0 0 0 6px rgb(208 138 90 / 0.18)',
  ardoise: '0 0 0 2px #7c8aa0, 0 0 0 5px var(--color-fond), 0 0 0 6.5px #7c8aa0',
  neon: '0 0 0 2px #4cc9f0, 0 0 0 4.5px #ff5fa2, 0 0 14px rgb(76 201 240 / 0.6), 0 0 26px rgb(255 95 162 / 0.4)',
  glace: '0 0 0 2px #dff4ff, 0 0 0 5px rgb(207 239 255 / 0.25), 0 0 20px rgb(147 214 255 / 0.55)',
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
      <Visage avatar={avatar} />
    </span>
  )

  if (c === 'diamant' || c === 'legende' || c === 'flamme') {
    return (
      <span
        aria-hidden
        className={`${c === 'diamant' ? 'cadre-diamant' : c === 'legende' ? 'cadre-legende' : 'cadre-flamme'} relative inline-flex shrink-0 overflow-hidden ${className}`}
        style={{ borderRadius: rayon + 1, padding: c === 'diamant' ? 2.5 : 3 }}
      >
        {interieur(c === 'diamant' ? '#15161a' : c === 'legende' ? '#17140c' : '#1c1410')}
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
      <Visage avatar={avatar} />
    </span>
  )
}
