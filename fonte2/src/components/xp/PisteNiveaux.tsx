import { RECOMPENSES, cadre as trouverCadre, type Recompense } from '@/lib/recompenses'
import { fondBanniere } from '@/lib/bannieres'
import { motifCss } from '@/lib/motifs'
import { Visage } from '@/components/Visage'

/* ============================================================
   Piste de niveaux
   ============================================================
   Une ligne qui défile à l'horizontale : les niveaux passés en
   orange, le mien en grand, les suivants en gris. Au-dessus,
   les amis placés à leur niveau ; en dessous, ce que chaque
   niveau débloque.
   ============================================================ */

export type AmiPiste = { id: string; pseudo: string; avatar: string | null; niveau: number }

const PAS = 62

export function PisteNiveaux({
  niveau,
  progression,
  amis = [],
}: {
  niveau: number
  /** Avancée dans le niveau en cours, de 0 à 1. */
  progression: number
  amis?: AmiPiste[]
}) {
  // Deux niveaux derrière, et assez devant pour voir la prochaine récompense.
  const prochaine = RECOMPENSES.filter((r) => r.niveau > niveau).sort((a, b) => a.niveau - b.niveau)[0]
  const debut = Math.max(0, niveau - 2)
  const fin = Math.max(niveau + 5, prochaine ? prochaine.niveau + 1 : 0)
  const niveaux = Array.from({ length: fin - debut + 1 }, (_, i) => debut + i)
  const x = (n: number) => 28 + (n - debut) * PAS
  const largeur = x(fin) + 36
  const rempli = x(niveau) + progression * PAS

  return (
    <div className="-mx-1 overflow-x-auto px-1" role="img" aria-label={`Niveau ${niveau}. Piste des niveaux ${debut} à ${fin}.`}>
      <div className="relative h-[132px]" style={{ width: largeur }}>
        {/* Ligne */}
        <div className="absolute top-[60px] right-0 left-0 h-1 rounded-pilule bg-encre/[0.08]" />
        <div className="absolute top-[60px] left-0 h-1 rounded-pilule bg-accent" style={{ width: rempli }} />

        {/* Amis à leur niveau */}
        {niveaux.map((n) => {
          const ici = amis.filter((a) => a.niveau === n)
          if (ici.length === 0) return null
          return (
            <span
              key={`a${n}`}
              className="absolute top-1.5 flex -translate-x-1/2 items-center"
              style={{ left: x(n) }}
              title={ici.map((a) => a.pseudo).join(', ')}
            >
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-verre-fort text-[15px]">
                <Visage avatar={ici[0].avatar} />
              </span>
              {ici.length > 1 && (
                <span className="-ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-pilule bg-encre px-1 font-mono text-[10px] text-fond">
                  +{ici.length - 1}
                </span>
              )}
            </span>
          )
        })}

        {/* Niveaux */}
        {niveaux.map((n) =>
          n === niveau ? (
            <span
              key={n}
              className="absolute top-[38px] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-accent bg-fond font-display text-[26px] text-accent"
              style={{ left: x(n) }}
            >
              {n}
            </span>
          ) : (
            <span
              key={n}
              className={`absolute top-[47px] flex h-[30px] w-[30px] -translate-x-1/2 items-center justify-center rounded-full font-mono text-[12px] ${
                n < niveau ? 'bg-accent text-white' : 'bg-verre-fort text-encre-douce'
              }`}
              style={{ left: x(n) }}
            >
              {n}
            </span>
          )
        )}

        {/* Récompenses */}
        {niveaux.map((n) => {
          const r = RECOMPENSES.filter((x) => x.niveau === n && n > 0)
          if (r.length === 0) return null
          return (
            <span
              key={`r${n}`}
              className="absolute top-[92px] flex w-[70px] -translate-x-1/2 flex-col items-center gap-1"
              style={{ left: x(n) }}
            >
              <Echantillon r={r[0]} />
              <span className={`max-w-full truncate text-[11px] ${n <= niveau ? 'text-encre' : 'text-encre-douce'}`}>
                {r[0].nom}
                {r.length > 1 ? ` +${r.length - 1}` : ''}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function Echantillon({ r }: { r: Recompense }) {
  if (r.type === 'cadre') {
    const c = trouverCadre(r.cle)
    return (
      <span
        aria-hidden
        className="h-[22px] w-[22px] rounded-[7px] bg-verre-fort"
        style={{ boxShadow: `0 0 0 2px ${c.couleur}` }}
      />
    )
  }
  if (r.type === 'teinte')
    return (
      <span
        aria-hidden
        className="h-[22px] w-11 rounded-[8px]"
        style={{ background: `${fondBanniere(r.cle)}, var(--color-fond)` }}
      />
    )
  return <span aria-hidden className="h-[22px] w-11 rounded-[8px] bg-verre-fort" style={motifCss(r.cle)} />
}
