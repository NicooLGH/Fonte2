import { BANNIERES } from './bannieres'
import { MOTIFS } from './motifs'
import { montantPalier } from './lingots'

/* ============================================================
   Récompenses de niveau
   ============================================================
   Teintes, motifs et cadres : ce qui est libre, et ce qui se
   débloque avec le niveau. La base vérifie la même chose au
   moment d'enregistrer (fonction `recompense_niveau`, fichier
   fonte-recompenses.sql) : garder les deux listes identiques.

   Chaque récompense a une origine. Aujourd'hui « libre » ou
   « niveau » ; demain « abonnement », pour la version payante,
   sans rien changer au reste.
   ============================================================ */

export type Origine = 'libre' | 'niveau' | 'abonnement'
export type TypeRecompense = 'teinte' | 'motif' | 'cadre'

/* ---- Cadres d'avatar ---- */

export type CleCadre = 'aucun' | 'bronze' | 'argent' | 'or' | 'platine' | 'diamant' | 'legende'

export const CADRES: { cle: CleCadre; nom: string; niveau: number; couleur: string }[] = [
  { cle: 'aucun', nom: 'Aucun', niveau: 0, couleur: '#8d9096' },
  { cle: 'bronze', nom: 'Bronze', niveau: 5, couleur: '#c98a5b' },
  { cle: 'argent', nom: 'Argent', niveau: 10, couleur: '#c4ccd6' },
  { cle: 'or', nom: 'Or', niveau: 20, couleur: '#f0c04a' },
  { cle: 'platine', nom: 'Platine', niveau: 35, couleur: '#6fe0d2' },
  { cle: 'diamant', nom: 'Diamant', niveau: 55, couleur: '#b9a2ff' },
  { cle: 'legende', nom: 'Légende', niveau: 80, couleur: '#f5c542' },
]

export function cadre(cle: string | null | undefined) {
  return CADRES.find((c) => c.cle === cle) ?? CADRES[0]
}

/* ---- Toutes les récompenses ---- */

export type Recompense = {
  type: TypeRecompense
  cle: string
  nom: string
  niveau: number
  origine: Origine
}

export const RECOMPENSES: Recompense[] = [
  ...BANNIERES.map((b) => ({ type: 'teinte' as const, cle: b.cle, nom: b.nom, niveau: b.niveau })),
  ...MOTIFS.map((m) => ({ type: 'motif' as const, cle: m.cle, nom: m.nom, niveau: m.niveau })),
  ...CADRES.map((c) => ({ type: 'cadre' as const, cle: c.cle, nom: c.nom, niveau: c.niveau })),
].map((r) => ({ ...r, origine: r.niveau > 0 ? ('niveau' as const) : ('libre' as const) }))

export function niveauRequis(type: TypeRecompense, cle: string): number {
  return RECOMPENSES.find((r) => r.type === type && r.cle === cle)?.niveau ?? 0
}

export function estDebloque(niveau: number, type: TypeRecompense, cle: string): boolean {
  return niveau >= niveauRequis(type, cle)
}

/** Ce qui se débloque en passant du niveau `avant` au niveau `apres`. */
export function recompensesEntre(avant: number, apres: number): Recompense[] {
  return RECOMPENSES.filter((r) => r.niveau > avant && r.niveau <= apres).sort(
    (a, b) => a.niveau - b.niveau || ordre(a.type) - ordre(b.type)
  )
}

function ordre(t: TypeRecompense): number {
  return t === 'cadre' ? 0 : t === 'teinte' ? 1 : 2
}

/* ---- Paliers à Lingots ----
   Montants dans lib/lingots.ts ; crédités par la base. Après le
   niveau 80, un palier tous les 5 niveaux. */

export function donneLingots(niveau: number): boolean {
  return montantPalier(niveau) > 0
}

/** Les récompenses d'un niveau, cadre d'abord. */
export function recompensesDuNiveau(niveau: number): Recompense[] {
  return RECOMPENSES.filter((r) => r.niveau === niveau && niveau > 0).sort(
    (a, b) => ordre(a.type) - ordre(b.type)
  )
}

export const LIBELLE_TYPE: Record<TypeRecompense, string> = {
  cadre: 'Cadre',
  teinte: 'Teinte',
  motif: 'Motif',
}

/* ---- Avatars ---- */
/* Tous libres. Les 16 d'origine sont dans la liste. */

export const AVATARS: { famille: string; liste: string[] }[] = [
  {
    famille: 'Sport',
    liste: [
      '💪', '🏋️', '🤸', '🏃', '🚴', '🏊', '🧗', '🥊', '🤼', '⛹️', '🧘', '🏄',
      '⚽', '🏀', '🎾', '🏐', '🏈', '🥋', '⛷️', '🏓', '🥇', '🏆', '⏱️', '🦾',
    ],
  },
  {
    famille: 'Animaux',
    liste: [
      '🐺', '🦁', '🐻', '🦍', '🐯', '🦅', '🦈', '🐉', '🦬', '🐂', '🦏', '🐆',
      '🦊', '🐼', '🐨', '🦉', '🐙', '🦄', '🐊', '🦂',
    ],
  },
  {
    famille: 'Énergie',
    liste: ['🔥', '⚡', '🚀', '💥', '🌋', '☄️', '⭐', '🌟', '✨', '💫', '🧨', '🎯'],
  },
  {
    famille: 'Nature',
    liste: ['🌑', '🌕', '🌊', '🏔️', '🌲', '🍀', '🌵', '🌸', '❄️', '🌪️', '🌈', '☀️'],
  },
  {
    famille: 'Objets',
    liste: ['⚙️', '🧊', '💎', '🛡️', '⚔️', '🗿', '🎧', '🕶️', '🧢', '👟', '🎲', '♟️'],
  },
  {
    famille: 'Visages',
    liste: ['😤', '😎', '🤘', '🥶', '🤖', '👊', '🫡', '😈', '💀', '👑'],
  },
]
