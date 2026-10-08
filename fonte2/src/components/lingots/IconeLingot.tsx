/** Un lingot : la monnaie de FONTE, coulée comme la fonte. */
export function IconeLingot({ className = 'h-5 w-5', plein = 0.2 }: { className?: string; plein?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      aria-hidden className={className}>
      <path d="M3.5 17.5L7 8.5h10l3.5 9z" fill="currentColor" fillOpacity={plein} />
      <path d="M8.5 11h7" />
    </svg>
  )
}
