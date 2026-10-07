'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { creerClientServeur } from '@/lib/supabase/server'
import { messageErreur, validerPseudo } from '@/lib/messages'

/**
 * Ces fonctions s'exécutent sur le serveur, jamais dans le
 * navigateur. C'est la différence de fond avec l'ancien carnet :
 * le mot de passe ne transite plus par du code client, et la
 * session est posée directement dans un cookie sécurisé.
 */

export type Etat = { erreur?: string; succes?: string }

/** Adresse du site, pour les liens envoyés par email. */
async function origine(): Promise<string> {
  const h = await headers()
  const hote = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const protocole = hote.startsWith('localhost') ? 'http' : 'https'
  return `${protocole}://${hote}`
}

export async function seConnecter(
  _precedent: Etat,
  donnees: FormData
): Promise<Etat> {
  const email = String(donnees.get('email') ?? '').trim()
  const motDePasse = String(donnees.get('motDePasse') ?? '')

  if (!email || !motDePasse) return { erreur: 'Remplis les deux champs.' }

  const supabase = await creerClientServeur()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  })

  if (error) return { erreur: messageErreur(error.message) }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function sInscrire(
  _precedent: Etat,
  donnees: FormData
): Promise<Etat> {
  const email = String(donnees.get('email') ?? '').trim()
  const motDePasse = String(donnees.get('motDePasse') ?? '')

  if (motDePasse.length < 8)
    return { erreur: 'Le mot de passe doit faire au moins 8 caractères.' }

  const supabase = await creerClientServeur()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { emailRedirectTo: `${await origine()}/auth/callback` },
  })

  if (error) return { erreur: messageErreur(error.message) }

  // Si la confirmation par email est désactivée dans Supabase,
  // la session existe déjà : on enchaîne sans passer par la boîte
  // mail.
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/bienvenue')
  }

  return {
    succes:
      'Compte créé. Ouvre le lien de confirmation envoyé à ton adresse pour continuer.',
  }
}

export async function envoyerReinitialisation(
  _precedent: Etat,
  donnees: FormData
): Promise<Etat> {
  const email = String(donnees.get('email') ?? '').trim()
  if (!email) return { erreur: 'Indique ton adresse email.' }

  const supabase = await creerClientServeur()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origine()}/auth/callback?suite=/reglages`,
  })

  if (error) return { erreur: messageErreur(error.message) }

  // On confirme sans dire si l'adresse existe : sinon le
  // formulaire devient un moyen de vérifier qui est inscrit.
  return {
    succes:
      'Si un compte existe avec cette adresse, un lien vient de partir.',
  }
}

export async function seDeconnecter() {
  const supabase = await creerClientServeur()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/connexion')
}

/**
 * Choix du pseudo et de l'avatar, à la première connexion.
 *
 * Le pseudo passe par la fonction `set_pseudo` : c'est elle qui
 * garantit l'unicité et la limite d'un changement par mois. Le
 * vérifier ici ne servirait qu'au confort d'affichage.
 */
export async function finirBienvenue(
  _precedent: Etat,
  donnees: FormData
): Promise<Etat> {
  const pseudo = String(donnees.get('pseudo') ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  const avatar = String(donnees.get('avatar') ?? '💪').slice(0, 16)

  // 3.0 : rythme, objectif et expérience, tous facultatifs.
  const rythme = Number(donnees.get('rythme'))
  const objectif = String(donnees.get('objectif') ?? '')
  const experience = String(donnees.get('experience') ?? '')
  const suite = String(donnees.get('suite') ?? 'accueil')

  const souci = validerPseudo(pseudo)
  if (souci) return { erreur: souci }

  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { error: erreurPseudo } = await supabase.rpc('set_pseudo', {
    new_pseudo: pseudo,
  })
  if (erreurPseudo) return { erreur: messageErreur(erreurPseudo.message) }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar, onboarded: true, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { erreur: messageErreur(error.message) }

  // Les réponses du questionnaire : enregistrées à part, pour ne
  // pas bloquer l'arrivée si le SQL de la session 7 manque encore.
  await supabase
    .from('profiles')
    .update({
      rythme: Number.isInteger(rythme) && rythme >= 1 && rythme <= 7 ? rythme : null,
      objectif_principal: ['muscle', 'force', 'forme'].includes(objectif) ? objectif : null,
      experience: ['debutant', 'moyen', 'confirme'].includes(experience) ? experience : null,
    })
    .eq('id', user.id)

  revalidatePath('/', 'layout')

  if (suite === 'guidee') {
    const modele = await preparerPremiereSeance(objectif)
    if (modele) redirect(`/live?modele=${modele}&guide=1`)
  }
  redirect('/')
}

/* ---- Première séance guidée ---- */

type Depart = { nom: string; groupe: string }

const DEPARTS: Record<string, Depart[]> = {
  muscle: [
    { nom: 'Squat', groupe: 'jambes' },
    { nom: 'Développé couché', groupe: 'pectoraux' },
    { nom: 'Rowing barre', groupe: 'dos' },
    { nom: 'Développé militaire', groupe: 'epaules' },
  ],
  force: [
    { nom: 'Squat', groupe: 'jambes' },
    { nom: 'Développé couché', groupe: 'pectoraux' },
    { nom: 'Soulevé de terre', groupe: 'dos' },
    { nom: 'Développé militaire', groupe: 'epaules' },
  ],
  forme: [
    { nom: 'Squat goblet', groupe: 'jambes' },
    { nom: 'Pompes', groupe: 'pectoraux' },
    { nom: 'Tirage horizontal', groupe: 'dos' },
    { nom: 'Fentes', groupe: 'jambes' },
  ],
}

/**
 * Prépare un modèle « Première séance » : quatre exercices de
 * base selon l'objectif, créés seulement si le carnet est vide.
 * Renvoie l'identifiant du modèle, ou null.
 */
async function preparerPremiereSeance(objectif: string): Promise<string | null> {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existants } = await supabase.from('exercices').select('id').limit(4)
  let ids = (existants ?? []).map((e) => e.id as string)

  if (ids.length === 0) {
    const liste = DEPARTS[objectif] ?? DEPARTS.muscle
    const { data, error } = await supabase
      .from('exercices')
      .insert(liste.map((e) => ({ user_id: user.id, name: e.nom, groupe: e.groupe })))
      .select('id')
    if (error || !data) return null
    ids = data.map((e) => e.id as string)
  }

  const { data: modele, error } = await supabase
    .from('modeles')
    .insert({
      user_id: user.id,
      nom: 'Première séance',
      exercices: ids.map((id) => ({ id, alternatives: [] })),
    })
    .select('id')
    .single()
  if (error || !modele) return null
  return modele.id as string
}
