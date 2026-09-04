'use client'

import { useEffect, useState, useTransition } from 'react'
import { Champ, Bouton, Erreur, Succes } from '@/components/ui'
import { REGLES_PSEUDO } from '@/lib/messages'
import { BoutonInstallation } from '@/components/Installation'
import { JOURS } from '@/lib/rappel'
import { definirJourRappel } from '@/app/(carnet)/reglages/rappel'
import {
  changerPseudo,
  changerAvatar,
  changerPartageSeances,
  changerPartagePresence,
  changerMotDePasse,
  supprimerCompte,
} from '@/app/(carnet)/reglages/actions'

const AVATARS = [
  '💪', '🔥', '🏋️', '🦾', '⚡', '🐺', '🦁', '🐻',
  '🦍', '🚀', '⚙️', '🎯', '🥇', '🧊', '🌑', '🍀',
]

type Theme = 'sombre' | 'clair' | 'auto'

export function Reglages({
  pseudo,
  avatar,
  email,
  partageSeances,
  partagePresence,
  admin,
  jourRappel,
}: {
  pseudo: string
  avatar: string
  email: string
  partageSeances: boolean
  partagePresence: boolean
  admin: boolean
  jourRappel: number | null
}) {
  const [message, setMessage] = useState<{ ok?: string; ko?: string }>({})
  const [enCours, demarrer] = useTransition()

  function agir(action: () => Promise<{ erreur?: string; succes?: string }>) {
    setMessage({})
    demarrer(async () => {
      const r = await action()
      setMessage({ ok: r.succes, ko: r.erreur })
    })
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Ton carnet, tes règles
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Réglages</h1>
      </header>

      {(message.ok || message.ko) && (
        <div>
          <Erreur>{message.ko}</Erreur>
          <Succes>{message.ok}</Succes>
        </div>
      )}

      {/* ---- Profil ---- */}
      <Section titre="Profil">
        <Ligne
          titre="Avatar"
          detail="Visible sur ton profil et dans la barre de navigation."
        >
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                disabled={enCours}
                onClick={() => agir(() => changerAvatar(a))}
                aria-pressed={avatar === a}
                aria-label={`Avatar ${a}`}
                className={`flex h-11 w-11 items-center justify-center rounded-full
                  border text-xl transition-colors ${
                    avatar === a
                      ? 'border-accent bg-accent/15'
                      : 'border-bordure bg-verre hover:bg-verre-fort'
                  }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Ligne>

        <Ligne
          titre="Pseudo"
          detail={`Unique, modifiable une fois par mois. ${REGLES_PSEUDO}`}
        >
          <form action={(d) => agir(() => changerPseudo(d))} className="flex gap-2">
            <input
              name="pseudo"
              defaultValue={pseudo}
              maxLength={24}
              className="min-w-0 flex-1 rounded-full border border-bordure bg-verre
                         px-5 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={enCours}
              className="shrink-0 rounded-full border border-bordure bg-verre px-5 py-2.5
                         text-sm font-semibold text-encre-douce hover:text-encre"
            >
              Enregistrer
            </button>
          </form>
        </Ligne>
      </Section>

      {/* ---- Confidentialité ---- */}
      <Section titre="Confidentialité">
        <Ligne
          titre="Partager mes séances"
          detail="Tes amis verront les séances de la semaine en cours — dates, exercices et volume. Tes mensurations et ton suivi restent privés dans tous les cas."
        >
          <Bascule
            valeur={partageSeances}
            libelles={['Amis', 'Privé']}
            desactive={enCours}
            onChange={(v) => agir(() => changerPartageSeances(v))}
          />
        </Ligne>

        <Ligne
          titre="Afficher mon statut"
          detail="« En ligne » et « vu il y a X » sur ton profil. Seule une durée arrondie est partagée, jamais l'heure exacte de tes connexions."
        >
          <Bascule
            valeur={partagePresence}
            libelles={['Visible', 'Masqué']}
            desactive={enCours}
            onChange={(v) => agir(() => changerPartagePresence(v))}
          />
        </Ligne>
      </Section>

      {/* ---- Rappel ---- */}
      <Section titre="Rappel hebdomadaire">
        <Ligne
          titre="Jour du relevé"
          detail="Ce jour-là, un rappel discret apparaît sur l'accueil si ton relevé n'est pas encore rempli. Écarté, il ne revient pas avant la semaine suivante."
        >
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={enCours}
              onClick={() => agir(() => definirJourRappel(null))}
              aria-pressed={jourRappel === null}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold
                transition-colors ${
                  jourRappel === null
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-bordure bg-verre text-encre-douce hover:text-encre'
                }`}
            >
              Aucun
            </button>
            {JOURS.map((j) => (
              <button
                key={j.valeur}
                type="button"
                disabled={enCours}
                onClick={() => agir(() => definirJourRappel(j.valeur))}
                aria-pressed={jourRappel === j.valeur}
                className={`rounded-full border px-3.5 py-2 text-xs font-semibold
                  transition-colors ${
                    jourRappel === j.valeur
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-bordure bg-verre text-encre-douce hover:text-encre'
                  }`}
              >
                {j.nom.slice(0, 3)}
              </button>
            ))}
          </div>
        </Ligne>
      </Section>

      {/* ---- Apparence ---- */}
      <Section titre="Apparence">
        <Ligne titre="Thème" detail="Ce réglage est propre à cet appareil.">
          <ChoixTheme />
        </Ligne>
      </Section>

      {/* ---- Application ---- */}
      <Section titre="Application">
        <Ligne
          titre="Installer FONTE"
          detail="S'ajoute à ton écran d'accueil et s'ouvre en plein écran, sans barre de navigateur."
        >
          <BoutonInstallation />
        </Ligne>
      </Section>

      {/* ---- Compte ---- */}
      <Section titre="Compte">
        <Ligne titre="Adresse email" detail={email}>
          <span className="font-mono text-[11px] text-encre-douce">
            Non modifiable ici
          </span>
        </Ligne>

        <Ligne titre="Mot de passe" detail="Au moins 8 caractères.">
          <form
            action={(d) => agir(() => changerMotDePasse(d))}
            className="flex gap-2"
          >
            <input
              name="motDePasse"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              placeholder="Nouveau mot de passe"
              className="min-w-0 flex-1 rounded-full border border-bordure bg-verre
                         px-5 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={enCours}
              className="shrink-0 rounded-full border border-bordure bg-verre px-5 py-2.5
                         text-sm font-semibold text-encre-douce hover:text-encre"
            >
              Modifier
            </button>
          </form>
        </Ligne>
      </Section>

      {admin && (
        <Section titre="Administration">
          <Ligne
            titre="Annonces et notifications"
            detail="Publier des annonces et écrire à tous les membres."
          >
            <a
              href="/admin"
              className="inline-block rounded-full bg-accent px-5 py-2.5 text-sm
                         font-semibold text-white transition-colors hover:bg-accent-clair"
            >
              Ouvrir l'administration
            </a>
          </Ligne>
        </Section>
      )}

      <ZoneDeDanger enCours={enCours} onAgir={agir} />
    </div>
  )
}

/* ---- Thème ---- */

function ChoixTheme() {
  const [theme, setTheme] = useState<Theme>('sombre')

  useEffect(() => {
    const enregistre = localStorage.getItem('fonte-theme') as Theme | null
    if (enregistre) setTheme(enregistre)
  }, [])

  function appliquer(t: Theme) {
    setTheme(t)
    localStorage.setItem('fonte-theme', t)

    const clair =
      t === 'clair' ||
      (t === 'auto' &&
        window.matchMedia('(prefers-color-scheme: light)').matches)

    document.documentElement.classList.toggle('clair', clair)
  }

  return (
    <div className="flex gap-1 rounded-full border border-bordure bg-verre p-1">
      {(
        [
          ['sombre', '🌙 Sombre'],
          ['clair', '☀️ Clair'],
          ['auto', 'Auto'],
        ] as [Theme, string][]
      ).map(([cle, libelle]) => (
        <button
          key={cle}
          type="button"
          onClick={() => appliquer(cle)}
          aria-pressed={theme === cle}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            theme === cle ? 'bg-encre text-fond' : 'text-encre-douce hover:text-encre'
          }`}
        >
          {libelle}
        </button>
      ))}
    </div>
  )
}

/* ---- Suppression ---- */

function ZoneDeDanger({
  enCours,
  onAgir,
}: {
  enCours: boolean
  onAgir: (a: () => Promise<{ erreur?: string; succes?: string }>) => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  return (
    <section className="rounded-carte border border-accent/40 bg-accent/5 p-5">
      <h2 className="mb-4 text-2xl text-accent">Zone de danger</h2>

      <p className="mb-4 text-sm leading-relaxed text-encre-douce">
        Supprimer ton compte efface définitivement ton carnet : séances,
        relevés, records, amitiés. Rien n&apos;est conservé, et rien
        n&apos;est récupérable.
      </p>

      {!ouvert ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="rounded-full border border-accent/50 px-5 py-2.5 text-sm
                     font-semibold text-accent transition-colors hover:bg-accent/10"
        >
          Supprimer mon compte
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <Champ
            libelle="Écris SUPPRIMER pour confirmer"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="SUPPRIMER"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOuvert(false)
                setConfirmation('')
              }}
              className="flex-1 rounded-full border border-bordure bg-verre px-5 py-2.5
                         text-sm font-semibold text-encre-douce hover:text-encre"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={enCours || confirmation.trim().toUpperCase() !== 'SUPPRIMER'}
              onClick={() => onAgir(() => supprimerCompte(confirmation))}
              className="flex-1 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold
                         text-white disabled:opacity-40"
            >
              Supprimer définitivement
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/* ---- Pièces ---- */

function Section({
  titre,
  children,
}: {
  titre: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-carte border border-bordure bg-verre p-5">
      <h2 className="mb-4 text-2xl">{titre}</h2>
      <div className="flex flex-col divide-y divide-filet">{children}</div>
    </section>
  )
}

function Ligne({
  titre,
  detail,
  children,
}: {
  titre: string
  detail: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="sm:max-w-sm">
        <p className="font-semibold">{titre}</p>
        <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-encre-douce">
          {detail}
        </p>
      </div>
      <div className="shrink-0 sm:min-w-[280px]">{children}</div>
    </div>
  )
}

function Bascule({
  valeur,
  libelles,
  desactive,
  onChange,
}: {
  valeur: boolean
  libelles: [string, string]
  desactive: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-1 rounded-full border border-bordure bg-verre p-1">
      {([true, false] as const).map((v, i) => (
        <button
          key={String(v)}
          type="button"
          disabled={desactive}
          onClick={() => onChange(v)}
          aria-pressed={valeur === v}
          className={`flex-1 rounded-full px-4 py-1.5 text-xs font-semibold
            transition-colors ${
              valeur === v ? 'bg-encre text-fond' : 'text-encre-douce hover:text-encre'
            }`}
        >
          {libelles[i]}
        </button>
      ))}
    </div>
  )
}
