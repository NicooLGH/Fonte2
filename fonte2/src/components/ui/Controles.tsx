'use client'

import Link from 'next/link'

/* ============================================================
   Contrôles 3.0
   ============================================================
   Les pièces qui reviennent sur toutes les pages : onglets
   segmentés, puces de choix et interrupteur. Elles suivent les
   maquettes A2 : fond plein, élément actif en encre, textes de
   15 px minimum.
   ============================================================ */

export type Onglet = {
  cle: string
  libelle: string
  /** Un onglet avec lien navigue ; sans lien, il appelle `onChange`. */
  href?: string
}

/** Onglets segmentés : une pilule pleine, l'onglet actif en encre. */
export function Onglets({
  onglets,
  actif,
  onChange,
  etiquette,
}: {
  onglets: Onglet[]
  actif: string
  onChange?: (cle: string) => void
  /** Nom de la liste d'onglets, pour les lecteurs d'écran. */
  etiquette?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={etiquette}
      className="grid gap-1 rounded-bloc bg-verre p-1"
      style={{ gridTemplateColumns: `repeat(${onglets.length}, minmax(0, 1fr))` }}
    >
      {onglets.map((o) => {
        const choisi = o.cle === actif
        const classes = `flex h-10 items-center justify-center rounded-[11px] px-2 text-[15px] transition-colors ${
          choisi
            ? 'bg-encre font-semibold text-fond'
            : 'text-encre-douce hover:text-encre'
        }`
        return o.href ? (
          <Link
            key={o.cle}
            href={o.href}
            role="tab"
            aria-selected={choisi}
            className={classes}
          >
            {o.libelle}
          </Link>
        ) : (
          <button
            key={o.cle}
            type="button"
            role="tab"
            aria-selected={choisi}
            onClick={() => onChange?.(o.cle)}
            className={classes}
          >
            {o.libelle}
          </button>
        )
      })}
    </div>
  )
}

/** Puce de choix : arrondie, encre quand elle est choisie. */
export function Puce({
  choisie = false,
  onClick,
  children,
  disabled,
}: {
  choisie?: boolean
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={choisie}
      onClick={onClick}
      disabled={disabled}
      className={`appui inline-flex h-10 shrink-0 items-center rounded-pilule px-4 text-[15px] transition-colors disabled:opacity-40 ${
        choisie
          ? 'bg-encre font-semibold text-fond'
          : 'bg-verre text-encre-douce hover:text-encre'
      }`}
    >
      {children}
    </button>
  )
}

/** Interrupteur oui / non, vert quand il est actif. */
export function Interrupteur({
  actif,
  onChange,
  libelle,
  disabled,
}: {
  actif: boolean
  onChange: (actif: boolean) => void
  /** Texte lu par les lecteurs d'écran. */
  libelle: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className={`relative h-7 w-12 shrink-0 rounded-pilule transition-colors disabled:opacity-40 ${
        actif ? 'bg-valide' : 'bg-verre-fort'
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-[left] ${
          actif ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}
