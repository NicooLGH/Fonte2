import 'server-only'

import { creerClientServeur } from './supabase/server'
import type {
  ListeAmis,
  PublicationSeance,
  ProfilPublic,
  Signal,
  Signe,
} from './social'

/* ============================================================
   Lecture du volet social — serveur uniquement
   ============================================================
   Tout passe par les fonctions SQL écrites pour l'ancien
   carnet : `mes_amis`, `fil_amis`, `get_profile`… Elles portent
   les règles de confidentialité, et elles n'ont pas bougé.

   On se contente ici de convertir leur sortie en objets typés.
   ============================================================ */

type Brut = Record<string, unknown>

function texte(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
function nombre(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function texteOuNull(v: unknown): string | null {
  return typeof v === 'string' && v !== '' ? v : null
}

export async function chargerAmis(): Promise<ListeAmis> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('mes_amis')

  if (error || !data) return { amis: [], attente: [], envoyes: [], actifsSemaine: 0 }

  const d = data as Brut
  const liste = (d.amis ?? []) as Brut[]

  return {
    amis: liste.map((a) => ({
      id: texte(a.id),
      pseudo: texte(a.pseudo),
      avatar: texteOuNull(a.avatar),
      streak: nombre(a.streak),
      actifSemaine: Boolean(a.actif_semaine),
      amiDepuis: texteOuNull(a.ami_depuis),
      presenceSec:
        a.presence_sec === null || a.presence_sec === undefined
          ? null
          : nombre(a.presence_sec),
    })),
    attente: ((d.attente ?? []) as Brut[]).map((p) => ({
      id: texte(p.id),
      pseudo: texte(p.pseudo),
      avatar: texteOuNull(p.avatar),
    })),
    envoyes: ((d.envoyes ?? []) as Brut[]).map((p) => ({
      id: texte(p.id),
      pseudo: texte(p.pseudo),
      avatar: texteOuNull(p.avatar),
    })),
    actifsSemaine: nombre(d.actifs_semaine),
  }
}

function versPublication(f: Brut): PublicationSeance {
  return {
    seanceId: texte(f.seance_id ?? f.id),
    auteurId: texte(f.auteur_id),
    pseudo: texte(f.pseudo),
    avatar: texteOuNull(f.avatar),
    date: texte(f.date),
    note: texteOuNull(f.note),
    dureeSec:
      f.duree_sec === null || f.duree_sec === undefined
        ? null
        : nombre(f.duree_sec),
    volume: nombre(f.volume),
    blocs: ((f.blocs ?? []) as Brut[]).map((b) => ({
      nom: texte(b.nom),
      volume: nombre(b.volume),
      series: ((b.series ?? []) as Brut[]).map((s) => ({
        poids: nombre(s.poids),
        reps: nombre(s.reps),
      })),
    })),
    reactions: (f.reactions ?? {}) as Record<string, number>,
    maReaction: (texteOuNull(f.ma_reaction) as Signe | null) ?? null,
  }
}

export async function chargerFil(): Promise<PublicationSeance[]> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('fil_amis')
  if (error || !data) return []
  return (data as Brut[]).map(versPublication)
}

/**
 * Réactions et encouragements reçus, fondus en un seul flux.
 *
 * Deux listes séparées allongeaient l'accueil sans rien
 * apporter : c'est le même geste social.
 */
export async function chargerSignaux(): Promise<Signal[]> {
  const supabase = await creerClientServeur()

  const [reactions, encouragements] = await Promise.all([
    supabase.rpc('mes_reactions'),
    supabase.rpc('mes_encouragements'),
  ])

  const signaux: Signal[] = []

  for (const r of (reactions.data ?? []) as Brut[]) {
    signaux.push({
      type: 'reaction',
      pseudo: texte(r.pseudo),
      signe: texte(r.signe) as Signe,
      date: texte(r.date),
      detail: `a réagi à ta séance du ${texte(r.seance_date)}`,
    })
  }

  const enc = (encouragements.data ?? {}) as Brut
  for (const e of (enc.recus ?? []) as Brut[]) {
    signaux.push({
      type: 'encouragement',
      pseudo: texte(e.pseudo),
      signe: texte(e.signe) as Signe,
      date: texte(e.date),
      detail: "t'encourage cette semaine",
    })
  }

  return signaux.sort((a, b) => b.date.localeCompare(a.date))
}

/** Encouragements déjà envoyés cette semaine, par destinataire. */
export async function chargerEncouragementsEnvoyes(): Promise<
  Record<string, Signe>
> {
  const supabase = await creerClientServeur()
  const { data } = await supabase.rpc('mes_encouragements')
  const d = (data ?? {}) as Brut
  return (d.envoyes ?? {}) as Record<string, Signe>
}

function versProfil(d: Brut): ProfilPublic {
  const base: ProfilPublic = {
    id: texte(d.id),
    pseudo: texte(d.pseudo),
    avatar: texteOuNull(d.avatar),
    streak: nombre(d.streak),
    relation: texte(d.relation) as ProfilPublic['relation'],
    amiDepuis: texteOuNull(d.ami_depuis),
    presenceSec:
      d.presence_sec === null || d.presence_sec === undefined
        ? null
        : nombre(d.presence_sec),
    detail: Boolean(d.detail),
  }

  if (!base.detail) return base

  return {
    ...base,
    semaines: nombre(d.semaines),
    exercices: nombre(d.exercices),
    volume: nombre(d.volume),
    records: ((d.records ?? []) as Brut[]).map((r) => ({
      exercice: texte(r.exercice),
      poids: nombre(r.poids),
    })),
    partageSeances: Boolean(d.partage_seances),
    seances: ((d.seances ?? []) as Brut[]).map(versPublication),
  }
}

export async function chargerProfil(id: string): Promise<ProfilPublic | null> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('get_profile', { target: id })
  if (error || !data) return null
  return versProfil(data as Brut)
}

export async function chargerProfilParPseudo(
  pseudo: string
): Promise<ProfilPublic | null> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('get_profile_par_pseudo', {
    p: pseudo,
  })
  if (error || !data) return null
  return versProfil(data as Brut)
}
