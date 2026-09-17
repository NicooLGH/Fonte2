'use client'

import { useState, type ComponentProps } from 'react'

/**
 * Champ sans cadre : un filet sous le texte.
 *
 * Plus sobre qu'une boîte, mais moins évident qu'une zone est
 * cliquable. Deux contreparties, donc : le filet s'épaissit et
 * passe à l'accent au focus, et le libellé prend la même
 * couleur. Sans ce retour, on ne saurait pas où l'on écrit.
 */
export function ChampEpure({
  libelle,
  aide,
  ...props
}: ComponentProps<'input'> & { libelle: string; aide?: string }) {
  const [actif, setActif] = useState(false)

  return (
    <label className="block">
      <span
        className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em]
                    transition-colors ${actif ? 'text-accent' : 'text-encre-douce'}`}
      >
        {libelle}
      </span>
      <input
        {...props}
        onFocus={(e) => {
          setActif(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setActif(false)
          props.onBlur?.(e)
        }}
        className={`w-full border-b bg-transparent pb-2 text-[15px] text-encre
                    placeholder:text-encre-douce/40 transition-colors
                    focus:outline-none ${actif ? 'border-accent' : 'border-bordure'}`}
      />
      {aide && (
        <span className="mt-1.5 block font-mono text-[10px] leading-relaxed text-encre-douce">
          {aide}
        </span>
      )}
    </label>
  )
}
