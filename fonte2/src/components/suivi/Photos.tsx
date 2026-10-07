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
  releves,
}: {
  userId: string
  semaine: string
  aUnePhoto: boolean
  /** Pour comparer deux semaines. */
  releves: ReleveComplet[]
}) {
  const champ = useRef<HTMLInputElement>(null)
  const [presente, setPresente] = useState(aUnePhoto)
  const [ouverte, setOuverte] = useState(false)
  const [comparer, setComparer] = useState(false)
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
      setOuverte(false)
      await marquerPhoto(semaine, false)
    })
  }

  const nbPhotos = releves.filter((r) => r.aPhoto).length + (presente && !aUnePhoto ? 1 : 0)

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

      <div className="flex items-center gap-3.5 px-0.5">
        <button
          type="button"
          onClick={() => (presente ? setOuverte(true) : champ.current?.click())}
          disabled={envoi || enCours}
          aria-label={presente ? 'Voir la photo de la semaine' : 'Ajouter une photo'}
          className={`appui flex h-16 w-[52px] shrink-0 items-center justify-center rounded-[12px] ${
            presente ? 'bg-accent-2/15 text-accent-2' : 'bg-verre text-encre-douce'
          }`}
        >
          {presente ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          )}
        </button>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[16px] font-semibold">
            {envoi ? 'Envoi…' : presente ? 'Photo de la semaine' : 'Ajouter ma photo'}
          </span>
          <span className="text-[14px] text-encre-douce">Visible par toi seul</span>
        </span>
        {nbPhotos >= 2 && (
          <button
            type="button"
            onClick={() => setComparer(true)}
            className="appui h-10 shrink-0 rounded-pilule bg-verre px-3.5 text-[14px] font-semibold"
          >
            Comparer
          </button>
        )}
      </div>

      {erreur && <p className="mt-2 px-0.5 font-mono text-[12px] text-accent">{erreur}</p>}

      <Modale
        titre={`Semaine ${libelleCourt(semaine)}`}
        sousTitre="Visible par toi seul"
        ouverte={ouverte}
        onFermer={() => setOuverte(false)}
      >
        <div className="flex flex-col gap-3">
          <Photo userId={userId} semaine={semaine} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={envoi || enCours}
              onClick={() => champ.current?.click()}
              className="appui h-12 rounded-bloc bg-verre text-[15px] font-semibold disabled:opacity-50"
            >
              Remplacer
            </button>
            <button
              type="button"
              disabled={enCours}
              onClick={retirer}
              className="appui h-12 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce
                         hover:text-accent disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modale>

      <Modale titre="Comparer" sousTitre="Deux semaines côte à côte" ouverte={comparer} onFermer={() => setComparer(false)}>
        <Comparaison userId={userId} releves={releves} />
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
        className="h-12 w-full rounded-bloc border border-transparent bg-verre px-4
                   text-base focus:border-accent focus:outline-none"
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
      <p className="mt-2 font-mono text-[13px] text-encre-douce">
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
