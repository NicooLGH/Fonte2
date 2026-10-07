import Link from 'next/link'
import { cleMois, type Bilan } from '@/lib/bilan'

/**
 * Bannière du bilan, sur l'accueil.
 *
 * Affichée la première semaine du mois, et seulement si le mois
 * écoulé contient quelque chose : proposer un bilan vide serait
 * pire que ne rien proposer. Elle reprend le dégradé sombre du
 * bilan, dans les deux modes.
 */
export function BanniereBilan({ bilan }: { bilan: Bilan }) {
  const tonnes =
    bilan.volume >= 1000
      ? `${(bilan.volume / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`
      : `${bilan.volume} kg`

  return (
    <Link
      href={`/bilan/${cleMois(bilan.mois)}`}
      className="sombre appui relative flex items-center gap-4 overflow-hidden rounded-carte p-5 text-encre"
      style={{ background: 'linear-gradient(160deg, #3a1309 0%, #1a0e0b 55%, #0e0f11 100%)' }}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-mono text-[12px] tracking-[0.08em] text-accent-clair uppercase">
          Nouveau · ton bilan
        </span>
        <span className="font-display text-[40px] leading-[0.85]">{bilan.nomCourt}</span>
        <span className="text-[14px] text-encre-douce">
          {bilan.nbSeances + bilan.nbCardio} séance{bilan.nbSeances + bilan.nbCardio > 1 ? 's' : ''}
          {bilan.volume > 0 ? ` · ${tonnes} soulevées` : ''}
        </span>
      </span>
      <span className="flex h-11 shrink-0 items-center rounded-pilule bg-accent px-4 text-[15px] font-bold text-white">
        Voir
      </span>
    </Link>
  )
}
