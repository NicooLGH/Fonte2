'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'

/* ============================================================
   Le verrou de l'administration
   ============================================================
   Le code est vérifié en base, jamais dans le navigateur. Une
   fois validé, un cookie garde l'accès ouvert une demi-heure —
   assez pour publier une annonce, trop court pour laisser la
   porte ouverte si le téléphone traîne.

   Le cookie est marqué `httpOnly` : aucun script de la page ne
   peut le lire ni le fabriquer.
   ============================================================ */

const COOKIE = 'fonte-admin'
const DUREE = 30 * 60

export type Reponse = { erreur?: string; succes?: string }

export async function accesOuvert(): Promise<boolean> {
  const boite = await cookies()
  return boite.get(COOKIE)?.value === '1'
}

/** Y a-t-il un code à saisir, ou l'accès est-il direct ? */
export async function codeRequis(): Promise<boolean> {
  const supabase = await creerClientServeur()
  const { data } = await supabase.rpc('a_code_admin')
  return Boolean(data)
}

/**
 * Le premier paramètre est l'état précédent : `useActionState`
 * le passe systématiquement, avant le formulaire.
 */
export async function deverrouiller(
  _precedent: Reponse,
  donnees: FormData
): Promise<Reponse> {
  const code = String(donnees.get('code') ?? '').trim()

  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('verifier_code_admin', {
    p_code: code,
  })

  if (error) return { erreur: "Vérification impossible pour l'instant." }
  if (!data) return { erreur: 'Code incorrect.' }

  const boite = await cookies()
  boite.set(COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DUREE,
  })

  revalidatePath('/admin')
  return { succes: 'Accès ouvert' }
}

export async function verrouiller(): Promise<void> {
  const boite = await cookies()
  boite.delete(COOKIE)
  revalidatePath('/admin')
}

/** Définit ou retire le code, depuis les réglages. */
export async function definirCode(donnees: FormData): Promise<Reponse> {
  const code = String(donnees.get('code') ?? '').trim()

  if (code !== '' && !/^[0-9]{4,8}$/.test(code))
    return { erreur: 'Le code doit contenir entre 4 et 8 chiffres.' }

  const supabase = await creerClientServeur()
  const { error } = await supabase.rpc('definir_code_admin', { p_code: code })

  if (error) return { erreur: error.message }

  // Changer le code referme l'accès : sinon la session en cours
  // resterait ouverte avec l'ancien.
  const boite = await cookies()
  boite.delete(COOKIE)

  revalidatePath('/', 'layout')
  return { succes: code === '' ? 'Code retiré' : 'Code enregistré' }
}
