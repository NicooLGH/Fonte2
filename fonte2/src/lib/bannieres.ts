/* ============================================================
   Bannières de profil
   ============================================================
   Une teinte qui émane du haut de l'écran et se dissout dans le
   fond. Ni bande, ni bordure : rien à raccorder, donc rien qui
   cloche — c'est le principe qu'on s'est donné pour tout le
   carnet.

   Un jeu fixe plutôt qu'une couleur libre : ces teintes sont
   assez pâles pour laisser le texte lisible par-dessus, ce
   qu'une couleur quelconque ne garantirait pas.
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
    fond:
      'radial-gradient(ellipse 130% 100% at 50% 0%, rgb(255 75 43 / 0.28), transparent 70%)',
  },
  {
    cle: 'nuit',
    nom: 'Nuit',
    fond:
      'radial-gradient(ellipse 130% 100% at 50% 0%, rgb(76 201 240 / 0.26), transparent 70%)',
  },
  {
    cle: 'acier',
    nom: 'Acier',
    fond:
      'radial-gradient(ellipse 130% 100% at 50% 0%, rgb(148 163 184 / 0.22), transparent 70%)',
  },
  {
    cle: 'foret',
    nom: 'Forêt',
    fond:
      'radial-gradient(ellipse 130% 100% at 50% 0%, rgb(22 163 74 / 0.26), transparent 70%)',
  },
  {
    cle: 'prune',
    nom: 'Prune',
    fond:
      'radial-gradient(ellipse 130% 100% at 50% 0%, rgb(162 28 175 / 0.28), transparent 70%)',
  },
  {
    cle: 'sable',
    nom: 'Sable',
    fond:
      'radial-gradient(ellipse 130% 100% at 50% 0%, rgb(217 119 6 / 0.26), transparent 70%)',
  },
]

export function fondBanniere(cle: string | null | undefined): string {
  return (
    BANNIERES.find((b) => b.cle === cle)?.fond ?? BANNIERES[0].fond
  )
}
