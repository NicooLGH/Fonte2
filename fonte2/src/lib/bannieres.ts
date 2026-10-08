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
  // La collection : dégradés à deux couleurs, débloqués par niveau
  | 'ocean'
  | 'glacier'
  | 'emeraude'
  | 'aurore'
  | 'crepuscule'
  | 'neon'
  | 'lave'
  | 'platine'
  | 'or'
  | 'abysses'
  | 'volcan'
  | 'eclipse'
  // Boutique (session 10)
  | 'menthe'
  | 'corail'
  | 'lilas'
  | 'sorbet'
  | 'lagon'
  | 'boreale'

export type Banniere = {
  cle: CleBanniere
  nom: string
  fond: string
  /** Niveau requis. 0 : libre. */
  niveau: number
  /** Un reflet traverse lentement la teinte. */
  anime?: boolean
  /** Couleurs « r,g,b » pour la carte de partage (canvas). */
  canvas: [string, string?]
  /** Vendue en boutique : ni libre, ni sur la piste. */
  boutique?: boolean
}

/** Teinte simple, d'origine. */
function simple(cle: CleBanniere, nom: string, rgb: string, alpha: number): Banniere {
  return {
    cle,
    nom,
    niveau: 0,
    canvas: [rgb],
    fond: `radial-gradient(ellipse 130% 100% at 50% 0%, rgb(${rgb.split(',').join(' ')} / ${alpha}), transparent 70%)`,
  }
}

/** Teinte de la collection : deux sources, une à gauche, une à droite. */
function duo(
  cle: CleBanniere,
  nom: string,
  niveau: number,
  [a, aa]: [string, number],
  [b, ab]: [string, number],
  anime = false
): Banniere {
  const rgb = (c: string, al: number) => `rgb(${c.split(',').join(' ')} / ${al})`
  return {
    cle,
    nom,
    niveau,
    anime,
    canvas: [a, b],
    fond:
      `radial-gradient(ellipse 120% 100% at 25% 0%, ${rgb(a, aa)}, transparent 70%),` +
      `radial-gradient(ellipse 100% 90% at 90% 0%, ${rgb(b, ab)}, transparent 70%)`,
  }
}

export const BANNIERES: Banniere[] = [
  simple('braise', 'Braise', '255,75,43', 0.28),
  simple('nuit', 'Nuit', '76,201,240', 0.26),
  simple('acier', 'Acier', '148,163,184', 0.22),
  simple('foret', 'Forêt', '22,163,74', 0.26),
  simple('prune', 'Prune', '162,28,175', 0.28),
  simple('sable', 'Sable', '217,119,6', 0.26),

  // ---- La collection ----
  duo('ocean', 'Océan', 5, ['14,165,233', 0.3], ['30,58,138', 0.45]),
  duo('glacier', 'Glacier', 10, ['165,243,252', 0.24], ['224,242,254', 0.18]),
  duo('emeraude', 'Émeraude', 16, ['16,185,129', 0.3], ['6,95,70', 0.5]),
  duo('aurore', 'Aurore', 20, ['255,106,61', 0.32], ['255,95,162', 0.3]),
  duo('crepuscule', 'Crépuscule', 30, ['249,115,22', 0.3], ['124,58,237', 0.38]),
  duo('neon', 'Néon', 35, ['34,211,238', 0.3], ['168,85,247', 0.38]),
  duo('lave', 'Lave', 45, ['239,68,68', 0.34], ['245,158,11', 0.3]),
  duo('abysses', 'Abysses', 50, ['13,148,136', 0.32], ['49,46,129', 0.62]),
  duo('platine', 'Platine', 55, ['226,232,240', 0.26], ['111,224,210', 0.2], true),
  {
    // Magma la nuit : rouge vif, cœur orangé, fumée violette.
    ...duo('volcan', 'Volcan', 65, ['220,38,38', 0.4], ['88,28,135', 0.48]),
    fond:
      'radial-gradient(ellipse 120% 100% at 25% 0%, rgb(220 38 38 / 0.4), transparent 70%),' +
      'radial-gradient(ellipse 100% 90% at 90% 0%, rgb(88 28 135 / 0.48), transparent 70%),' +
      'radial-gradient(ellipse 60% 40% at 55% 0%, rgb(251 146 60 / 0.22), transparent 70%)',
  },
  {
    // Un anneau de lumière dorée en haut à droite ; le reflet tourne.
    ...duo('eclipse', 'Éclipse', 75, ['255,228,160', 0.5], ['76,29,149', 0.38], true),
    fond:
      'radial-gradient(circle at 74% -14%, transparent 0 52px, rgb(255 228 160 / 0.62) 54px, rgb(255 190 110 / 0.2) 66px, transparent 128px),' +
      'radial-gradient(ellipse 120% 100% at 18% 0%, rgb(76 29 149 / 0.38), transparent 70%)',
  },
  duo('or', 'Or massif', 80, ['245,197,66', 0.34], ['180,83,9', 0.4], true),

  // ---- Boutique ----
  { ...simple('menthe', 'Menthe', '110,231,183', 0.26), boutique: true },
  { ...simple('corail', 'Corail', '255,127,110', 0.3), boutique: true },
  { ...simple('lilas', 'Lilas', '196,167,255', 0.28), boutique: true },
  { ...duo('sorbet', 'Sorbet', 0, ['255,179,138', 0.36], ['255,95,162', 0.34]), boutique: true },
  { ...duo('lagon', 'Lagon', 0, ['45,212,191', 0.34], ['14,116,144', 0.55]), boutique: true },
  {
    ...duo('boreale', 'Aurore boréale', 0, ['74,222,128', 0.36], ['168,85,247', 0.38], true),
    boutique: true,
    fond:
      'radial-gradient(ellipse 60% 100% at 15% 0%, rgb(74 222 128 / 0.36), transparent 70%),' +
      'radial-gradient(ellipse 60% 100% at 50% 0%, rgb(34 211 238 / 0.32), transparent 70%),' +
      'radial-gradient(ellipse 60% 100% at 85% 0%, rgb(168 85 247 / 0.38), transparent 70%)',
  },
]

export function banniere(cle: string | null | undefined): Banniere {
  return BANNIERES.find((b) => b.cle === cle) ?? BANNIERES[0]
}

export function fondBanniere(cle: string | null | undefined): string {
  return banniere(cle).fond
}
