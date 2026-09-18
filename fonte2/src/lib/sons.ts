/* ============================================================
   Sons
   ============================================================
   Ils sont synthétisés, pas chargés depuis des fichiers. Trois
   raisons : rien à télécharger, aucune latence au premier
   déclenchement, et un timbre cohérent — des sons trouvés
   ailleurs auraient chacun leur couleur.

   Désactivés par défaut. Une application qui émet du son sans
   prévenir se fait désinstaller vite, surtout en salle où les
   gens ont des écouteurs.
   ============================================================ */

const CLE = 'fonte-sons'

export function sonsActifs(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(CLE) === '1'
  } catch {
    return false
  }
}

export function definirSons(actifs: boolean): void {
  try {
    localStorage.setItem(CLE, actifs ? '1' : '0')
  } catch {
    // Stockage refusé : le réglage ne survivra pas à la session
  }
}

/**
 * Le contexte audio est créé au premier son, jamais avant.
 *
 * Les navigateurs refusent de le démarrer sans geste de
 * l'utilisateur, et le créer au chargement laisserait un
 * contexte suspendu qui consomme pour rien.
 */
let contexte: AudioContext | null = null

function obtenirContexte(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!contexte) {
      const Constructeur =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Constructeur) return null
      contexte = new Constructeur()
    }
    if (contexte.state === 'suspended') void contexte.resume()
    return contexte
  } catch {
    return null
  }
}

type Note = {
  frequence: number
  /** Départ, en secondes après le début */
  depart: number
  duree: number
  volume?: number
}

/**
 * Joue une suite de notes courtes.
 *
 * L'enveloppe monte en 8 ms et redescend doucement : sans cette
 * montée, le son démarre par un claquement audible.
 */
function jouer(notes: Note[]): void {
  if (!sonsActifs()) return

  const ctx = obtenirContexte()
  if (!ctx) return

  const maintenant = ctx.currentTime

  for (const note of notes) {
    const oscillateur = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillateur.type = 'sine'
    oscillateur.frequency.value = note.frequence

    const debut = maintenant + note.depart
    const fin = debut + note.duree
    const volume = note.volume ?? 0.16

    gain.gain.setValueAtTime(0, debut)
    gain.gain.linearRampToValueAtTime(volume, debut + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, fin)

    oscillateur.connect(gain)
    gain.connect(ctx.destination)
    oscillateur.start(debut)
    oscillateur.stop(fin + 0.02)
  }
}

/* ============================================================
   Les sons du carnet
   ============================================================ */

/** Série validée : une note brève et nette. */
export function sonValide(): void {
  jouer([{ frequence: 880, depart: 0, duree: 0.09, volume: 0.12 }])
}

/** Valeur manquante : deux notes basses et descendantes. */
export function sonRefus(): void {
  jouer([
    { frequence: 260, depart: 0, duree: 0.08, volume: 0.13 },
    { frequence: 200, depart: 0.07, duree: 0.11, volume: 0.13 },
  ])
}

/**
 * Fin du repos : trois notes montantes, un peu plus fortes.
 *
 * C'est le seul son qui a une utilité réelle — on n'a pas à
 * regarder l'écran pour savoir que c'est reparti.
 */
export function sonFinRepos(): void {
  jouer([
    { frequence: 660, depart: 0, duree: 0.1, volume: 0.2 },
    { frequence: 880, depart: 0.1, duree: 0.1, volume: 0.2 },
    { frequence: 1100, depart: 0.2, duree: 0.16, volume: 0.22 },
  ])
}

/** Exercice terminé : deux notes, comme une page qu'on tourne. */
export function sonExerciceSuivant(): void {
  jouer([
    { frequence: 520, depart: 0, duree: 0.08, volume: 0.11 },
    { frequence: 700, depart: 0.08, duree: 0.12, volume: 0.11 },
  ])
}

/** Séance enregistrée : un accord ascendant. */
export function sonSeanceFinie(): void {
  jouer([
    { frequence: 523, depart: 0, duree: 0.14, volume: 0.16 },
    { frequence: 659, depart: 0.11, duree: 0.14, volume: 0.16 },
    { frequence: 784, depart: 0.22, duree: 0.24, volume: 0.18 },
  ])
}

/**
 * Vibration courte, indépendante du son.
 *
 * Elle reste active même sons coupés : c'est discret, ça ne
 * dérange personne autour, et en salle c'est souvent le seul
 * retour perceptible.
 */
export function vibrer(duree = 12): void {
  try {
    navigator.vibrate?.(duree)
  } catch {
    // Non gérée : on s'en passe
  }
}
