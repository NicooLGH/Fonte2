'use client'

import { useEffect, useState, useTransition } from 'react'
import { Champ, Bouton, Erreur, Succes } from '@/components/ui'
import { REGLES_PSEUDO } from '@/lib/messages'
import { BoutonInstallation } from '@/components/Installation'
import { JOURS } from '@/lib/rappel'
import { definirJourRappel } from '@/app/(carnet)/reglages/rappel'
import { seDeconnecter } from '@/app/auth/actions'
import { sonsActifs, definirSons, sonValide } from '@/lib/sons'
import Link from 'next/link'
import { fondBanniere } from '@/lib/bannieres'
import { definirCode } from '@/app/(carnet)/admin/verrou'
import { changerPersonnalisation } from '@/app/(carnet)/reglages/actions'
import {
  changerPseudo,
  changerPartageSeances,
  changerPartagePresence,
  changerPartageLive,
  changerMotDePasse,
  supprimerCompte,
} from '@/app/(carnet)/reglages/actions'
import { usePastille, Pastille } from '@/components/ui/Pastille'
import { Visage } from '@/components/Visage'
import { Notifications } from '@/components/reglages/Notifications'
import type { PreferencesPush } from '@/app/(carnet)/reglages/push'


type Theme = 'sombre' | 'clair' | 'auto'

export function Reglages({
  pseudo,
  avatar,
  email,
  partageSeances,
  partagePresence,
  partageLive,
  admin,
  jourRappel,
  bio,
  banniere,
  motif,
  aUnCode,
  preferencesPush,
}: {
  pseudo: string
  avatar: string
  email: string
  partageSeances: boolean
  partagePresence: boolean
  partageLive: boolean
  admin: boolean
  jourRappel: number | null
  bio: string
  banniere: string
  motif: string
  cadre?: string
  /** Niveau actuel : décide de ce qui est débloqué. */
  niveau?: number
  aUnCode: boolean
  preferencesPush: PreferencesPush
}) {
  const [message, setMessage] = useState<{ ok?: string; ko?: string }>({})
  const pastilleJour = usePastille(jourRappel)
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
      <header className="flex flex-col gap-1">
        <Link href="/profil" aria-label="Retour au profil" className="-ml-2 flex h-11 w-11 items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="titre-page px-0.5">Réglages</h1>
      </header>

      {(message.ok || message.ko) && (
        <div>
          <Erreur>{message.ko}</Erreur>
          <Succes>{message.ok}</Succes>
        </div>
      )}

      {/* ---- Profil ---- */}
      <Section titre="Profil">
        <Link href="/reglages/apparence" className="flex min-h-14 items-center gap-3 py-2">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[16px] font-semibold">Personnaliser</span>
            <span className="text-[13px] text-encre-douce">Teinte, motif, cadre et avatar</span>
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-6 w-6 rounded-[7px]" style={{ background: `${fondBanniere(banniere)}, var(--color-fond)` }} />
            <span className="text-[20px] text-encre-douce"><Visage avatar={avatar} /></span>
            <span className="text-encre-douce">›</span>
          </span>
        </Link>

        <Ligne
          titre="Description"
          detail="Une ligne sur toi, visible de tous. 140 caractères maximum."
        >
          <ChampBio
            valeur={bio}
            banniere={banniere}
            motif={motif}
            enCours={enCours}
            onAgir={agir}
          />
        </Ligne>

        <Ligne
          titre="Pseudo"
          detail={`Unique, modifiable une fois par mois. ${REGLES_PSEUDO}`}
        >
          <form action={(d) => agir(() => changerPseudo(d))} className="flex gap-2">
            <input
              name="pseudo"
              defaultValue={pseudo}
              maxLength={16}
              className="h-12 min-w-0 flex-1 rounded-bloc border border-transparent bg-fond
                         px-4 text-base focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={enCours}
              className="h-12 shrink-0 rounded-bloc bg-verre-fort px-4
                         text-[15px] font-semibold hover:text-encre"
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

        <Ligne
          titre="Séance en direct"
          detail="Pendant une séance en mode direct, tes amis voient « en séance depuis X min » et peuvent t'envoyer un smiley par minute. Jamais tes exercices ni tes charges. Masqué, rien n'est enregistré."
        >
          <Bascule
            valeur={partageLive}
            libelles={['Amis', 'Masqué']}
            desactive={enCours}
            onChange={(v) => agir(() => changerPartageLive(v))}
          />
        </Ligne>
      </Section>

      {/* ---- Rappel ---- */}
      <Section titre="Rappel hebdomadaire">
        <Ligne
          titre="Jour du relevé"
          detail="Ce jour-là, un rappel discret apparaît sur l'accueil si ton relevé n'est pas encore rempli. Écarté, il ne revient pas avant la semaine suivante."
        >
          <div ref={pastilleJour.ref} className="relative flex flex-wrap gap-1.5">
            <Pastille pos={pastilleJour.pos} />
            <button
              type="button"
              disabled={enCours}
              onClick={() => agir(() => definirJourRappel(null))}
              aria-pressed={jourRappel === null}
              data-actif={jourRappel === null}
              className={`relative h-10 rounded-pilule px-3.5 text-[14px] transition-colors duration-300 ${
                  jourRappel === null
                    ? `${pastilleJour.fond} font-semibold text-fond`
                    : 'bg-verre-fort text-encre-douce hover:text-encre'
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
                data-actif={jourRappel === j.valeur}
                className={`relative h-10 rounded-pilule px-3.5 text-[14px] transition-colors duration-300 ${
                    jourRappel === j.valeur
                      ? `${pastilleJour.fond} font-semibold text-fond`
                      : 'bg-verre-fort text-encre-douce hover:text-encre'
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
          <ChoixThemeAffichage />
        </Ligne>

        <Ligne
          titre="Sons"
          detail="Un retour sonore en séance : série validée, fin du repos, séance enregistrée. Désactivés par défaut."
        >
          <ChoixSons />
        </Ligne>
      </Section>

      {/* ---- Notifications ---- */}
      <Notifications preferences={preferencesPush} />

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

        <Ligne
          titre="Session"
          detail="Tu devras te reconnecter ensuite."
        >
          <form action={seDeconnecter}>
            <button
              type="submit"
              className="appui h-12 w-full rounded-bloc bg-verre-fort px-5 text-[15px] font-semibold
                         transition-colors hover:text-encre sm:w-auto"
            >
              Se déconnecter
            </button>
          </form>
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
              className="h-12 min-w-0 flex-1 rounded-bloc border border-transparent bg-fond
                         px-4 text-base focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={enCours}
              className="h-12 shrink-0 rounded-bloc bg-verre-fort px-4
                         text-[15px] font-semibold hover:text-encre"
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
              className="appui inline-flex h-12 items-center rounded-bloc bg-accent px-5 text-[15px]
                         font-bold text-white transition-colors hover:bg-accent-clair"
            >
              Ouvrir l'administration
            </a>
          </Ligne>

          <Ligne
            titre="Code d'accès"
            detail="Demandé à l'ouverture de l'administration, puis mémorisé une demi-heure. Il protège d'une publication par accident, ou d'un téléphone laissé déverrouillé — pas d'une intrusion : c'est la base qui vérifie ton rôle."
          >
            <ChampCode aUnCode={aUnCode} enCours={enCours} onAgir={agir} />
          </Ligne>
        </Section>
      )}

      <ZoneDeDanger enCours={enCours} onAgir={agir} />
    </div>
  )
}

/* ---- Thème ---- */

function ChoixThemeAffichage() {
  const [theme, setTheme] = useState<Theme>('sombre')
  const pastille = usePastille(theme)

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
    <div ref={pastille.ref} className="relative flex gap-1 rounded-bloc bg-verre-fort p-1">
      <Pastille pos={pastille.pos} arrondi="rounded-[11px]" />
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
          data-actif={theme === cle}
          className={`relative h-10 flex-1 rounded-[11px] px-3 text-[14px] transition-colors duration-300 ${
            theme === cle ? `${pastille.fond} font-semibold text-fond` : 'text-encre-douce hover:text-encre'
          }`}
        >
          {libelle}
        </button>
      ))}
    </div>
  )
}

/* ---- Code de l'administration ---- */

function ChampCode({
  aUnCode,
  enCours,
  onAgir,
}: {
  aUnCode: boolean
  enCours: boolean
  onAgir: (a: () => Promise<{ erreur?: string; succes?: string }>) => void
}) {
  return (
    <form
      action={(d) => onAgir(() => definirCode(d))}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          name="code"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          placeholder={aUnCode ? 'Nouveau code' : '4 à 8 chiffres'}
          className="h-12 min-w-0 flex-1 rounded-bloc border border-transparent bg-fond
                     px-4 text-base focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={enCours}
          className="appui h-12 shrink-0 rounded-bloc bg-verre-fort px-4 text-[15px] font-semibold
                     transition-colors disabled:opacity-40"
        >
          {aUnCode ? 'Changer' : 'Définir'}
        </button>
      </div>
      <span className="text-[13px] text-encre-douce">
        {aUnCode
          ? 'Un code est défini. Laisse vide et valide pour le retirer.'
          : 'Aucun code : l\'administration s\'ouvre directement.'}
      </span>
    </form>
  )
}

/* ---- Personnalisation ---- */

function ChampBio({
  valeur,
  banniere,
  motif,
  enCours,
  onAgir,
}: {
  valeur: string
  banniere: string
  motif: string
  enCours: boolean
  onAgir: (a: () => Promise<{ erreur?: string; succes?: string }>) => void
}) {
  const [texte, setTexte] = useState(valeur)
  const restant = 140 - texte.length

  return (
    <div>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value.slice(0, 140))}
        rows={2}
        placeholder="ex : powerlifting, 3 séances par semaine"
        className="w-full resize-none rounded-bloc border border-transparent bg-fond
                   px-4 py-3 text-base focus:border-accent focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[12px] text-encre-douce">
          {restant} caractère{restant > 1 ? 's' : ''} restant
          {restant > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          disabled={enCours || texte === valeur}
          onClick={() => onAgir(() => changerPersonnalisation(texte, banniere, motif))}
          className="appui h-10 rounded-pilule bg-verre-fort px-4 text-[14px] font-semibold
                     transition-colors disabled:opacity-40"
        >
          Enregistrer
        </button>
      </div>
    </div>
  )
}

/* ---- Sons ---- */

function ChoixSons() {
  const [actifs, setActifs] = useState(false)

  useEffect(() => setActifs(sonsActifs()), [])
  const pastille = usePastille(actifs)

  function basculer(valeur: boolean) {
    setActifs(valeur)
    definirSons(valeur)
    // Un aperçu immédiat : sans lui, on ne sait pas à quoi on
    // vient de dire oui.
    if (valeur) sonValide()
  }

  return (
    <div ref={pastille.ref} className="relative flex gap-1 rounded-bloc bg-verre-fort p-1">
      <Pastille pos={pastille.pos} arrondi="rounded-[11px]" />
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => basculer(v)}
          aria-pressed={actifs === v}
          data-actif={actifs === v}
          className={`appui relative h-10 flex-1 rounded-[11px] px-4 text-[14px] transition-colors duration-300 ${
              actifs === v ? `${pastille.fond} font-semibold text-fond` : 'text-encre-douce hover:text-encre'
            }`}
        >
          {v ? 'Activés' : 'Coupés'}
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
    <section className="flex flex-col gap-3 px-0.5">
      <p className="text-[15px] leading-relaxed text-encre-douce">
        Supprimer ton compte efface définitivement ton carnet : séances,
        relevés, records, amitiés. Rien n&apos;est conservé, et rien
        n&apos;est récupérable.
      </p>

      {!ouvert ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="h-12 self-start text-[16px] font-semibold text-accent"
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
              className="h-12 flex-1 rounded-bloc bg-verre text-[15px] font-semibold text-encre-douce hover:text-encre"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={enCours || confirmation.trim().toUpperCase() !== 'SUPPRIMER'}
              onClick={() => onAgir(() => supprimerCompte(confirmation))}
              className="h-12 flex-1 rounded-bloc bg-accent text-[15px] font-bold text-white disabled:opacity-40"
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
    <section className="flex flex-col gap-2">
      <p className="section-titre px-0.5">{titre}</p>
      <div className="bloc flex flex-col divide-y divide-filet px-4">{children}</div>
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
    <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="sm:max-w-sm">
        <p className="text-[16px] font-semibold">{titre}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-encre-douce">{detail}</p>
      </div>
      <div className="shrink-0 sm:min-w-[280px]">{children}</div>
    </div>
  )
}

/** Interrupteur : vrai = premier libellé (partagé, visible…). */
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
    <button
      type="button"
      role="switch"
      aria-checked={valeur}
      disabled={desactive}
      onClick={() => onChange(!valeur)}
      className="flex items-center gap-3 disabled:opacity-60"
    >
      <span className="text-[14px] text-encre-douce">{valeur ? libelles[0] : libelles[1]}</span>
      <span
        className={`relative h-[30px] w-[52px] rounded-pilule transition-colors ${
          valeur ? 'bg-accent' : 'bg-encre/20'
        }`}
      >
        <span
          className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-[left] ${
            valeur ? 'left-[25px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  )
}
