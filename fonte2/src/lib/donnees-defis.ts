import 'server-only'

import { creerClientServeur } from './supabase/server'
import {
  lireBadge,
  lireBadgesDefis,
  lireDefi,
  type BadgesDefis,
  type Defi,
  type DefiAdmin,
  type Objectif,
} from './defis'

/* ============================================================
   Défis — lecture côté serveur
   ============================================================
   Chaque fonction renvoie une valeur vide si le SQL des défis
   n'est pas encore installé : les pages ne doivent pas casser.
   ============================================================ */

/** Défis en cours, du plus récent au plus ancien. */
export async function chargerDefisEnCours(): Promise<Defi[]> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('defis_en_cours')
  if (error || !Array.isArray(data)) return []
  return data.map(lireDefi).filter((d): d is Defi => d !== null)
}

/** Une édition précise, en cours ou terminée. */
export async function chargerDefi(edition: string): Promise<Defi | null> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('defi_detail', { e_id: edition })
  if (error) return null
  return lireDefi(data)
}

/** Badges de défis d'une personne (la mienne ou celle d'un ami). */
export async function chargerBadgesDefis(cible: string): Promise<BadgesDefis | null> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('defis_badges_de', { target: cible })
  if (error) return null
  return lireBadgesDefis(data)
}

/** Liste de l'admin. Vide pour un non-admin (la base refuse). */
export async function chargerDefisAdmin(): Promise<DefiAdmin[]> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('defis_admin')
  if (error || !Array.isArray(data)) return []

  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id),
    titre: String(d.titre ?? ''),
    description: String(d.description ?? ''),
    type: d.type === 'honneur' ? 'honneur' : 'verifie',
    portee: d.portee === 'collectif' ? 'collectif' : 'individuel',
    objectif: String(d.objectif) as Objectif,
    valeur: Number(d.valeur) || 0,
    xp: Number(d.xp) || 0,
    duree: d.duree === 'jours' || d.duree === 'dates' ? d.duree : 'dimanche',
    dureeJours: d.duree_jours == null ? null : Number(d.duree_jours),
    debut: String(d.debut ?? ''),
    fin: typeof d.fin === 'string' ? d.fin : null,
    repetition: d.repetition === 'semaine' || d.repetition === 'mois' ? d.repetition : 'aucune',
    badge: lireBadge(d.badge),
    annonce: d.annonce !== false,
    statut: d.statut === 'brouillon' || d.statut === 'archive' ? d.statut : 'publie',
    editionFin: typeof d.edition_fin === 'string' ? d.edition_fin : null,
  }))
}
