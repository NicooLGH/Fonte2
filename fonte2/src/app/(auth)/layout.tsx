import { IllustrationSalle } from '@/components/IllustrationSalle'

/**
 * Écrans d'authentification.
 *
 * L'illustration occupe le haut, le formulaire le bas, sans
 * cadre autour. Pas de titre « Connexion » : sur un écran qui ne
 * fait que ça, l'annoncer est redondant.
 *
 * L'illustration se réduit quand la hauteur manque — clavier
 * ouvert sur petit téléphone. Sinon le formulaire sortirait de
 * l'écran.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="plein-ecran flex flex-col">
      <div
        aria-hidden
        className="relative shrink-0 overflow-hidden
                   h-[26vh] min-h-[130px] max-h-[230px]
                   sm:h-[32vh]"
      >
        <IllustrationSalle className="h-full w-full object-cover" />
        {/* Le fondu masque la jonction entre l'illustration et
            le fond, quelle que soit la hauteur retenue. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 45%, var(--color-fond) 100%)',
          }}
        />
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-6">
        <div className="marge-basse w-full max-w-[380px] pt-1">{children}</div>
      </div>
    </main>
  )
}
