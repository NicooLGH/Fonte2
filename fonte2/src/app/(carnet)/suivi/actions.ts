'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur } from '@/lib/messages'
import { cleSemaine, aujourdhui } from '@/lib/semaine'
import { estDimanche } from '@/lib/xp'
import type { CleSuivi, Objectifs } from '@/lib/suivi'

export type Reponse = { erreur?: string; succes?: string }

async function moi() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

function valeurOuNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const CLES: CleSuivi[] = [
  'poids',
  'calories',
  'pec',
  'bras',
  'epaule',
  'jambe',
  'taille',
]

/**
 * Enregistre le relevé de la semaine en cours.
 *
 * Un seul par semaine, garanti en base. Le bonus du dimanche
 * n'est attribué qu'à la création : rouvrir le formulaire un
 * dimanche ne doit pas permettre de l'obtenir après coup.
 */
export async function enregistrerReleve(donnees: FormData): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const semaine = cleSemaine()
  const valeurs = Object.fromEntries(
    CLES.map((c) => [c, valeurOuNull(donnees.get(c))])
  )
  const note = String(donnees.get('note') ?? '').trim() || null

  if (CLES.every((c) => valeurs[c] === null))
    return { erreur: 'Renseigne au moins une valeur.' }

  const { data: existant } = await supabase
    .from('suivi')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_key', semaine)
    .maybeSingle()

  if (existant) {
    const { error } = await supabase
      .from('suivi')
      .update({ ...valeurs, note })
      .eq('id', existant.id as string)

    if (error) return { erreur: messageErreur(error.message) }
    revalidatePath('/suivi')
    revalidatePath('/')
    return { succes: 'Relevé mis à jour' }
  }

  const { error } = await supabase.from('suivi').insert({
    user_id: user.id,
    date: aujourdhui(),
    week_key: semaine,
    bonus_dimanche: estDimanche(),
    note,
    ...valeurs,
  })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/suivi')
  revalidatePath('/')
  return { succes: 'Relevé enregistré' }
}

export async function supprimerReleve(id: string): Promise<Reponse> {
  const { supabase } = await moi()
  const { error } = await supabase.from('suivi').delete().eq('id', id)
  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/suivi')
  revalidatePath('/')
  return { succes: 'Relevé supprimé' }
}

/**
 * Objectifs.
 *
 * Écrits dans `mensu`, et recopiés dans `suivi` pour le poids et
 * le tour de taille : l'ancien carnet lit encore cette colonne,
 * et les deux versions partagent la même base.
 */
export async function enregistrerObjectifs(
  donnees: FormData
): Promise<Reponse> {
  const { supabase, user } = await moi()
  if (!user) return { erreur: 'Session expirée.' }

  const objectifs: Objectifs = {}
  for (const cle of CLES) {
    if (cle === 'calories') continue
    const v = valeurOuNull(donnees.get(cle))
    if (v !== null) objectifs[cle] = v
  }

  const pourSuivi: Record<string, number> = {}
  if (objectifs.poids !== undefined) pourSuivi.poids = objectifs.poids
  if (objectifs.taille !== undefined) pourSuivi.taille = objectifs.taille

  const { error } = await supabase.from('objectifs').upsert({
    user_id: user.id,
    mensu: objectifs,
    suivi: pourSuivi,
    updated_at: new Date().toISOString(),
  })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/suivi')
  revalidatePath('/analyse')
  return { succes: 'Objectifs enregistrés' }
}
