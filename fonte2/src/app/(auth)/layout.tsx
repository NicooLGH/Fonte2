/**
 * Mise en page des écrans d'authentification : une carte centrée,
 * sans navigation — il n'y a rien à explorer avant d'être entré.
 *
 * Le dossier s'appelle `(auth)` avec des parenthèses : il regroupe
 * ces pages sous une mise en page commune sans apparaître dans
 * l'adresse. L'écran de connexion reste donc `/connexion`.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-[400px]">
        <h1 className="mb-8 text-center text-5xl">
          Fonte<span className="text-accent">.</span>
        </h1>
        {children}
      </div>
    </main>
  )
}
