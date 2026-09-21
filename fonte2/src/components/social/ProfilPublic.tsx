'use client'

import { useState, useTransition } from 'react'
import { fondBanniere } from '@/lib/bannieres'
import { CarteProfil } from '@/components/social/CarteProfil'
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
  historique,
}: {
  profil: Profil
  encouragementEnvoye: Signe | null
  historique?: React.ReactNode
  /* Seulement pour son propre profil : l'XP des autres ne
     regarde personne. */
  niveau?: {
    niveau: number
    rang: string
    xp: number
    xpSuivant: number
    progression: number
  }
}) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [signe, setSigne] = useState<Signe | null>(encouragementEnvoye)
  const [enCours, demarrer] = useTransition()

  const presence = presenceLisible(profil.presenceSec)

  function agir(action: () => Promise<{ erreur?: string }>) {
    setErreur(null)
    demarrer(async () => {
      const r = await action()
      if (r.erreur) setErreur(r.erreur)
    })
  }

  return (
    <div className="relative -mx-4 flex flex-col gap-6 overflow-hidden px-4 py-4 md:-mx-6 md:px-6">
      {/* La teinte émane du haut et se dissout dans le fond.
          Elle déborde des marges pour aller d'un bord à l'autre,
          mais n'a ni bord ni bande : il n'y a rien à raccorder. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px]"
        style={{ background: fondBanniere(profil.banniere) }}
      />

      <section className="relative border-b border-filet pb-6">
        {/* Le bouton passe sous le nom sur petit écran : à côté,
            il écrasait le bloc du milieu et les étiquettes se
            chevauchaient. */}
        <div className="flex flex-wrap items-start gap-4 sm:items-center sm:gap-5">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center
                       rounded-carte border border-bordure bg-verre text-3xl
                       sm:h-[72px] sm:w-[72px] sm:text-4xl"
          >
            {profil.avatar ?? '💪'}
          </span>

          <div className="min-w-[180px] flex-1">
            <h1 className="break-words text-3xl sm:text-4xl">{profil.pseudo}</h1>
            {niveau && (
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-2">
                Niveau {niveau.niveau} · {niveau.rang}
              </p>
            )}
            {profil.bio && (
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-encre-douce">
                {profil.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Etiquette accent>
                {profil.streak > 0
                  ? `🔥 ${profil.streak} semaine${profil.streak > 1 ? 's' : ''} d'affilée`
                  : 'Aucune série en cours'}
              </Etiquette>
              {profil.relation === 'ami' && profil.amiDepuis && (
                <Etiquette bleu>🤝 Amis {anciennete(profil.amiDepuis)}</Etiquette>
              )}
              {presence && (
                <Etiquette bleu={estEnLigne(profil.presenceSec)}>
                  {estEnLigne(profil.presenceSec) && '● '}
                  {presence}
                </Etiquette>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-auto">
            {profil.relation === 'moi' && niveau ? (
              <CarteProfil
                pseudo={profil.pseudo}
                avatar={profil.avatar ?? '💪'}
                niveau={niveau.niveau}
                rang={niveau.rang}
                banniere={profil.banniere}
              />
            ) : (
              <BoutonRelation profil={profil} enCours={enCours} onAgir={agir} />
            )}
          </div>
        </div>

        {niveau && (
          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-bloc bg-verre-fort">
              <div
                className="h-full rounded-bloc bg-accent transition-[width] duration-500"
                style={{ width: `${Math.round(niveau.progression * 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10.5px] text-encre-douce">
              <span className="text-accent-2">{niveau.xp} XP</span>
              <span>
                {niveau.xpSuivant - niveau.xp} XP avant le niveau{' '}
                {niveau.niveau + 1}
              </span>
            </div>
          </div>
        )}

        {erreur && (
          <p className="mt-4 rounded-bloc border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-xs text-accent">
            {erreur}
          </p>
        )}
      </section>

      {!profil.detail ? (
        <section>
          <h2 className="mb-3 text-2xl">Profil privé</h2>
          <p className="text-sm leading-relaxed text-encre-douce">
            Deviens ami avec cette personne pour voir ses statistiques, ses
            records et, si elle le partage, ses séances de la semaine. Ses
            mensurations et son suivi resteront privés dans tous les cas.
          </p>
        </section>
      ) : (
        <>
          <section className="section relative pb-6">
            <p className="section-titre mb-4">Statistiques</p>
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat valeur={profil.semaines ?? 0} libelle="Semaines suivies" />
              <Stat valeur={profil.exercices ?? 0} libelle="Exercices suivis" />
              <Stat
                valeur={Math.round(profil.volume ?? 0)}
                libelle="Kg cette semaine"
              />
              <Stat valeur={profil.streak} libelle="Semaines d'affilée" />
            </dl>
          </section>

          {profil.relation === 'ami' && (
            <section className="section relative pb-6">
              <p className="section-titre mb-2">Encourager</p>
              <p className="mb-4 text-sm leading-relaxed text-encre-douce">
                Un signe pour lui dire que tu suis sa progression. Un par ami et
                par semaine.
              </p>
              <div className="flex flex-wrap gap-2">
                {SIGNES_ENCOURAGEMENT.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={enCours}
                    onClick={() => {
                      setSigne(s)
                      agir(() => encourager(profil.id, s))
                    }}
                    aria-pressed={signe === s}
                    className={`flex h-12 w-12 items-center justify-center rounded-bloc
                      text-xl transition-colors ${
                        signe === s
                          ? 'bg-accent-2/20'
                          : 'bg-verre hover:bg-verre-fort'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {signe && (
                <p className="mt-3 font-mono text-[11px] text-accent-2">
                  Tu l&apos;as encouragé cette semaine {signe}
                </p>
              )}
            </section>
          )}

          <section className="section relative pb-6">
            <p className="section-titre mb-4">Séances</p>
            {historique}
          </section>

          <section className="section relative pb-6">
            <p className="section-titre mb-4">Records personnels</p>
            {(profil.records ?? []).length === 0 ? (
              <p className="text-sm italic text-encre-douce">
                Aucun record enregistré.
              </p>
            ) : (
              <ul className="divide-y divide-filet">
                {(profil.records ?? []).map((r) => (
                  <li
                    key={r.exercice}
                    className="flex items-baseline justify-between gap-3 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {r.exercice}
                    </span>
                    <span className="font-display text-2xl text-accent-2">
                      {r.poids}
                      <span className="ml-1 font-corps text-[10px] text-encre-douce">
                        kg
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
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
    'w-full rounded-bloc px-5 py-2.5 text-sm font-semibold transition-colors ' +
    'disabled:opacity-50 sm:w-auto'

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
      className={`${classe} border border-bordure bg-verre text-encre-douce hover:text-encre`}
    >
      {profil.relation === 'ami' ? 'Retirer des amis' : 'Annuler la demande'}
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
    ? 'border-accent/30 bg-accent/10 text-accent'
    : bleu
      ? 'border-accent-2/30 bg-accent-2/10 text-accent-2'
      : 'border-bordure bg-verre text-encre-douce'

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-bloc border px-2.5 py-1
                  font-mono text-[10.5px] ${couleur}`}
    >
      {children}
    </span>
  )
}

function Stat({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <div>
      <dd className="chiffre text-3xl">{valeur}</dd>
      <dt className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-encre-douce">
        {libelle}
      </dt>
    </div>
  )
}
