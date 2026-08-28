'use client'

import { useEffect, useState } from 'react'
import type { Annonce } from '@/lib/notifs'

const CLE = 'fonte-annonces-vues'

/**
 * Bandeaux d'annonce, en tête de l'accueil.
 *
 * Une annonce marquée non retirable n'a pas de croix : elle
 * reste visible même si elle avait été masquée avant que
 * l'administrateur ne change ce réglage.
 */
export function Annonces({ annonces }: { annonces: Annonce[] }) {
  const [masquees, setMasquees] = useState<string[]>([])
  const [pret, setPret] = useState(false)

  useEffect(() => {
    try {
      setMasquees(JSON.parse(localStorage.getItem(CLE) ?? '[]'))
    } catch {
      setMasquees([])
    }
    setPret(true)
  }, [])

  function masquer(id: string) {
    const suite = [...masquees, id]
    setMasquees(suite)
    try {
      localStorage.setItem(CLE, JSON.stringify(suite))
    } catch {
      // Stockage refusé : l'annonce reviendra au prochain chargement
    }
  }

  // Rien avant la lecture du stockage, sinon une annonce déjà
  // masquée réapparaîtrait le temps d'un battement.
  if (!pret) return null

  const visibles = annonces.filter(
    (a) => !a.retirable || !masquees.includes(a.id)
  )
  if (visibles.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {visibles.map((a) => (
        <div
          key={a.id}
          className={`relative rounded-carte border py-5 pl-6 pr-12 ${
            a.couleur
              ? ''
              : a.ton === 'alerte'
                ? 'border-accent/50 bg-accent/[0.07]'
                : a.ton === 'succes'
                  ? 'border-accent-2/50 bg-accent-2/[0.07]'
                  : 'border-accent-2/40 bg-verre'
          } ${a.epinglee ? 'border-2' : ''}`}
          style={
            a.couleur
              ? { borderColor: `${a.couleur}99`, background: `${a.couleur}1a` }
              : undefined
          }
        >
          {a.retirable && (
            <button
              type="button"
              onClick={() => masquer(a.id)}
              aria-label="Masquer cette annonce"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center
                         rounded-full bg-verre text-[11px] text-encre-douce
                         hover:text-encre"
            >
              ✕
            </button>
          )}

          {a.epinglee && (
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-encre-douce">
              📌 Épinglée
            </p>
          )}

          <p className="font-semibold">
            {a.icone && <span className="mr-2 text-lg">{a.icone}</span>}
            {a.titre}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-encre-douce">
            {a.corps}
          </p>

          {a.lienTexte && a.lienUrl && (
            <a
              href={a.lienUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full border border-bordure bg-verre
                         px-4 py-2 text-xs font-semibold transition-colors
                         hover:border-accent hover:text-accent"
            >
              {a.lienTexte}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
