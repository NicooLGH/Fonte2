/* ============================================================
   Le volet social
   ============================================================
   Types et aides d'affichage, utilisables des deux côtés.
   Aucun import serveur ici : les composants navigateur s'en
   servent.
   ============================================================ */

export type Signe = '💪' | '🔥' | '👏' | '🚀' | '😮'

/** Encouragements : quatre signes, un par ami et par semaine. */
export const SIGNES_ENCOURAGEMENT: Signe[] = ['💪', '🔥', '👏', '🚀']

/** Réactions aux séances : le même jeu, plus la surprise. */
export const SIGNES_REACTION: Signe[] = ['💪', '🔥', '👏', '🚀', '😮']

export type Relation =
  | 'moi'
  | 'ami'
  | 'demande_envoyee'
  | 'demande_recue'
  | 'inconnu'

export type Ami = {
  id: string
  pseudo: string
  avatar: string | null
  streak: number
  actifSemaine: boolean
  amiDepuis: string | null
  presenceSec: number | null
}

export type Demande = {
  id: string
  pseudo: string
  avatar: string | null
}

export type ListeAmis = {
  amis: Ami[]
  attente: Demande[]
  envoyes: Demande[]
  actifsSemaine: number
}

export type Resultat = {
  id: string
  pseudo: string
  avatar: string | null
  relation: Relation
}

export type BlocSeance = {
  nom: string
  volume: number
  series: { poids: number; reps: number }[]
}

export type PublicationSeance = {
  seanceId: string
  auteurId: string
  pseudo: string
  avatar: string | null
  date: string
  note: string | null
  dureeSec: number | null
  volume: number
  blocs: BlocSeance[]
  reactions: Record<string, number>
  maReaction: Signe | null
}

export type Signal = {
  type: 'reaction' | 'encouragement'
  pseudo: string
  signe: Signe
  date: string
  detail: string
}

export type ProfilPublic = {
  id: string
  pseudo: string
  avatar: string | null
  streak: number
  relation: Relation
  amiDepuis: string | null
  presenceSec: number | null
  detail: boolean
  /* Présents seulement si `detail` vaut vrai */
  semaines?: number
  exercices?: number
  volume?: number
  records?: { exercice: string; poids: number }[]
  partageSeances?: boolean
  seances?: PublicationSeance[]
}

/* ============================================================
   Affichage
   ============================================================ */

/**
 * Présence.
 *
 * La base ne renvoie qu'une durée arrondie, jamais l'horodatage
 * exact : savoir que quelqu'un était là il y a deux heures est
 * anodin, connaître l'heure de chacune de ses connexions ne
 * l'est pas.
 */
export function presenceLisible(sec: number | null): string | null {
  if (sec === null) return null
  if (sec < 300) return 'en ligne'

  const min = Math.floor(sec / 60)
  if (min < 60) return `vu il y a ${min} min`

  const heures = Math.floor(min / 60)
  if (heures < 24) return `vu il y a ${heures} h`

  const jours = Math.floor(heures / 24)
  if (jours === 1) return 'vu hier'
  if (jours < 7) return `vu il y a ${jours} jours`

  const semaines = Math.floor(jours / 7)
  if (semaines < 5) return `vu il y a ${semaines} semaine${semaines > 1 ? 's' : ''}`
  return 'vu il y a longtemps'
}

export function estEnLigne(sec: number | null): boolean {
  return sec !== null && sec < 300
}

/**
 * Ancienneté d'une amitié.
 *
 * On compare des jours calendaires, pas des millisecondes : une
 * amitié nouée hier à 23 h doit afficher « depuis hier », pas
 * « depuis aujourd'hui ».
 */
export function anciennete(iso: string | null): string {
  if (!iso) return ''

  const d = new Date(iso)
  const alors = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const n = new Date()
  const maintenant = new Date(n.getFullYear(), n.getMonth(), n.getDate())
  const jours = Math.round((maintenant.getTime() - alors.getTime()) / 86400000)

  if (jours <= 0) return "depuis aujourd'hui"
  if (jours === 1) return 'depuis hier'
  if (jours < 7) return `depuis ${jours} jours`
  if (jours < 31) {
    const s = Math.floor(jours / 7)
    return `depuis ${s} semaine${s > 1 ? 's' : ''}`
  }
  const mois = Math.floor(jours / 30)
  if (mois < 12) return `depuis ${mois} mois`
  const ans = Math.floor(mois / 12)
  return `depuis ${ans} an${ans > 1 ? 's' : ''}`
}

/** « 1 h 12 » plutôt que « 72:04 » pour un affichage social. */
export function dureeLisible(sec: number | null): string | null {
  if (!sec) return null
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

export function dateRelative(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return "à l'instant"
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24)
  if (j === 1) return 'hier'
  if (j < 7) return `il y a ${j} jours`
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}
