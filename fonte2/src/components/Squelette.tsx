/* ============================================================
   Squelettes de chargement
   ============================================================
   Next.js affiche le fichier `loading.tsx` d'une section pendant
   que sa page se prépare. C'est le mécanisme qui fonctionne dans
   tous les cas — y compris au retour arrière ou sur une
   redirection, là où le fil de progression ne se déclenchait pas.

   La forme de la page apparaît tout de suite : l'attente paraît
   plus courte quand on voit déjà où les choses vont se placer.
   ============================================================ */

function Barre({ l, h = 11 }: { l: string; h?: number }) {
  return (
    <span
      className="block animate-pulse rounded bg-verre-fort"
      style={{ width: l, height: h }}
    />
  )
}

/** En-tête de page : le grand titre. */
export function SqueletteTitre() {
  return (
    <div className="border-b border-filet pb-5">
      <Barre l="42%" h={34} />
    </div>
  )
}

/** Une liste de lignes, comme les séances ou les amis. */
export function SqueletteListe({ lignes = 4 }: { lignes?: number }) {
  return (
    <div className="divide-y divide-filet">
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-4">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-bloc bg-verre-fort" />
          <div className="flex flex-1 flex-col gap-2">
            <Barre l={`${38 - i * 3}%`} />
            <Barre l={`${62 - i * 4}%`} h={9} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Un bloc de chiffres, comme l'analyse ou le profil. */
export function SqueletteChiffres() {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Barre l="58%" h={26} />
          <Barre l="82%" h={8} />
        </div>
      ))}
    </div>
  )
}

/** Un graphique. */
export function SqueletteGraphique() {
  return (
    <div className="flex flex-col gap-4">
      <Barre l="30%" h={10} />
      <span className="block h-[180px] w-full animate-pulse rounded-bloc bg-verre-fort" />
    </div>
  )
}

/** Page complète : titre puis contenu. */
export function SqueletteePage({
  children,
}: {
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <SqueletteTitre />
      {children ?? <SqueletteListe />}
    </div>
  )
}
