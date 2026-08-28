/**
 * Traduction des erreurs Supabase.
 *
 * Elles arrivent en anglais et parlent le langage du système
 * (« invalid credentials », « rate limit exceeded »). On les
 * remplace par ce que la personne a besoin de savoir : ce qui
 * s'est passé, et quoi faire ensuite.
 */
export function messageErreur(brut: string | undefined | null): string {
  const m = (brut ?? '').toLowerCase()

  // --- Connexion ---
  if (m.includes('invalid login credentials'))
    return 'Adresse ou mot de passe incorrect.'
  if (m.includes('email not confirmed'))
    return "Ton adresse n'est pas encore confirmée. Regarde tes emails."
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Un compte existe déjà avec cette adresse.'

  // --- Mot de passe ---
  if (m.includes('password should be at least'))
    return 'Le mot de passe doit faire au moins 8 caractères.'
  if (m.includes('weak password') || m.includes('password is too weak'))
    return 'Mot de passe trop simple. Ajoute des chiffres ou des majuscules.'
  if (m.includes('same as the old password') || m.includes('should be different'))
    return "C'est déjà ton mot de passe actuel."

  // --- Adresse ---
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'Cette adresse email ne semble pas valide.'

  // --- Limites d'envoi ---
  // Le palier gratuit de Supabase n'envoie que deux emails par
  // heure : mieux vaut le dire clairement que laisser chercher.
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Trop de tentatives. Réessaie dans quelques minutes.'
  if (m.includes('for security purposes'))
    return 'Patiente une minute avant de réessayer.'

  // --- Règles posées en base ---
  if (m.includes('pseudo est déjà pris') || m.includes('profiles_pseudo_unique'))
    return 'Ce pseudo est déjà pris.'
  if (m.includes('entre 2 et 24'))
    return 'Le pseudo doit faire entre 2 et 24 caractères.'
  if (m.includes('lettres, chiffres'))
    return 'Lettres, chiffres, espaces, tirets et points uniquement.'
  if (m.includes('prochain changement possible'))
    return brut ?? 'Changement de pseudo impossible pour le moment.'

  // --- Réseau ---
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Connexion impossible. Vérifie ton accès à internet.'

  return brut || 'Une erreur est survenue.'
}

/**
 * Règles du pseudo, vérifiées ici pour un retour immédiat.
 * La base les revérifie de toute façon : c'est elle qui décide.
 */
export const REGLES_PSEUDO =
  'Entre 2 et 24 caractères. Lettres, chiffres, espaces, tirets et points.'

export function validerPseudo(v: string): string | null {
  const p = v.trim()
  if (p.length < 2) return 'Le pseudo doit faire au moins 2 caractères.'
  if (p.length > 24) return 'Le pseudo ne peut pas dépasser 24 caractères.'
  if (!/^[A-Za-z0-9 _.-]+$/.test(p))
    return 'Lettres, chiffres, espaces, tirets et points uniquement.'
  return null
}
