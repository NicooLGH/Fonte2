/**
 * Écrans d'entrée (3.0).
 *
 * Les deux cercles de FONTE en haut, le formulaire dessous. La
 * hauteur du décor se réduit quand le clavier s'ouvre sur un
 * petit téléphone, pour que le formulaire reste visible.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main
      className="plein-ecran relative flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(circle at 80% 10%, rgb(255 75 43 / 0.22), transparent 50%)' }}
    >
      <svg
        viewBox="0 0 390 300"
        aria-hidden
        className="pointer-events-none absolute -top-6 left-1/2 w-[520px] max-w-none -translate-x-[30%]"
      >
        <circle cx="270" cy="120" r="140" fill="none" stroke="rgb(255 75 43 / 0.16)" strokeWidth="34" />
        <circle cx="270" cy="120" r="62" fill="none" stroke="rgb(76 201 240 / 0.12)" strokeWidth="18" />
      </svg>
      <div className="h-[18vh] min-h-[70px] max-h-[170px] shrink-0" aria-hidden />
      <div className="relative flex flex-1 items-start justify-center overflow-y-auto px-4">
        <div className="marge-basse w-full max-w-[400px] pt-1">{children}</div>
      </div>
    </main>
  )
}
