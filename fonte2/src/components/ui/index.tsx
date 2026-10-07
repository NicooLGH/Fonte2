import type { ComponentProps } from 'react'

/* ============================================================
   Briques d'interface partagées
   ============================================================ */

export function Champ({
  libelle,
  aide,
  ...props
}: ComponentProps<'input'> & { libelle: string; aide?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block px-1 text-[15px] font-semibold text-encre-douce">
        {libelle}
      </span>
      <input
        {...props}
        className="h-14 w-full rounded-bloc border border-transparent bg-verre px-4
                   text-[17px] text-encre placeholder:text-encre-douce/60
                   transition-colors focus:border-accent focus:outline-none"
      />
      {aide && (
        <span className="mt-2 block px-1 text-[13px] leading-relaxed text-encre-douce">
          {aide}
        </span>
      )}
    </label>
  )
}

export function Bouton({
  variante = 'principal',
  className = '',
  ...props
}: ComponentProps<'button'> & { variante?: 'principal' | 'discret' }) {
  const base =
    'appui min-h-14 w-full rounded-bloc px-6 py-3.5 text-[17px] font-bold transition-colors ' +
    'disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variante === 'principal'
      ? 'bg-accent text-white hover:bg-accent-clair'
      : 'bg-verre text-encre hover:bg-verre-fort'

  return <button {...props} className={`${base} ${styles} ${className}`} />
}

/**
 * Bloc 3.0 : fond plein, coins de 20, sans bordure.
 * `motif` ajoute les deux cercles des blocs forts.
 */
export function Bloc({
  motif,
  className = '',
  children,
  ...props
}: ComponentProps<'div'> & { motif?: 'orange' | 'bleu' }) {
  const m = motif ? `motif-cercles${motif === 'bleu' ? ' motif-cercles-bleu' : ''}` : ''
  return (
    <div {...props} className={`bloc ${m} ${className}`}>
      {children}
    </div>
  )
}

/** Message d'erreur : ce qui s'est passé, jamais d'excuse. */
export function Erreur({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="rounded-bloc border border-accent/40 bg-accent/10 px-4 py-3
                 font-mono text-xs leading-relaxed text-accent"
    >
      {children}
    </p>
  )
}

/** Confirmation, dans le bleu du carnet. */
export function Succes({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      role="status"
      className="rounded-bloc border border-accent-2/40 bg-accent-2/10 px-4 py-3
                 font-mono text-xs leading-relaxed text-accent-2"
    >
      {children}
    </p>
  )
}
