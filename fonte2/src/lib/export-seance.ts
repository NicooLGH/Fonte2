import { meilleur1RM } from './rm'
import type { SeanceComplete, Exercice } from './carnet'

/* ============================================================
   Export d'une séance en texte
   ============================================================
   Un fichier lisible tel quel, sans logiciel particulier : on
   l'ouvre dans un bloc-notes, on le colle dans un message, on
   l'imprime. C'est ce qui manque au JSON, complet mais
   illisible.
   ============================================================ */

function duree(sec: number | null): string | null {
  if (!sec) return null
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

export function seanceEnTexte(
  seance: SeanceComplete,
  exercices: Exercice[],
  pseudo: string
): string {
  const nomDe = (id: string) =>
    exercices.find((e) => e.id === id)?.nom ?? 'Exercice supprimé'

  const lignes: string[] = []
  const trait = '='.repeat(44)

  lignes.push(trait)
  lignes.push(`FONTE — Séance du ${seance.date}`)
  lignes.push(pseudo)
  lignes.push(trait)
  lignes.push('')

  let volumeTotal = 0
  let seriesTotal = 0

  for (const b of seance.blocs) {
    const volume = b.series.reduce((t, x) => t + x.poids * x.reps, 0)
    volumeTotal += volume
    seriesTotal += b.series.length

    lignes.push(nomDe(b.exerciceId).toUpperCase())

    b.series.forEach((x, i) => {
      lignes.push(`  ${i + 1}.  ${x.poids} kg × ${x.reps} rep`)
    })

    const rm = meilleur1RM(b.series)
    lignes.push(
      `      volume ${Math.round(volume)} kg` +
        (rm !== null ? ` · 1RM estimé ${rm} kg` : '')
    )
    lignes.push('')
  }

  lignes.push('-'.repeat(44))
  lignes.push(`Volume total   ${Math.round(volumeTotal)} kg`)
  lignes.push(`Séries         ${seriesTotal}`)
  lignes.push(`Exercices      ${seance.blocs.length}`)

  const d = duree(seance.dureeSec)
  if (d) lignes.push(`Durée          ${d}`)

  if (seance.note) {
    lignes.push('')
    lignes.push('Note')
    // Une note sur plusieurs lignes garde son retrait.
    for (const l of seance.note.split('\n')) lignes.push(`  ${l}`)
  }

  lignes.push('')
  return lignes.join('\n')
}

export function telechargerTexte(contenu: string, nom: string): void {
  const blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  lien.click()

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Partage la séance, ou la télécharge si le partage n'existe pas. */
export async function partagerTexte(
  contenu: string,
  nom: string,
  titre: string
): Promise<void> {
  const fichier = new File([contenu], nom, { type: 'text/plain' })

  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: titre })
      return
    } catch {
      // Partage annulé
      return
    }
  }

  telechargerTexte(contenu, nom)
}
