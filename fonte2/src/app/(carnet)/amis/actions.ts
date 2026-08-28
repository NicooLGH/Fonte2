'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import type { Resultat, Signe } from '@/lib/social'

export type Reponse = { erreur?: string; succes?: string }

/* ============================================================
   Amis, réactions et encouragements
   ============================================================
   Chaque action appelle la fonction SQL correspondante. Les
   règles — être amis pour réagir, une réaction par séance, un
   encouragement par semaine — sont vérifiées en base : les
   contourner depuis le navigateur ne mènerait à rien.
   ============================================================ */

async function client() {
  return await creerClientServeur()
}

function rafraichir() {
  revalidatePath('/amis')
  revalidatePath('/')
}

export async function chercherUtilisateurs(
  requete: string
): Promise<{ resultats: Resultat[]; erreur?: string }> {
  const q = requete.trim()
  if (q.length < 2) return { resultats: [] }

  const supabase = await client()
  const { data, error } = await supabase.rpc('chercher_utilisateurs', { q })

  if (error) return { resultats: [], erreur: messageErreur(error.message) }

  const liste = (data ?? []) as Record<string, unknown>[]
  return {
    resultats: liste.map((r) => ({
      id: String(r.id ?? ''),
      pseudo: String(r.pseudo ?? ''),
      avatar: (r.avatar as string | null) ?? null,
      relation: String(r.relation ?? 'inconnu') as Resultat['relation'],
    })),
  }
}

export async function demanderAmi(cible: string): Promise<Reponse> {
  const supabase = await client()
  const { data, error } = await supabase.rpc('demander_ami', { target: cible })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  const relation = (data as { relation?: string } | null)?.relation
  return {
    succes:
      relation === 'ami' ? 'Vous êtes désormais amis' : 'Demande envoyée',
  }
}

export async function accepterAmi(demandeur: string): Promise<Reponse> {
  const supabase = await client()
  const { error } = await supabase.rpc('accepter_ami', { demandeur })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: 'Demande acceptée' }
}

export async function retirerAmi(autre: string): Promise<Reponse> {
  const supabase = await client()
  const { error } = await supabase.rpc('retirer_ami', { autre })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: 'Relation supprimée' }
}

export async function encourager(
  cible: string,
  signe: Signe
): Promise<Reponse> {
  const supabase = await client()
  const { error } = await supabase.rpc('encourager', { target: cible, signe })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: `Encouragement envoyé ${signe}` }
}

export async function reagirSeance(
  seance: string,
  signe: Signe
): Promise<Reponse> {
  const supabase = await client()
  const { error } = await supabase.rpc('reagir_seance', { seance, signe })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: `Réaction envoyée ${signe}` }
}

export async function retirerReaction(seance: string): Promise<Reponse> {
  const supabase = await client()
  const { error } = await supabase.rpc('retirer_reaction', { seance })
  if (error) return { erreur: messageErreur(error.message) }

  rafraichir()
  return { succes: 'Réaction retirée' }
}

/**
 * Signale la présence.
 *
 * Appelée à l'ouverture puis toutes les trois minutes, et
 * seulement quand l'onglet est visible : une page laissée
 * ouverte en arrière-plan ne doit pas faire passer pour
 * connecté.
 */
export async function signalerPresence(): Promise<void> {
  const supabase = await client()
  await supabase.rpc('ping_presence')
}
