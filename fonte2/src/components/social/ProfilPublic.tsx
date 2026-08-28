'use client'

import { useState, useTransition } from 'react'
import {
  SIGNES_ENCOURAGEMENT,
  anciennete,
  presenceLisible,
  estEnLigne,
  dureeLisible,
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
}: {
  profil: Profil
  encouragementEnvoye: Signe | null
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
    <div className="flex flex-col gap-6 py-4">
      <section className="rounded-carte border border-bordure bg-verre p-6">
        <div className="flex flex-wrap items-center gap-5">
          <span
            aria-hidden
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full
                       border border-bordure bg-verre text-4xl"
          >
            {profil.avatar ?? '💪'}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-4xl sm:text-5xl">{profil.pseudo}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
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

          <div className="shrink-0">
            <BoutonRelation profil={profil} enCours={enCours} onAgir={agir} />
          </div>
        </div>

        {erreur && (
          <p className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-xs text-accent">
            {erreur}
          </p>
        )}
      </section>

      {!profil.detail ? (
        <section className="rounded-carte border border-bordure bg-verre p-6">
          <h2 className="mb-3 text-2xl">Profil privé</h2>
          <p className="text-sm leading-relaxed text-encre-douce">
            Deviens ami avec cette personne pour voir ses statistiques, ses
            records et, si elle le partage, ses séances de la semaine. Ses
            mensurations et son suivi resteront privés dans tous les cas.
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-carte border border-bordure bg-verre p-6">
            <h2 className="mb-4 text-2xl">Statistiques</h2>
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
            <section className="rounded-carte border border-bordure bg-verre p-6">
              <h2 className="mb-1 text-2xl">Encourager</h2>
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
                    className={`flex h-12 w-12 items-center justify-center rounded-full
                      border text-xl transition-colors ${
                        signe === s
                          ? 'border-accent-2 bg-accent-2/15'
                          : 'border-bordure bg-verre hover:bg-verre-fort'
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

          <section className="rounded-carte border border-bordure bg-verre p-6">
            <h2 className="mb-4 text-2xl">Séances de la semaine</h2>
            {!profil.partageSeances && profil.relation !== 'moi' ? (
              <p className="text-sm italic text-encre-douce">
                Cette personne ne partage pas ses séances.
              </p>
            ) : (profil.seances ?? []).length === 0 ? (
              <p className="text-sm italic text-encre-douce">
                Aucune séance enregistrée cette semaine.
              </p>
            ) : (
              <ul className="divide-y divide-filet">
                {(profil.seances ?? []).map((s) => (
                  <li key={s.seanceId} className="py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-encre-douce">
                          {s.date}
                          {s.dureeSec && ` · ⏱ ${dureeLisible(s.dureeSec)}`}
                        </p>
                        <p className="mt-0.5 truncate text-sm">
                          {s.blocs.map((b) => b.nom).join(', ')}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-xl">
                        {Math.round(s.volume)}
                        <span className="ml-1 font-corps text-[10px] text-encre-douce">
                          kg
                        </span>
                      </p>
                    </div>
                    {s.note && (
                      <p className="mt-1.5 text-xs italic text-encre-douce">
                        📝 {s.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-carte border border-bordure bg-verre p-6">
            <h2 className="mb-4 text-2xl">Records personnels</h2>
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
    'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50'

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
    <span className={`rounded-full border px-3 py-1 font-mono text-[11px] ${couleur}`}>
      {children}
    </span>
  )
}

function Stat({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <div>
      <dd className="font-display text-3xl text-accent">{valeur}</dd>
      <dt className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-encre-douce">
        {libelle}
      </dt>
    </div>
  )
}
