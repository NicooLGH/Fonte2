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
      <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
        {libelle}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-bordure bg-verre px-4 py-3.5
                   text-base text-encre placeholder:text-encre-douce/50
                   transition-colors focus:border-accent focus:outline-none"
      />
      {aide && (
        <span className="mt-2 block font-mono text-[10.5px] leading-relaxed text-encre-douce">
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
    'w-full rounded-full px-6 py-3.5 font-semibold transition-colors ' +
    'disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variante === 'principal'
      ? 'bg-accent text-white hover:bg-accent-clair'
      : 'border border-bordure bg-verre text-encre-douce hover:text-encre'

  return <button {...props} className={`${base} ${styles} ${className}`} />
}

/** Message d'erreur : ce qui s'est passé, jamais d'excuse. */
export function Erreur({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3
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
      className="rounded-2xl border border-accent-2/40 bg-accent-2/10 px-4 py-3
                 font-mono text-xs leading-relaxed text-accent-2"
    >
      {children}
    </p>
  )
}
