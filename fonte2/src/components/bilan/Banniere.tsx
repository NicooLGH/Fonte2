import Link from 'next/link'
import { cleMois, nomMois, type Bilan } from '@/lib/bilan'

/**
 * Bannière du bilan, en tête de l'accueil.
 *
 * Affichée la première semaine du mois, et seulement si le mois
 * écoulé contient quelque chose : proposer un bilan vide serait
 * pire que ne rien proposer.
 */
export function BanniereBilan({ bilan }: { bilan: Bilan }) {
  return (
    <Link
      href={`/bilan/${cleMois(bilan.mois)}`}
      className="block rounded-carte border border-accent/40 p-6 transition-colors
                 hover:border-accent"
      style={{
        background:
          'radial-gradient(circle at 85% 15%, rgb(76 201 240 / 0.18), transparent 55%),' +
          'radial-gradient(circle at 10% 90%, rgb(255 75 43 / 0.22), transparent 55%),' +
          'var(--color-verre)',
      }}
    >
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent-2">
        Nouveau
      </p>
      <p className="mt-2 font-display text-3xl uppercase leading-none sm:text-4xl">
        Ton bilan de
        <br />
        {nomMois(bilan.mois)}
      </p>
      <p className="mt-3 font-mono text-xs text-encre-douce">
        {bilan.nbSeances} séance{bilan.nbSeances > 1 ? 's' : ''} ·{' '}
        {bilan.volume.toLocaleString('fr-FR')} kg soulevés
      </p>
      <span className="mt-4 inline-block text-sm font-semibold text-accent">
        Découvrir →
      </span>
    </Link>
  )
}
