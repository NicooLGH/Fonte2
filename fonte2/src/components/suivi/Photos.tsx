'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Modale } from '@/components/ui/Modale'
import { libelleCourt } from '@/lib/semaine'
import { envoyerPhoto, lienPhoto, supprimerPhoto } from '@/lib/photos'
import { marquerPhoto } from '@/app/(carnet)/suivi/actions'
import type { ReleveComplet } from '@/lib/suivi'

/* ============================================================
   Photos de progression
   ============================================================
   Une par semaine. Elles ne sortent jamais du carnet : ni sur le
   profil, ni entre amis. Les chiffres racontent une partie de
   l'histoire, l'image raconte le reste — mais elle est plus
   personnelle encore que les mensurations.
   ============================================================ */

export function PhotoSemaine({
  userId,
  semaine,
  aUnePhoto,
}: {
  userId: string
  semaine: string
  aUnePhoto: boolean
}) {
  const champ = useRef<HTMLInputElement>(null)
  const [presente, setPresente] = useState(aUnePhoto)
  const [ouverte, setOuverte] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  const [envoi, setEnvoi] = useState(false)

  async function choisir(fichier: File | undefined) {
    if (!fichier) return
    setErreur(null)
    setEnvoi(true)

    const r = await envoyerPhoto(userId, semaine, fichier)
    setEnvoi(false)

    if (r.erreur) {
      setErreur(r.erreur)
      return
    }

    setPresente(true)
    demarrer(async () => {
      await marquerPhoto(semaine, true)
    })
  }

  function retirer() {
    if (!confirm('Supprimer la photo de cette semaine ?')) return
    setErreur(null)
    demarrer(async () => {
      const r = await supprimerPhoto(userId, semaine)
      if (r.erreur) {
        setErreur(r.erreur)
        return
      }
      setPresente(false)
      await marquerPhoto(semaine, false)
    })
  }

  return (
    <div>
      <input
        ref={champ}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void choisir(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {erreur && (
        <p className="mb-3 font-mono text-[11px] text-accent">{erreur}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {presente && (
          <button
            type="button"
            onClick={() => setOuverte(true)}
            className="appui rounded-bloc bg-verre px-4 py-2.5 text-xs font-semibold
                       transition-colors hover:bg-verre-fort"
          >
            Voir la photo
          </button>
        )}

        <button
          type="button"
          disabled={envoi || enCours}
          onClick={() => champ.current?.click()}
          className="appui rounded-bloc bg-verre px-4 py-2.5 text-xs font-semibold
                     text-encre-douce transition-colors hover:bg-verre-fort
                     hover:text-encre disabled:opacity-50"
        >
          {envoi
            ? 'Envoi…'
            : presente
              ? 'Remplacer'
              : 'Ajouter une photo'}
        </button>

        {presente && (
          <button
            type="button"
            disabled={enCours}
            onClick={retirer}
            className="appui rounded-bloc px-4 py-2.5 text-xs font-semibold
                       text-encre-douce transition-colors hover:text-accent"
          >
            Supprimer
          </button>
        )}
      </div>

      <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-encre-douce">
        Prise dans les mêmes conditions chaque semaine, elle rend la
        progression bien plus lisible que les chiffres seuls. Elle ne quitte
        jamais ton carnet.
      </p>

      <Modale
        titre={`Semaine ${libelleCourt(semaine)}`}
        ouverte={ouverte}
        onFermer={() => setOuverte(false)}
      >
        <Photo userId={userId} semaine={semaine} />
      </Modale>
    </div>
  )
}

/* ============================================================
   Comparaison
   ============================================================ */

export function Comparaison({
  userId,
  releves,
}: {
  userId: string
  releves: ReleveComplet[]
}) {
  const avecPhoto = releves
    .filter((r) => r.aPhoto)
    .sort((a, b) => a.semaine.localeCompare(b.semaine))

  const [gauche, setGauche] = useState(avecPhoto[0]?.semaine ?? '')
  const [droite, setDroite] = useState(
    avecPhoto[avecPhoto.length - 1]?.semaine ?? ''
  )

  if (avecPhoto.length < 2)
    return (
      <p className="text-sm italic text-encre-douce">
        Ajoute une photo sur au moins deux semaines pour les comparer.
      </p>
    )

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Choix
          valeur={gauche}
          options={avecPhoto}
          onChange={setGauche}
          libelle="Semaine de gauche"
        />
        <Choix
          valeur={droite}
          options={avecPhoto}
          onChange={setDroite}
          libelle="Semaine de droite"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Cote userId={userId} semaine={gauche} releves={releves} />
        <Cote userId={userId} semaine={droite} releves={releves} />
      </div>
    </div>
  )
}

function Choix({
  valeur,
  options,
  onChange,
  libelle,
}: {
  valeur: string
  options: ReleveComplet[]
  onChange: (v: string) => void
  libelle: string
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{libelle}</span>
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-bloc border border-bordure bg-verre px-4 py-2.5
                   text-sm focus:border-accent focus:outline-none"
      >
        {options.map((r) => (
          <option key={r.semaine} value={r.semaine}>
            {libelleCourt(r.semaine)} · {r.date}
          </option>
        ))}
      </select>
    </label>
  )
}

function Cote({
  userId,
  semaine,
  releves,
}: {
  userId: string
  semaine: string
  releves: ReleveComplet[]
}) {
  const releve = releves.find((r) => r.semaine === semaine)

  return (
    <div>
      <Photo userId={userId} semaine={semaine} />
      <p className="mt-2 font-mono text-[10.5px] text-encre-douce">
        {libelleCourt(semaine)}
        {releve?.poids != null && ` · ${releve.poids} kg`}
      </p>
    </div>
  )
}

/* ============================================================
   Affichage d'une photo
   ============================================================ */

function Photo({ userId, semaine }: { userId: string; semaine: string }) {
  const [lien, setLien] = useState<string | null>(null)
  const [echec, setEchec] = useState(false)

  useEffect(() => {
    let vivant = true
    setLien(null)
    setEchec(false)

    // Le rangement est privé : il faut demander un lien signé,
    // valable une heure. Il n'existe pas d'adresse permanente.
    void lienPhoto(userId, semaine).then((url) => {
      if (!vivant) return
      if (url) setLien(url)
      else setEchec(true)
    })

    return () => {
      vivant = false
    }
  }, [userId, semaine])

  if (echec)
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-bloc bg-verre">
        <p className="px-4 text-center font-mono text-[10.5px] text-encre-douce">
          Photo introuvable
        </p>
      </div>
    )

  if (!lien)
    return <div className="aspect-[3/4] animate-pulse rounded-bloc bg-verre-fort" />

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-bloc bg-verre">
      {/* `unoptimized` parce que le lien est signé et temporaire :
          l'optimiseur de Next mettrait en cache une adresse qui
          expire au bout d'une heure. */}
      <Image
        src={lien}
        alt={`Photo de la semaine ${libelleCourt(semaine)}`}
        fill
        unoptimized
        sizes="(max-width: 640px) 50vw, 300px"
        className="object-cover"
      />
    </div>
  )
}
