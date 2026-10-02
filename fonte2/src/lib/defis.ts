/* ============================================================
   Défis — définitions partagées (client et serveur)
   ============================================================
   Les listes ci-dessous (formes, icônes, fonds, bordures) sont
   aussi vérifiées par la base (`defi_badge_valide`) : les garder
   identiques à fonte-defis.sql.
   ============================================================ */

export const FORMES_BADGE = [
  'hexagone',
  'cercle',
  'bouclier',
  'rosette',
  'losange',
  'medaille',
] as const
export type FormeBadge = (typeof FORMES_BADGE)[number]

export const FONDS_BADGE = ['uni', 'degrade', 'rayons', 'points'] as const
export type FondBadge = (typeof FONDS_BADGE)[number]

export const BORDURES_BADGE = ['simple', 'double', 'pointillee'] as const
export type BordureBadge = (typeof BORDURES_BADGE)[number]

export const COULEURS_BADGE = [
  '#ff6a3d',
  '#f0c04a',
  '#3ddc84',
  '#4cc9f0',
  '#5b8cff',
  '#a98bff',
  '#ff5fa2',
  '#c4ccd6',
  '#c98a5b',
  '#f4f3ee',
] as const

/** Tracés sur une grille de 24, en traits. */
export const ICONES_BADGE = {
  flamme:
    '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.3 3.7-7.8.4 1.9 1.4 3 2.6 3.6C11.5 7.6 13 5 15.6 3c-.3 2.8.7 4.6 1.9 6.3 1 1.5 1 3 1 4.9C18.5 18.4 15.9 21 12 21z"/>',
  haltere: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  chaussure:
    '<path d="M3 17h16.5a1.5 1.5 0 0 0 1.5-1.5c0-1.6-1.2-2.6-2.8-3l-4.2-1-2.5-3.5-2.2.9.8 2.4-2.6.6L5.2 9 3 10z"/><path d="M3 17v2h18"/>',
  goutte: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
  montagne: '<path d="M3 19l6.5-11 4 6.5 2.5-3.5L21 19z"/>',
  eclair: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  coeur:
    '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  cible:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  coupe:
    '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5a3 3 0 0 0 3 4M16 5.5h3a3 3 0 0 1-3 4M12 13v4M8.5 20.5h7M10 17h4"/>',
  chrono:
    '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M18.5 6l1.5-1.5"/>',
  velo: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l2 7M13 6h3"/>',
  lune: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  soleil:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  etoile:
    '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>',
  flocon: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  feuille: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19l7-7"/>',
} as const
export type IconeBadge = keyof typeof ICONES_BADGE

export type ConfigBadge = {
  forme: FormeBadge
  couleur: string
  icone: IconeBadge
  fond: FondBadge
  bordure: BordureBadge
  texte: string
}

export const BADGE_PAR_DEFAUT: ConfigBadge = {
  forme: 'hexagone',
  couleur: '#ff6a3d',
  icone: 'flamme',
  fond: 'degrade',
  bordure: 'simple',
  texte: '',
}

/** Relit un badge venu de la base, en retombant sur le défaut. */
export function lireBadge(brut: unknown): ConfigBadge {
  const b = (brut ?? {}) as Record<string, unknown>
  const dans = <T extends string>(liste: readonly T[], v: unknown, d: T): T =>
    liste.includes(v as T) ? (v as T) : d
  return {
    forme: dans(FORMES_BADGE, b.forme, BADGE_PAR_DEFAUT.forme),
    couleur:
      typeof b.couleur === 'string' && /^#[0-9a-fA-F]{6}$/.test(b.couleur)
        ? b.couleur
        : BADGE_PAR_DEFAUT.couleur,
    icone: dans(
      Object.keys(ICONES_BADGE) as IconeBadge[],
      b.icone,
      BADGE_PAR_DEFAUT.icone
    ),
    fond: dans(FONDS_BADGE, b.fond, BADGE_PAR_DEFAUT.fond),
    bordure: dans(BORDURES_BADGE, b.bordure, BADGE_PAR_DEFAUT.bordure),
    texte: typeof b.texte === 'string' ? b.texte.slice(0, 4) : '',
  }
}

/* ---- Objectifs ---- */

export const OBJECTIFS = {
  seances: { libelle: 'Séances', unite: (n: number) => (n > 1 ? 'séances' : 'séance') },
  series: { libelle: 'Séries validées', unite: (n: number) => (n > 1 ? 'séries' : 'série') },
  tonnage: { libelle: 'Tonnage (t)', unite: () => 't' },
  releves: { libelle: 'Relevés hebdo', unite: (n: number) => (n > 1 ? 'relevés' : 'relevé') },
  seance_longue: { libelle: 'Séance en direct ≥ X min', unite: () => 'min' },
  records: { libelle: 'Records battus', unite: (n: number) => (n > 1 ? 'records' : 'record') },
  exercices: {
    libelle: 'Exercices différents',
    unite: (n: number) => (n > 1 ? 'exercices' : 'exercice'),
  },
  jours: { libelle: 'Jours cochés', unite: (n: number) => (n > 1 ? 'jours' : 'jour') },
} as const
export type Objectif = keyof typeof OBJECTIFS

/** Objectifs proposés pour un défi vérifié (calculés depuis le carnet). */
export const OBJECTIFS_VERIFIES: Objectif[] = [
  'seances',
  'series',
  'tonnage',
  'releves',
  'seance_longue',
  'records',
  'exercices',
]

/** « 4 séances », « 10 000 t », « une séance d'au moins 90 min ». */
export function libelleObjectif(objectif: Objectif, valeur: number): string {
  if (objectif === 'seance_longue') return `une séance en direct d'au moins ${valeur} min`
  return `${nombre(valeur)} ${OBJECTIFS[objectif].unite(valeur)}`
}

export function nombre(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('fr-FR')
}

/* ---- Un défi tel que le voit une personne ---- */

export type Defi = {
  edition: string
  defi: string
  titre: string
  description: string
  type: 'verifie' | 'honneur'
  portee: 'individuel' | 'collectif'
  objectif: Objectif
  valeur: number
  cible: number
  xp: number
  badge: ConfigBadge
  repetition: 'aucune' | 'semaine' | 'mois'
  debut: string
  fin: string
  enCours: boolean
  participe: boolean
  refuse: boolean
  progression: number
  reussiLe: string | null
  total: number | null
  atteint: boolean
  jours: string[]
}

export function lireDefi(brut: unknown): Defi | null {
  if (!brut || typeof brut !== 'object') return null
  const d = brut as Record<string, unknown>
  const objectif = (String(d.objectif) in OBJECTIFS ? d.objectif : 'seances') as Objectif
  return {
    edition: String(d.edition ?? ''),
    defi: String(d.defi ?? ''),
    titre: String(d.titre ?? ''),
    description: String(d.description ?? ''),
    type: d.type === 'honneur' ? 'honneur' : 'verifie',
    portee: d.portee === 'collectif' ? 'collectif' : 'individuel',
    objectif,
    valeur: Number(d.valeur) || 0,
    cible: Number(d.cible) || 1,
    xp: Number(d.xp) || 0,
    badge: lireBadge(d.badge),
    repetition:
      d.repetition === 'semaine' || d.repetition === 'mois' ? d.repetition : 'aucune',
    debut: String(d.debut ?? ''),
    fin: String(d.fin ?? ''),
    enCours: d.en_cours === true,
    participe: d.participe === true,
    refuse: d.refuse === true,
    progression: Number(d.progression) || 0,
    reussiLe: typeof d.reussi_le === 'string' ? d.reussi_le : null,
    total: d.total == null ? null : Number(d.total),
    atteint: d.atteint === true,
    jours: Array.isArray(d.jours) ? (d.jours as unknown[]).map(String) : [],
  }
}

/** Progression affichée : la mienne, ou le total commun. */
export function avancement(d: Defi): { valeur: number; cible: number; part: number } {
  const valeur = d.portee === 'collectif' ? (d.total ?? 0) : d.progression
  const cible = d.cible
  return { valeur, cible, part: cible > 0 ? Math.min(1, valeur / cible) : 0 }
}

/** « 4 j », « 5 h », « moins d'une heure ». La fin est exclue. */
export function tempsRestant(fin: string, maintenant: number = Date.now()): string {
  const ms = new Date(fin).getTime() - maintenant
  if (!Number.isFinite(ms) || ms <= 0) return 'terminé'
  const h = Math.floor(ms / 3600000)
  if (h < 1) return "moins d'une heure"
  if (h < 48) return `${h} h`
  return `${Math.floor(h / 24)} j`
}

/** « dimanche 5 oct. » : le dernier jour inclus du défi. */
export function dernierJour(fin: string): string {
  const d = new Date(new Date(fin).getTime() - 1000)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Paris',
  })
}

/* ---- Badges de défis sur un profil ---- */

export type BadgesDefis = {
  reussis: {
    defi: string
    titre: string
    badge: ConfigBadge
    fois: number
    derniere: string
    edition: string
  }[]
  enCours: { edition: string; defi: string; titre: string; badge: ConfigBadge }[]
}

export function lireBadgesDefis(brut: unknown): BadgesDefis | null {
  if (!brut || typeof brut !== 'object') return null
  const b = brut as { reussis?: unknown; en_cours?: unknown }
  const liste = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : [])
  return {
    reussis: liste(b.reussis).map((r) => ({
      defi: String(r.defi ?? ''),
      titre: String(r.titre ?? ''),
      badge: lireBadge(r.badge),
      fois: Number(r.fois) || 1,
      derniere: String(r.derniere ?? ''),
      edition: String(r.edition ?? ''),
    })),
    enCours: liste(b.en_cours).map((r) => ({
      edition: String(r.edition ?? ''),
      defi: String(r.defi ?? ''),
      titre: String(r.titre ?? ''),
      badge: lireBadge(r.badge),
    })),
  }
}

/* ---- Côté admin ---- */

export type DefiAdmin = {
  id: string
  titre: string
  description: string
  type: 'verifie' | 'honneur'
  portee: 'individuel' | 'collectif'
  objectif: Objectif
  valeur: number
  xp: number
  duree: 'dimanche' | 'jours' | 'dates'
  dureeJours: number | null
  debut: string
  fin: string | null
  repetition: 'aucune' | 'semaine' | 'mois'
  badge: ConfigBadge
  annonce: boolean
  statut: 'brouillon' | 'publie' | 'archive'
  editionFin: string | null
}

export type NouveauDefi = {
  titre: string
  description: string
  type: 'verifie' | 'honneur'
  portee: 'individuel' | 'collectif'
  objectif: Objectif
  valeur: number
  xp: number
  duree: 'dimanche' | 'jours' | 'dates'
  dureeJours: number | null
  /** ISO, ou null pour « maintenant ». */
  debut: string | null
  fin: string | null
  repetition: 'aucune' | 'semaine' | 'mois'
  badge: ConfigBadge
  annonce: boolean
  statut: 'brouillon' | 'publie'
}
