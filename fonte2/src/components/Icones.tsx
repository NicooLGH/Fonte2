/* ============================================================
   Icônes
   ============================================================
   Des tracés plutôt que des emojis. Trois raisons : les emojis
   changent d'aspect selon le système — le gorille s'affichait en
   cheval sous Windows —, ils ne prennent pas la couleur du
   thème, et ils sont trop chargés pour une barre de navigation.

   Toutes suivent le même trait : 24×24, épaisseur 1.75,
   extrémités arrondies. `currentColor` leur fait prendre la
   couleur du texte parent.
   ============================================================ */

type Props = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Svg({ className = 'h-[22px] w-[22px]', children }: Props & { children: React.ReactNode }) {
  return (
    <svg {...base} className={className}>
      {children}
    </svg>
  )
}

export function IconeAccueil(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8" />
    </Svg>
  )
}

/** Haltère : deux disques et une barre. */
export function IconeSeances(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6" />
      <path d="M7 12h10" />
    </Svg>
  )
}

/** Balance : le relevé hebdomadaire. */
export function IconeSuivi(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 4v16" />
      <path d="M7 20h10" />
      <path d="M12 6 5 14h14L12 6z" />
    </Svg>
  )
}

export function IconeAnalyse(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Svg>
  )
}

export function IconeAmis(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6" />
      <path d="M18 14.8c2 .7 3 2.6 3 5.2" />
    </Svg>
  )
}

export function IconeProfil(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </Svg>
  )
}

export function IconePlus(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconeMenu(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  )
}

export function IconeCloche(p: Props) {
  return (
    <Svg {...p}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  )
}

export function IconeReglages(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  )
}

export function IconeLecture(p: Props) {
  return (
    <Svg {...p}>
      <path d="M7 4.5 19 12 7 19.5z" />
    </Svg>
  )
}

export function IconeCrayon(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4 16.5V20z" />
      <path d="M14.5 6.5 17.5 9.5" />
    </Svg>
  )
}

export function IconeCroix(p: Props) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  )
}

export function IconeCoche(p: Props) {
  return (
    <Svg {...p}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Svg>
  )
}
