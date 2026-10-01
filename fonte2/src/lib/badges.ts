/* ============================================================
   Badges
   ============================================================
   14 badges, 50 paliers. Le calcul vit dans la base
   (fonte-badges.sql) ; ce fichier décrit ce qu'on affiche :
   noms, conditions, seuils, couleurs, icônes. Les seuils DOIVENT
   rester identiques à ceux du SQL.
   ============================================================ */

export type CategorieBadge = 'Régularité' | 'Effort' | 'Progression' | 'Moments'

export type DefinitionBadge = {
  id: string
  nom: string
  categorie: CategorieBadge
  /** Ce que le badge récompense, en une phrase. */
  condition: string
  /** Seuils affichés, du premier au dernier palier. */
  seuils: string[]
  /** « séances », « semaines »… pour « 56 séances ». */
  unite: (n: number) => string
  /** Un seul palier, couleur spéciale. */
  moment?: boolean
  /** Tracé de l'icône, sur une grille de 24. */
  icone: string
}

const pluriel = (singulier: string, pluriel: string) => (n: number) =>
  n > 1 ? pluriel : singulier

export const BADGES: DefinitionBadge[] = [
  {
    id: 'assidu',
    nom: 'Assidu',
    categorie: 'Régularité',
    condition: 'Séances enregistrées',
    seuils: ['1', '10', '50', '100', '250'],
    unite: pluriel('séance', 'séances'),
    icone:
      '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2 2 4-4"/>',
  },
  {
    id: 'inarretable',
    nom: 'Inarrêtable',
    categorie: 'Régularité',
    condition: "Semaines d'affilée avec au moins une séance (ta meilleure série)",
    seuils: ['4', '8', '12', '26', '52'],
    unite: pluriel('semaine', 'semaines'),
    icone:
      '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.3 3.7-7.8.4 1.9 1.4 3 2.6 3.6C11.5 7.6 13 5 15.6 3c-.3 2.8.7 4.6 1.9 6.3 1 1.5 1 3 1 4.9C18.5 18.4 15.9 21 12 21z"/>',
  },
  {
    id: 'rigoureux',
    nom: 'Rigoureux',
    categorie: 'Régularité',
    condition: 'Relevés hebdo complétés',
    seuils: ['4', '12', '26', '52'],
    unite: pluriel('relevé', 'relevés'),
    icone:
      '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  },
  {
    id: 'dimanche',
    nom: 'Rituel du dimanche',
    categorie: 'Régularité',
    condition: 'Relevés faits le dimanche',
    seuils: ['4', '12', '26'],
    unite: pluriel('relevé', 'relevés'),
    icone:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  },
  {
    id: 'complete',
    nom: 'Semaine complète',
    categorie: 'Régularité',
    condition: 'Semaines avec au moins une séance et un relevé',
    seuils: ['4', '12', '26', '52'],
    unite: pluriel('semaine', 'semaines'),
    icone:
      '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.3 1.3"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3"/>',
  },
  {
    id: 'travailleur',
    nom: 'Travailleur',
    categorie: 'Effort',
    condition: 'Séries validées',
    seuils: ['100', '500', '1 000', '2 500', '5 000'],
    unite: pluriel('série', 'séries'),
    icone: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  },
  {
    id: 'demenageur',
    nom: 'Déménageur',
    categorie: 'Effort',
    condition: 'Tonnage total soulevé',
    seuils: ['10 t', '50 t', '100 t', '500 t', '1 000 t'],
    unite: () => 't',
    icone: '<path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/><circle cx="12" cy="14.5" r="6.5"/>',
  },
  {
    id: 'marathonien',
    nom: 'Marathonien',
    categorie: 'Effort',
    condition: 'Séances de plus de 90 minutes en mode direct',
    seuils: ['1', '10', '25'],
    unite: pluriel('séance', 'séances'),
    icone:
      '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M18.5 6l1.5-1.5"/>',
  },
  {
    id: 'record',
    nom: 'Record battu',
    categorie: 'Progression',
    condition: 'Records de 1RM estimé',
    seuils: ['1', '10', '25', '50', '100'],
    unite: pluriel('record', 'records'),
    icone: '<path d="M3.5 17l6-6 4 4 7-7.5"/><path d="M14.5 7.5h6v6"/>',
  },
  {
    id: 'club',
    nom: 'Club des 100',
    categorie: 'Progression',
    condition: 'Meilleur 1RM estimé, tous exercices confondus',
    seuils: ['60 kg', '80 kg', '100 kg', '120 kg', '140 kg'],
    unite: () => 'kg',
    icone:
      '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5a3 3 0 0 0 3 4M16 5.5h3a3 3 0 0 1-3 4M12 13v4M8.5 20.5h7M10 17h4"/>',
  },
  {
    id: 'polyvalent',
    nom: 'Polyvalent',
    categorie: 'Progression',
    condition: 'Exercices différents pratiqués',
    seuils: ['5', '10', '20'],
    unite: pluriel('exercice', 'exercices'),
    icone:
      '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><circle cx="16.75" cy="16.75" r="3.25"/>',
  },
  {
    id: 'levetot',
    nom: 'Lève-tôt',
    categorie: 'Moments',
    condition: 'Commence une séance en mode direct avant 7 h du matin.',
    seuils: ['1'],
    unite: () => '',
    moment: true,
    icone:
      '<path d="M3 18.5h18M6.5 18.5a5.5 5.5 0 0 1 11 0M12 4v3.5M4.6 10.6l1.6 1.2M19.4 10.6l-1.6 1.2M9.5 6.5L12 4l2.5 2.5"/>',
  },
  {
    id: 'nuit',
    nom: 'Oiseau de nuit',
    categorie: 'Moments',
    condition: 'Termine une séance en mode direct après 22 h.',
    seuils: ['1'],
    unite: () => '',
    moment: true,
    icone:
      '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="M16 4.5v3M14.5 6h3"/>',
  },
  {
    id: 'retour',
    nom: 'Retour en force',
    categorie: 'Moments',
    condition: 'Reprends l’entraînement après au moins 4 semaines sans séance.',
    seuils: ['1'],
    unite: () => '',
    moment: true,
    icone:
      '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M13 7.5l-3 5h4l-3 5"/>',
  },
]

export const CATEGORIES: CategorieBadge[] = ['Régularité', 'Effort', 'Progression', 'Moments']

export const PALIERS = [
  { nom: 'Bronze', couleur: '#c98a5b' },
  { nom: 'Argent', couleur: '#c4ccd6' },
  { nom: 'Or', couleur: '#f0c04a' },
  { nom: 'Platine', couleur: '#6fe0d2' },
  { nom: 'Diamant', couleur: '#b9a2ff' },
] as const

export const COULEUR_MOMENT = '#ff8a63'

/** XP par palier (index 0 = bronze). Les « Moments » valent 100. */
export const XP_PALIERS = [25, 50, 100, 200, 400] as const
export const XP_MOMENT = 100

export function xpPalier(def: DefinitionBadge, index: number): number {
  return def.moment ? XP_MOMENT : XP_PALIERS[index]
}

/** Nombre total de paliers, tous badges confondus. */
export const TOTAL_PALIERS = BADGES.reduce((t, b) => t + b.seuils.length, 0)

/** État d'un badge pour une personne, tel que renvoyé par la base. */
export type EtatBadge = {
  id: string
  valeur: number
  /** Date d'obtention de chaque palier, null s'il ne l'est pas. */
  dates: (string | null)[]
}

/** Nombre de paliers obtenus. */
export function obtenus(etat: EtatBadge | undefined): number {
  return etat ? etat.dates.filter((d) => d !== null).length : 0
}

export function couleurPalier(def: DefinitionBadge, index: number): string {
  return def.moment ? COULEUR_MOMENT : PALIERS[index].couleur
}

export function nomPalier(def: DefinitionBadge, index: number): string {
  return def.moment ? 'Débloqué' : PALIERS[index].nom
}

/** Valeur numérique d'un seuil affiché (« 1 000 t » → 1000). */
export function seuilNumerique(seuil: string): number {
  return Number(seuil.replace(/[^\d.]/g, '')) || 0
}

export function definitionBadge(id: string): DefinitionBadge | undefined {
  return BADGES.find((b) => b.id === id)
}
