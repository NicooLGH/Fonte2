/* ============================================================
   Illustration de la page de connexion
   ============================================================
   Une personne de dos, assise sur un banc, regardant son
   téléphone. Derrière, la rangée d'haltères et le grand miroir.

   Deux partis pris :

   Les couleurs sont écrites en dur, pas prises dans le thème.
   Une scène physique ne doit pas s'inverser en mode clair — un
   miroir de salle ne devient pas blanc parce qu'on change de
   réglage.

   L'écran du téléphone est le seul point lumineux. Une
   illustration colorée entrerait en concurrence avec le
   formulaire, alors qu'elle doit l'accompagner.
   ============================================================ */

export function IllustrationSalle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 190"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Une personne assise sur un banc de musculation, vue de dos, regardant son téléphone face à un miroir"
    >
      <rect x="0" y="0" width="340" height="190" fill="#121316" />
      <rect x="0" y="0" width="340" height="190" fill="#2a1410" opacity="0.5" />

      {/* Le miroir, avec un reflet oblique */}
      <rect
        x="196"
        y="18"
        width="126"
        height="132"
        fill="#191b1f"
        stroke="#2e3136"
        strokeWidth="1"
      />
      <rect x="202" y="24" width="114" height="120" fill="#1e2126" />
      <path d="M202 144 L250 24 L268 24 L216 144 Z" fill="#26292f" opacity="0.7" />

      {/* Le reflet de la personne, à peine suggéré */}
      <path d="M244 96 L244 76 Q252 70 258 76 L258 96 Z" fill="#232529" />
      <circle cx="251" cy="68" r="6" fill="#232529" />
      <rect x="248" y="86" width="6" height="4" rx="1" fill="#ff4b2b" opacity="0.45" />

      <line x1="0" y1="150" x2="340" y2="150" stroke="#2e3136" strokeWidth="1" />
      <rect x="0" y="150" width="340" height="40" fill="#0f1013" />

      {/* Le râtelier */}
      <rect x="14" y="104" width="104" height="5" rx="2" fill="#24272c" />
      <rect x="14" y="128" width="104" height="5" rx="2" fill="#24272c" />
      <rect x="16" y="106" width="4" height="44" fill="#24272c" />
      <rect x="112" y="106" width="4" height="44" fill="#24272c" />

      <g fill="#31353b">
        <circle cx="30" cy="99" r="7" />
        <circle cx="44" cy="99" r="7" />
        <rect x="30" y="97" width="14" height="4" />
        <circle cx="66" cy="99" r="8" />
        <circle cx="82" cy="99" r="8" />
        <rect x="66" y="97" width="16" height="4" />
        <circle cx="102" cy="99" r="6" />
      </g>
      <g fill="#2b2e34">
        <circle cx="32" cy="123" r="8" />
        <circle cx="48" cy="123" r="8" />
        <rect x="32" y="121" width="16" height="4" />
        <circle cx="74" cy="123" r="9" />
        <circle cx="92" cy="123" r="9" />
        <rect x="74" y="121" width="18" height="4" />
      </g>

      {/* Le banc */}
      <rect x="130" y="138" width="76" height="7" rx="3" fill="#2f3339" />
      <rect x="140" y="145" width="5" height="18" fill="#272a30" />
      <rect x="192" y="145" width="5" height="18" fill="#272a30" />

      {/* La personne, de dos */}
      <path d="M152 138 Q150 112 158 100 L180 100 Q188 112 186 138 Z" fill="#1a1c20" />
      <circle cx="169" cy="90" r="11" fill="#1a1c20" />
      <path d="M158 102 Q150 114 154 126 L160 126 Q158 114 163 106 Z" fill="#1a1c20" />
      <path d="M180 102 Q188 114 184 126 L178 126 Q180 114 175 106 Z" fill="#1a1c20" />

      {/* L'écran du téléphone : la seule lumière de la scène */}
      <rect x="161" y="120" width="16" height="10" rx="2" fill="#4cc9f0" opacity="0.28" />
      <rect x="163" y="122" width="12" height="6" rx="1" fill="#4cc9f0" opacity="0.5" />

      <ellipse cx="169" cy="152" rx="42" ry="4" fill="#0a0b0d" opacity="0.6" />
    </svg>
  )
}
