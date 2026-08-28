/**
 * Types du schéma Supabase.
 *
 * Version écrite à la main, couvrant les tables du carnet. Elle
 * suffit pour démarrer et donne déjà l'essentiel : une faute de
 * frappe sur un nom de colonne sera signalée par l'éditeur avant
 * même de compiler.
 *
 * Tu pourras la remplacer par la version générée automatiquement
 * quand tu le voudras :
 *
 *   npx supabase login
 *   npx supabase gen types typescript \
 *     --project-id nwdkeznwflmtidxgittq > src/types/database.ts
 *
 * Ce n'est pas urgent — l'écrire à la main évite d'installer la
 * ligne de commande Supabase dès la première session.
 */

export type Groupe =
  | 'pectoraux' | 'dos' | 'epaules' | 'biceps' | 'triceps'
  | 'jambes' | 'fessiers' | 'abdos' | 'cardio' | 'autre'

export type Signe = '💪' | '🔥' | '👏' | '🚀' | '😮'
export type Role = 'membre' | 'admin'
export type TonAnnonce = 'info' | 'succes' | 'alerte'

/** Colonnes d'une table, déclinées en lecture / insertion / mise à jour. */
type Table<Ligne> = {
  Row: Ligne
  Insert: Partial<Ligne>
  Update: Partial<Ligne>
  Relationships: []
}

export interface Profil {
  id: string
  pseudo: string
  avatar: string | null
  onboarded: boolean
  role: Role
  partage_seances: boolean
  partage_presence: boolean
  derniere_activite: string | null
  pseudo_changed_at: string | null
  updated_at: string | null
}

export interface Exercice {
  id: string
  user_id: string
  name: string
  objectif: number | null
  groupe: Groupe | null
  created_at: string | null
}

export interface Seance {
  id: string
  user_id: string
  date: string
  week_key: string
  note: string | null
  duree_sec: number | null
  created_at: string | null
}

export interface Serie {
  id: string
  user_id: string
  seance_id: string
  exercice_id: string
  position: number
  poids: number
  reps: number
}

export interface Suivi {
  id: string
  user_id: string
  date: string
  week_key: string
  poids: number | null
  calories: number | null
  taille: number | null
  pec: number | null
  bras: number | null
  epaule: number | null
  jambe: number | null
  photo_path: string | null
  bonus_dimanche: boolean
  note: string | null
}

export interface Objectifs {
  user_id: string
  mensu: Record<string, number>
  suivi: Record<string, number>
  updated_at: string | null
}

export interface Modele {
  id: string
  user_id: string
  nom: string
  exercices: { id: string; alternatives: string[] }[]
  created_at: string | null
}

export interface Amitie {
  id: string
  demandeur_id: string
  destinataire_id: string
  statut: 'attente' | 'ami'
  created_at: string | null
}

export interface Encouragement {
  id: string
  expediteur_id: string
  destinataire_id: string
  signe: Signe
  week_key: string
  created_at: string | null
}

export interface ReactionSeance {
  id: string
  seance_id: string
  auteur_id: string
  signe: Signe
  created_at: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: string
  titre: string
  corps: string | null
  lien: string | null
  lue: boolean
  created_at: string | null
}

export interface Annonce {
  id: string
  titre: string
  corps: string
  ton: TonAnnonce
  active: boolean
  retirable: boolean
  epinglee: boolean
  couleur: string | null
  icone: string | null
  lien_texte: string | null
  lien_url: string | null
  auteur_id: string | null
  expire_le: string | null
  created_at: string | null
}

export interface ReminderSettings {
  user_id: string
  day: number | null
  dismissed_week: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profil>
      exercices: Table<Exercice>
      seances: Table<Seance>
      series: Table<Serie>
      suivi: Table<Suivi>
      objectifs: Table<Objectifs>
      modeles: Table<Modele>
      amities: Table<Amitie>
      encouragements: Table<Encouragement>
      reactions_seance: Table<ReactionSeance>
      notifications: Table<Notification>
      annonces: Table<Annonce>
      reminder_settings: Table<ReminderSettings>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
