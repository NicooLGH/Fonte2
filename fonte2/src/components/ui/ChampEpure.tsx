'use client'

import { useState, type ComponentProps } from 'react'

/**
 * Champ des écrans d'entrée (3.0) : fond plein, libellé au-dessus,
 * texte en 17 px. Un mot de passe peut s'afficher en clair.
 */
export function ChampEpure({
  libelle,
  aide,
  type,
  ...props
}: ComponentProps<'input'> & { libelle: string; aide?: string }) {
  const [visible, setVisible] = useState(false)
  const motDePasse = type === 'password'

  return (
    <label className="block">
      <span className="mb-2 block px-0.5 text-[15px] font-semibold text-encre-douce">{libelle}</span>
      <span className="flex h-14 items-center rounded-bloc border-2 border-transparent bg-verre focus-within:border-accent">
        <input
          {...props}
          type={motDePasse && visible ? 'text' : type}
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-[17px] text-encre
                     placeholder:text-encre-douce/50 focus:outline-none"
        />
        {motDePasse && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
            className="flex h-full w-12 shrink-0 items-center justify-center text-encre-douce hover:text-encre"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {visible ? (
                <>
                  <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
                </>
              ) : (
                <>
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </span>
      {aide && <span className="mt-1.5 block px-0.5 text-[13px] leading-snug text-encre-douce">{aide}</span>}
    </label>
  )
}
