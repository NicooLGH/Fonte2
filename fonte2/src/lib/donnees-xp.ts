import 'server-only'

import { creerClientServeur } from './supabase/server'
import type { GainXP, PageJournal, SourceXP, XPSeance } from './xp'
import type { EtatBadge } from './badges'

/* ============================================================
   XP — lecture côté serveur
   ============================================================
   Le total et le journal sont calculés par la base. Si quelque
   chose a changé depuis la dernière lecture (séance ajoutée,
   relevé supprimé…), la base refait le calcul avant de
   répondre : on lit donc toujours un chiffre à jour.
   ============================================================ */

const SOURCES: SourceXP[] = ['serie', 'seance', 'record', 'releve', 'semaine', 'badge']

type Brut = Record<string, unknown>

export function lireGain(g: Brut): GainXP {
  const source = String(g.source ?? '') as SourceXP
  return {
    source: SOURCES.includes(source) ? source : 'seance',
    libelle: String(g.libelle ?? ''),
    montant: Number(g.montant) || 0,
    date: String(g.date ?? ''),
    semaine: String(g.semaine ?? ''),
    badge: typeof g.badge === 'string' ? g.badge : null,
    palier: g.palier == null ? null : Number(g.palier),
  }
}

/** Mon total d'XP. 0 si le SQL de l'XP n'est pas encore installé. */
export async function chargerMonXP(): Promise<number> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('mon_xp')
  if (error) return 0
  return Number(data) || 0
}

/**
 * Le journal, par paquets de six semaines.
 * `avant` : la plus ancienne semaine déjà affichée.
 */
export async function chargerJournal(avant: string | null = null): Promise<PageJournal> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('mon_journal_xp', {
    avant,
    nb: 6,
  })
  if (error || !data) return { entrees: [], suite: false }

  const brut = data as { entrees?: unknown; suite?: unknown }
  return {
    entrees: Array.isArray(brut.entrees) ? (brut.entrees as Brut[]).map(lireGain) : [],
    suite: brut.suite === true,
  }
}

/** Ce qu'une séance vient de rapporter, pour le récapitulatif. */
export async function chargerXPSeance(seanceId: string): Promise<XPSeance | null> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('xp_de_seance', { seance: seanceId })
  if (error || !data) return null

  const brut = data as { total?: unknown; gains?: unknown }
  return {
    total: Number(brut.total) || 0,
    gains: Array.isArray(brut.gains) ? (brut.gains as Brut[]).map(lireGain) : [],
  }
}

/**
 * Badges d'une personne : la mienne, ou celle d'un ami.
 * null si la base refuse (pas amis) ou si le SQL des badges
 * n'est pas encore installé.
 */
export async function chargerBadges(cible: string): Promise<EtatBadge[] | null> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('badges_de', { target: cible })
  if (error || !Array.isArray(data)) return null

  return (data as Brut[]).map((b) => ({
    id: String(b.id ?? ''),
    valeur: Number(b.valeur) || 0,
    dates: Array.isArray(b.dates)
      ? (b.dates as unknown[]).map((d) => (typeof d === 'string' ? d : null))
      : [],
  }))
}
