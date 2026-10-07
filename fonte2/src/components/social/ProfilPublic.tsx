'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { banniere as trouverBanniere } from '@/lib/bannieres'
import { AvatarCadre } from '@/components/AvatarCadre'
import { motifCss } from '@/lib/motifs'
import { CarteProfil } from '@/components/social/CarteProfil'
import { Modale } from '@/components/ui/Modale'
import { rang } from '@/lib/xp'
import { cadre } from '@/lib/recompenses'
import {
  SIGNES_ENCOURAGEMENT,
  anciennete,
  presenceLisible,
  estEnLigne,
  type ProfilPublic as Profil,
  type Signe,
} from '@/lib/social'
import {
  demanderAmi,
  accepterAmi,
  retirerAmi,
  encourager,
} from '@/app/(carnet)/amis/actions'

/**
 * Profil, public ou personnel.
 *
 * Le même écran sert dans les deux cas : la base décide de ce
 * qu'elle renvoie selon la relation. Un inconnu ne reçoit que
 * le pseudo, l'avatar et la série ; un ami voit les statistiques
 * et les records. Les mensurations ne sortent jamais.
 */
export function VueProfil({
  profil,
  encouragementEnvoye,
  niveau,
  niveauPublic = null,
  nbSeances,
  historique,
  badges,
}: {
  profil: Profil
  encouragementEnvoye: Signe | null
  historique?: React.ReactNode
  /** Grille des badges, visible par la personne et ses amis. */
  badges?: React.ReactNode
  /* Seulement pour son propre profil : l'XP des autres ne
     regarde personne. */
  niveau?: {
    niveau: number
    rang: string
    xp: number
    xpSuivant: number
    progression: number
  }
  /** Niveau d'un autre membre : le chiffre seul, public. */
  niveauPublic?: number | null
  /** Séances visibles au total. */
  nbSeances?: number
}) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [signe, setSigne] = useState<Signe | null>(encouragementEnvoye)
  const [encourage, setEncourage] = useState(false)
  const [enCours, demarrer] = useTransition()

  const presence = presenceLisible(profil.presenceSec)
  const nv = niveau?.niveau ?? niveauPublic
  const nomRang = niveau?.rang ?? (nv !== null && nv !== undefined ? rang(nv) : null)
  const couleurRang = cadre(rangVersCadre(nomRang)).couleur

  function agir(action: () => Promise<{ erreur?: string }>) {
    setErreur(null)
    demarrer(async () => {
      const r = await action()
      if (r.erreur) setErreur(r.erreur)
    })
  }

  const teinte = trouverBanniere(profil.banniere)

  return (
    <div className="relative -mx-4 flex flex-col gap-4 px-4 pb-4 md:-mx-6 md:px-6">
      {/* Bannière : teinte et motif, sous la barre du haut, fondues
          dans le fond vers le bas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: 'calc(-1 * (6.25rem + env(safe-area-inset-top)))',
          height: 'calc(230px + 6.25rem + env(safe-area-inset-top))',
          background: teinte.fond,
          maskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
        }}
      />
      {teinte.anime && (
        <div
          aria-hidden
          className="reflet-teinte pointer-events-none absolute inset-x-0"
          style={{
            top: 'calc(-1 * (6.25rem + env(safe-area-inset-top)))',
            height: 'calc(230px + 6.25rem + env(safe-area-inset-top))',
            maskImage: 'linear-gradient(to bottom, #000 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 40%, transparent 100%)',
          }}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: 'calc(-1 * (6.25rem + env(safe-area-inset-top)))',
          height: 'calc(200px + 6.25rem + env(safe-area-inset-top))',
          maskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
          ...motifCss(profil.motif),
        }}
      />

      {/* Identité */}
      <section className="relative flex flex-col gap-3.5 pt-24">
        <div className="flex items-end gap-3.5 px-0.5">
          <AvatarCadre avatar={profil.avatar ?? '💪'} cadre={profil.cadre} taille={86} />
          <div className="min-w-0 flex-1 pb-0.5">
            <h1 className="titre-page truncate">{profil.pseudo}</h1>
            {nv !== null && nv !== undefined && (
              <span
                className="mt-1.5 inline-flex h-[26px] items-center rounded-pilule px-2.5 font-mono text-[12px] uppercase"
                style={{ background: `${couleurRang}29`, color: couleurRang }}
              >
                {nomRang} · {nv}
              </span>
            )}
          </div>
          {profil.relation === 'moi' && niveau && (
            <CarteProfil
              pseudo={profil.pseudo}
              avatar={profil.avatar ?? '💪'}
              niveau={niveau.niveau}
              rang={niveau.rang}
              banniere={profil.banniere}
              motif={profil.motif}
              cadre={profil.cadre ?? null}
            />
          )}
        </div>

        {profil.bio && (
          <p className="selectionnable px-0.5 text-[15px] leading-relaxed text-encre/80">{profil.bio}</p>
        )}

        <div className="flex flex-wrap gap-1.5 px-0.5">
          {profil.streak > 0 && (
            <Etiquette accent>
              {profil.streak} semaine{profil.streak > 1 ? 's' : ''} d&apos;affilée
            </Etiquette>
          )}
          {profil.relation === 'ami' && profil.amiDepuis && (
            <Etiquette>Amis {anciennete(profil.amiDepuis)}</Etiquette>
          )}
          {presence && profil.relation !== 'moi' && (
            <Etiquette bleu={estEnLigne(profil.presenceSec)}>{presence}</Etiquette>
          )}
        </div>

        {profil.relation !== 'moi' && (
          <div className="flex gap-2">
            {profil.relation === 'ami' ? (
              <>
                <button
                  type="button"
                  onClick={() => setEncourage(true)}
                  className="appui flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[16px] bg-accent
                             text-[16px] font-bold text-white transition-colors hover:bg-accent-clair"
                >
                  {signe ? `Encouragé ${signe}` : 'Encourager'}
                </button>
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => {
                    if (confirm(`Retirer ${profil.pseudo} de tes amis ?`))
                      agir(() => retirerAmi(profil.id))
                  }}
                  className="appui flex h-[50px] items-center gap-1.5 rounded-[16px] bg-verre px-[18px] text-[16px] font-semibold"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  Amis
                </button>
              </>
            ) : (
              <BoutonRelation profil={profil} enCours={enCours} onAgir={agir} />
            )}
          </div>
        )}

        {niveau && (
          <Link href="/xp" className="group block">
            <div className="h-2 overflow-hidden rounded-pilule bg-encre/10">
              <div
                className="h-full rounded-pilule bg-accent transition-[width] duration-500"
                style={{ width: `${Math.round(niveau.progression * 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[13px] text-encre-douce">
              <span className="text-accent-clair">{niveau.xp.toLocaleString('fr-FR')} XP</span>
              <span>
                −{(niveau.xpSuivant - niveau.xp).toLocaleString('fr-FR')} avant le {niveau.niveau + 1} ›
              </span>
            </div>
          </Link>
        )}

        {erreur && (
          <p className="rounded-bloc bg-accent/10 px-4 py-3 font-mono text-[12px] text-accent">{erreur}</p>
        )}
      </section>

      {!profil.detail ? (
        <section className="bloc relative flex flex-col gap-2 p-5">
          <p className="font-display text-[30px] leading-none">Profil privé</p>
          <p className="text-[15px] leading-relaxed text-encre-douce">
            Deviens ami avec cette personne pour voir ses chiffres, ses records et, si elle les
            partage, ses séances. Ses mensurations et ses photos restent privées dans tous les cas.
          </p>
        </section>
      ) : (
        <>
          <div className="bloc relative grid grid-cols-3 py-3.5">
            <Chiffre valeur={nbSeances ?? profil.semaines ?? 0} libelle={nbSeances !== undefined ? 'séances' : 'semaines'} />
            <Chiffre valeur={(profil.records ?? []).length} libelle="records" separe />
            <Chiffre valeur={profil.streak} libelle="semaines" separe accent />
          </div>

          {(profil.records ?? []).length > 0 && (
            <section className="relative flex flex-col px-0.5">
              <p className="section-titre pt-1 pb-1">Records</p>
              <ul className="flex flex-col">
                {(profil.records ?? []).map((r) => (
                  <li
                    key={r.exercice}
                    className="flex min-h-[46px] items-center justify-between gap-3 border-b border-filet last:border-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-[16px]">{r.exercice}</span>
                    <span className="font-mono text-[15px] text-accent-2">
                      {r.poids.toLocaleString('fr-FR')} kg
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {badges && <section className="relative">{badges}</section>}

          {historique && (
            <section className="relative flex flex-col gap-3">
              <p className="section-titre px-0.5">Séances</p>
              {historique}
            </section>
          )}
        </>
      )}

      {/* Encourager : quatre signes, un par semaine. */}
      <Modale
        titre={`Encourager ${profil.pseudo}`}
        sousTitre="Un signe par ami et par semaine"
        ouverte={encourage}
        onFermer={() => setEncourage(false)}
      >
        <div className="grid grid-cols-4 gap-2">
          {SIGNES_ENCOURAGEMENT.map((s) => (
            <button
              key={s}
              type="button"
              disabled={enCours}
              onClick={() => {
                setSigne(s)
                agir(() => encourager(profil.id, s))
                setEncourage(false)
              }}
              aria-pressed={signe === s}
              className={`appui flex aspect-square items-center justify-center rounded-carte text-[34px] transition-colors ${
                signe === s ? 'bg-accent/20 ring-2 ring-accent' : 'bg-verre hover:bg-verre-fort'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Modale>
    </div>
  )
}

function BoutonRelation({
  profil,
  enCours,
  onAgir,
}: {
  profil: Profil
  enCours: boolean
  onAgir: (a: () => Promise<{ erreur?: string }>) => void
}) {
  const classe =
    'appui flex h-[50px] flex-1 items-center justify-center rounded-[16px] px-5 text-[16px] font-bold ' +
    'transition-colors disabled:opacity-50'

  if (profil.relation === 'moi') return null

  if (profil.relation === 'inconnu')
    return (
      <button
        type="button"
        disabled={enCours}
        onClick={() => onAgir(() => demanderAmi(profil.id))}
        className={`${classe} bg-accent text-white hover:bg-accent-clair`}
      >
        Ajouter en ami
      </button>
    )

  if (profil.relation === 'demande_recue')
    return (
      <button
        type="button"
        disabled={enCours}
        onClick={() => onAgir(() => accepterAmi(profil.id))}
        className={`${classe} bg-accent text-white hover:bg-accent-clair`}
      >
        Accepter sa demande
      </button>
    )

  return (
    <button
      type="button"
      disabled={enCours}
      onClick={() => onAgir(() => retirerAmi(profil.id))}
      className={`${classe} bg-verre text-encre-douce hover:text-encre`}
    >
      {profil.relation === 'ami' ? 'Retirer des amis' : 'Demande envoyée · annuler'}
    </button>
  )
}

function Etiquette({
  children,
  accent,
  bleu,
}: {
  children: React.ReactNode
  accent?: boolean
  bleu?: boolean
}) {
  const couleur = accent
    ? 'bg-accent/15 text-accent-clair'
    : bleu
      ? 'bg-accent-2/15 text-accent-2'
      : 'bg-encre/[0.08] text-encre-douce'

  return (
    <span className={`inline-flex h-7 items-center whitespace-nowrap rounded-pilule px-2.5 font-mono text-[12px] ${couleur}`}>
      {children}
    </span>
  )
}

function Chiffre({
  valeur,
  libelle,
  separe = false,
  accent = false,
}: {
  valeur: number
  libelle: string
  separe?: boolean
  accent?: boolean
}) {
  return (
    <div className={`min-w-0 px-4 ${separe ? 'border-l border-filet' : ''}`}>
      <p className={`truncate font-display text-[38px] leading-[0.9] ${accent ? 'text-accent-clair' : ''}`}>
        {valeur.toLocaleString('fr-FR')}
      </p>
      <p className="mt-0.5 font-mono text-[12px] text-encre-douce">{libelle}</p>
    </div>
  )
}

/** Le cadre qui porte la couleur d'un rang (« Or » → or). */
function rangVersCadre(nom: string | null): string {
  const n = (nom ?? '').toLowerCase()
  if (n === 'légende') return 'legende'
  return n
}
