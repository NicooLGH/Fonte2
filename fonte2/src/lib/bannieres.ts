/* ============================================================
   Bannières de profil
   ============================================================
   Un jeu fixe plutôt qu'une couleur libre. Les dégradés sont
   dessinés pour rester lisibles avec le texte clair par-dessus,
   ce qu'une couleur quelconque ne garantit pas : un fond jaune
   vif rendrait le pseudo illisible.
   ============================================================ */

export type CleBanniere =
  | 'braise'
  | 'nuit'
  | 'acier'
  | 'foret'
  | 'prune'
  | 'sable'

export const BANNIERES: { cle: CleBanniere; nom: string; fond: string }[] = [
  {
    cle: 'braise',
    nom: 'Braise',
    fond: 'radial-gradient(circle at 18% 12%, #ff4b2b55, transparent 62%), radial-gradient(circle at 88% 80%, #4cc9f033, transparent 58%), #16171a',
  },
  {
    cle: 'nuit',
    nom: 'Nuit',
    fond: 'radial-gradient(circle at 80% 15%, #4cc9f044, transparent 60%), radial-gradient(circle at 15% 85%, #7c3aed33, transparent 58%), #111318',
  },
  {
    cle: 'acier',
    nom: 'Acier',
    fond: 'linear-gradient(130deg, #2a2d33 0%, #16181c 55%, #1f2228 100%)',
  },
  {
    cle: 'foret',
    nom: 'Forêt',
    fond: 'radial-gradient(circle at 25% 20%, #16a34a44, transparent 60%), radial-gradient(circle at 85% 75%, #0f766e33, transparent 55%), #12181a',
  },
  {
    cle: 'prune',
    nom: 'Prune',
    fond: 'radial-gradient(circle at 20% 80%, #a21caf3d, transparent 58%), radial-gradient(circle at 78% 18%, #ff4b2b2e, transparent 55%), #16121a',
  },
  {
    cle: 'sable',
    nom: 'Sable',
    fond: 'radial-gradient(circle at 22% 18%, #d9770633, transparent 60%), radial-gradient(circle at 82% 82%, #78350f2e, transparent 55%), #1a1714',
  },
]

export function fondBanniere(cle: string | null | undefined): string {
  return (
    BANNIERES.find((b) => b.cle === cle)?.fond ?? BANNIERES[0].fond
  )
}
