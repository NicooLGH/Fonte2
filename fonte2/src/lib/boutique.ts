/* ============================================================
   Boutique — collection Fonderie
   ============================================================
   26 objets exclusifs, achetés avec des Lingots. Ils ne sont
   jamais sur la piste, et les cadres de rang ne s'achètent pas.

   Le catalogue, les prix et les règles vivent dans la base
   (fonte-boutique.sql) : cette liste sert à l'affichage et DOIT
   rester identique au SQL, dans le même ordre (l'objet « À la
   une » est tiré dans cet ordre).
   ============================================================ */

export type Rarete = 'commun' | 'rare' | 'epique'
export type TypeObjet = 'teinte' | 'motif' | 'cadre' | 'avatar'

export type ObjetBoutique = {
  type: TypeObjet
  cle: string
  nom: string
  rarete: Rarete
  description: string
}

export const PRIX: Record<Rarete, number> = { commun: 500, rare: 1000, epique: 2000 }
export const PRIX_MYSTERE: Record<Rarete, number> = { commun: 400, rare: 850, epique: 1700 }
export const REMBOURSEMENT: Record<Rarete, number> = { commun: 200, rare: 425, epique: 850 }

export const RARETES: { cle: Rarete; nom: string; boite: string; couleur: string }[] = [
  { cle: 'commun', nom: 'Commun', boite: 'Commune', couleur: '#c4ccd6' },
  { cle: 'rare', nom: 'Rare', boite: 'Rare', couleur: '#4cc9f0' },
  { cle: 'epique', nom: 'Épique', boite: 'Épique', couleur: '#b9a2ff' },
]

export function couleurRarete(r: Rarete): string {
  return RARETES.find((x) => x.cle === r)?.couleur ?? '#c4ccd6'
}

export const LIBELLE_OBJET: Record<TypeObjet, string> = {
  teinte: 'Teinte',
  motif: 'Motif',
  cadre: 'Cadre',
  avatar: 'Avatar',
}

export const CATALOGUE: ObjetBoutique[] = [
  { type: 'teinte', cle: 'menthe', nom: 'Menthe', rarete: 'commun', description: 'Un vert frais et léger.' },
  { type: 'teinte', cle: 'corail', nom: 'Corail', rarete: 'commun', description: 'Un rose orangé chaleureux.' },
  { type: 'teinte', cle: 'lilas', nom: 'Lilas', rarete: 'commun', description: 'Un violet doux.' },
  { type: 'teinte', cle: 'sorbet', nom: 'Sorbet', rarete: 'rare', description: 'De la pêche vers le rose.' },
  { type: 'teinte', cle: 'lagon', nom: 'Lagon', rarete: 'rare', description: 'Du turquoise vers le bleu profond.' },
  { type: 'teinte', cle: 'boreale', nom: 'Aurore boréale', rarete: 'epique', description: 'Trois lueurs, vert, cyan et violet, avec un reflet qui passe.' },
  { type: 'motif', cle: 'halteres', nom: 'Haltères', rarete: 'commun', description: 'Des haltères éparpillés.' },
  { type: 'motif', cle: 'pluie', nom: 'Pluie', rarete: 'commun', description: 'Une pluie fine et bleutée.' },
  { type: 'motif', cle: 'bulles', nom: 'Bulles', rarete: 'commun', description: 'Des bulles de toutes tailles.' },
  { type: 'motif', cle: 'topographie', nom: 'Topographie', rarete: 'rare', description: 'Des courbes de niveau, comme sur une carte.' },
  { type: 'motif', cle: 'neon', nom: 'Néon', rarete: 'rare', description: 'Des lignes lumineuses cyan et rose.' },
  { type: 'motif', cle: 'feu', nom: 'Feu d’artifice', rarete: 'epique', description: 'Des gerbes dorées, roses et bleues.' },
  { type: 'cadre', cle: 'cuivre', nom: 'Cuivre', rarete: 'commun', description: 'Un contour cuivré.' },
  { type: 'cadre', cle: 'ardoise', nom: 'Ardoise', rarete: 'commun', description: 'Un double contour gris bleu.' },
  { type: 'cadre', cle: 'neon', nom: 'Néon', rarete: 'rare', description: 'Un double anneau cyan et rose qui brille.' },
  { type: 'cadre', cle: 'glace', nom: 'Glace', rarete: 'rare', description: 'Un contour givré.' },
  { type: 'cadre', cle: 'flamme', nom: 'Flamme', rarete: 'epique', description: 'Un anneau de feu qui tourne.' },
  { type: 'avatar', cle: 'haltere', nom: 'Haltère', rarete: 'commun', description: 'Un haltère qui sourit.' },
  { type: 'avatar', cle: 'gant', nom: 'Gant', rarete: 'commun', description: 'Un gant de boxe.' },
  { type: 'avatar', cle: 'kettlebell', nom: 'Kettlebell', rarete: 'commun', description: 'Une kettlebell en fonte.' },
  { type: 'avatar', cle: 'eclair', nom: 'Éclair', rarete: 'commun', description: 'Un éclair doré.' },
  { type: 'avatar', cle: 'loup', nom: 'Loup', rarete: 'rare', description: 'Un loup taillé à facettes.' },
  { type: 'avatar', cle: 'taureau', nom: 'Taureau', rarete: 'rare', description: 'Un taureau, cornes en avant.' },
  { type: 'avatar', cle: 'requin', nom: 'Requin', rarete: 'rare', description: 'Un aileron qui fend la vague.' },
  { type: 'avatar', cle: 'phenix', nom: 'Phénix', rarete: 'epique', description: 'Un oiseau de feu.' },
  { type: 'avatar', cle: 'golem', nom: 'Golem de fonte', rarete: 'epique', description: 'Un golem de fonte aux yeux de braise.' },
]

export function objet(type: string, cle: string): ObjetBoutique | null {
  return CATALOGUE.find((o) => o.type === type && o.cle === cle) ?? null
}

export function nbParRarete(r: Rarete): number {
  return CATALOGUE.filter((o) => o.rarete === r).length
}

/* ---- Avatars spéciaux ----
   Rangés dans la colonne `avatar` sous la forme « fonte:loup ».
   La base refuse un avatar spécial qui n'est pas possédé. */

const PREFIXE = 'fonte:'

/** Emoji de remplacement, pour les dessins sur canvas. */
const EMOJI_AVATAR: Record<string, string> = {
  haltere: '🏋️', gant: '🥊', kettlebell: '🏋️', eclair: '⚡',
  loup: '🐺', taureau: '🐂', requin: '🦈', phenix: '🔥', golem: '🗿',
}

export function estAvatarSpecial(avatar: string | null | undefined): boolean {
  return typeof avatar === 'string' && avatar.startsWith(PREFIXE)
}

export function cleAvatar(avatar: string): string {
  return avatar.slice(PREFIXE.length)
}

export function valeurAvatar(cle: string): string {
  return PREFIXE + cle
}

/** L'image d'un avatar spécial (dans public/avatars). */
export function imageAvatar(avatar: string): string | null {
  if (!estAvatarSpecial(avatar)) return null
  const cle = cleAvatar(avatar)
  return objet('avatar', cle) ? `/avatars/${cle}.svg` : null
}

/** Ce qu'on écrit à la place sur un canvas (cartes de partage). */
export function avatarTexte(avatar: string | null | undefined): string {
  if (!avatar) return '💪'
  if (!estAvatarSpecial(avatar)) return avatar
  return EMOJI_AVATAR[cleAvatar(avatar)] ?? '💪'
}

/* ---- État renvoyé par la base ---- */

export type Possession = { type: TypeObjet; cle: string }

export type EtatBoutique = {
  solde: number
  possessions: Possession[]
  une: { type: TypeObjet; cle: string; prix: number } | null
}

export function possede(possessions: Possession[], type: string, cle: string): boolean {
  return possessions.some((p) => p.type === type && p.cle === cle)
}
