'use client'

import { useState, useTransition } from 'react'
import { Champ, Bouton, Erreur, Succes } from '@/components/ui'
import { dateRelative } from '@/lib/social'
import { Annonces } from '@/components/social/Annonces'
import type { Annonce } from '@/lib/notifs'
import {
  publierAnnonce,
  retirerAnnonce,
  diffuserNotification,
} from '@/app/(carnet)/admin/actions'

const ICONES = ['📢', '🎉', '⚠️', '🔥', '✨', '💪', '🛠️', '🎁', '📅', '❤️']
type Ton = 'info' | 'succes' | 'alerte'

export function Admin({ annonces }: { annonces: Annonce[] }) {
  const [message, setMessage] = useState<{ ok?: string; ko?: string }>({})
  const [enCours, demarrer] = useTransition()

  // Formulaire
  const [titre, setTitre] = useState('')
  const [corps, setCorps] = useState('')
  const [ton, setTon] = useState<Ton>('info')
  const [couleur, setCouleur] = useState<string | null>(null)
  const [icone, setIcone] = useState('')
  const [retirable, setRetirable] = useState(true)
  const [epinglee, setEpinglee] = useState(false)
  const [jours, setJours] = useState(7)
  const [notifier, setNotifier] = useState(true)
  const [lienTexte, setLienTexte] = useState('')
  const [lienUrl, setLienUrl] = useState('')

  // Notification seule
  const [nTitre, setNTitre] = useState('')
  const [nCorps, setNCorps] = useState('')

  function agir(action: () => Promise<{ erreur?: string; succes?: string }>) {
    setMessage({})
    demarrer(async () => {
      const r = await action()
      setMessage({ ok: r.succes, ko: r.erreur })
    })
  }

  const apercu: Annonce = {
    id: 'apercu',
    titre: titre || 'Titre de ton annonce',
    corps: corps || 'Le message apparaîtra ici.',
    ton,
    active: true,
    retirable,
    epinglee,
    couleur,
    icone: icone || null,
    lienTexte: lienTexte || null,
    lienUrl: lienUrl || null,
    expireLe: null,
    creeLe: new Date().toISOString(),
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Réservé aux administrateurs
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Administration</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-encre-douce">
          Un administrateur publie et notifie. Il n&apos;a aucun accès aux
          données des membres : ni mensurations, ni poids, ni séances, ni
          adresses email.
        </p>
      </header>

      {(message.ok || message.ko) && (
        <div>
          <Erreur>{message.ko}</Erreur>
          <Succes>{message.ok}</Succes>
        </div>
      )}

      {/* ---- Publier ---- */}
      <section className="rounded-carte border border-bordure bg-verre p-5">
        <h2 className="mb-4 text-2xl">Publier une annonce</h2>

        <div className="flex flex-col gap-4">
          <Champ
            libelle="Titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            maxLength={80}
            placeholder="ex : Nouvelle version disponible"
          />

          <label className="block">
            <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
              Message
            </span>
            <textarea
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
              rows={4}
              maxLength={600}
              className="w-full resize-y rounded-2xl border border-bordure bg-verre
                         px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>

          <Reglage titre="Style" detail="Couleur de base du bandeau.">
            <div className="flex gap-1 rounded-full border border-bordure bg-verre p-1">
              {(['info', 'succes', 'alerte'] as Ton[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTon(t)
                    setCouleur(null)
                  }}
                  aria-pressed={ton === t && !couleur}
                  className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    ton === t && !couleur
                      ? 'bg-encre text-fond'
                      : 'text-encre-douce'
                  }`}
                >
                  {t === 'info' ? 'Info' : t === 'succes' ? 'Succès' : 'Alerte'}
                </button>
              ))}
            </div>
          </Reglage>

          <Reglage titre="Couleur libre" detail="Remplace le style ci-dessus.">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={couleur ?? '#ff4b2b'}
                onChange={(e) => setCouleur(e.target.value)}
                aria-label="Couleur personnalisée"
                className="h-10 w-12 cursor-pointer rounded-xl border border-bordure bg-verre p-1"
              />
              <button
                type="button"
                onClick={() => setCouleur(null)}
                className="rounded-full border border-bordure px-4 py-2 text-xs
                           font-semibold text-encre-douce hover:text-encre"
              >
                Aucune
              </button>
            </div>
          </Reglage>

          <Reglage titre="Icône" detail="Un emoji, facultatif.">
            <div className="flex flex-wrap gap-1.5">
              {ICONES.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcone(icone === i ? '' : i)}
                  aria-pressed={icone === i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full
                    border text-base ${
                      icone === i
                        ? 'border-accent-2 bg-accent-2/15'
                        : 'border-bordure bg-verre'
                    }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </Reglage>

          <Reglage
            titre="Retirable"
            detail="Si non, les membres ne peuvent pas la masquer."
          >
            <Oui valeur={retirable} onChange={setRetirable} />
          </Reglage>

          <Reglage titre="Épinglée" detail="Toujours affichée en premier.">
            <Oui valeur={epinglee} onChange={setEpinglee} />
          </Reglage>

          <Reglage titre="Bouton" detail="Un lien cliquable, facultatif.">
            <div className="flex gap-2">
              <input
                value={lienTexte}
                onChange={(e) => setLienTexte(e.target.value)}
                placeholder="Texte"
                maxLength={30}
                className="min-w-0 flex-1 rounded-full border border-bordure bg-verre
                           px-4 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <input
                value={lienUrl}
                onChange={(e) => setLienUrl(e.target.value)}
                placeholder="https://…"
                className="min-w-0 flex-1 rounded-full border border-bordure bg-verre
                           px-4 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </Reglage>

          <Reglage titre="Durée" detail="Jours d'affichage. 0 = sans fin.">
            <input
              type="number"
              min={0}
              max={365}
              value={jours}
              onChange={(e) => setJours(Number(e.target.value))}
              className="w-24 rounded-xl border border-bordure bg-fond px-3 py-2
                         text-center font-display text-xl focus:border-accent focus:outline-none"
            />
          </Reglage>

          <Reglage titre="Notifier" detail="Envoyer aussi une notification à tous.">
            <Oui valeur={notifier} onChange={setNotifier} />
          </Reglage>

          <div>
            <p className="mb-3 border-t border-filet pt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-encre-douce">
              Aperçu
            </p>
            <Annonces annonces={[apercu]} />
          </div>

          <Bouton
            type="button"
            disabled={enCours}
            onClick={() =>
              agir(() =>
                publierAnnonce({
                  titre,
                  corps,
                  ton,
                  jours,
                  notifier,
                  retirable,
                  epinglee,
                  couleur,
                  icone: icone || null,
                  lienTexte: lienTexte || null,
                  lienUrl: lienUrl || null,
                })
              )
            }
          >
            {enCours ? 'Publication…' : 'Publier'}
          </Bouton>
        </div>
      </section>

      {/* ---- Liste ---- */}
      <section className="rounded-carte border border-bordure bg-verre p-5">
        <h2 className="mb-4 text-2xl">Annonces</h2>
        {annonces.length === 0 ? (
          <p className="text-sm italic text-encre-douce">Aucune annonce.</p>
        ) : (
          <ul className="divide-y divide-filet">
            {annonces.map((a) => {
              const expiree = a.expireLe !== null && new Date(a.expireLe) < new Date()
              const etat = !a.active ? 'retirée' : expiree ? 'expirée' : 'active'
              return (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {a.icone && `${a.icone} `}
                      {a.titre}
                    </p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-encre-douce">
                      <span
                        className={
                          etat === 'active' ? 'text-accent-2' : undefined
                        }
                      >
                        {etat}
                      </span>{' '}
                      · {dateRelative(a.creeLe)}
                      {a.epinglee && ' · épinglée'}
                      {!a.retirable && ' · non retirable'}
                    </p>
                  </div>
                  {a.active && (
                    <button
                      type="button"
                      disabled={enCours}
                      onClick={() => agir(() => retirerAnnonce(a.id))}
                      className="shrink-0 rounded-full border border-bordure px-4 py-1.5
                                 text-xs font-semibold text-encre-douce hover:text-encre"
                    >
                      Retirer
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ---- Notification seule ---- */}
      <section className="rounded-carte border border-bordure bg-verre p-5">
        <h2 className="mb-1 text-2xl">Notification seule</h2>
        <p className="mb-4 text-sm leading-relaxed text-encre-douce">
          Une notification à tous les membres, sans créer d&apos;annonce.
        </p>

        <div className="flex flex-col gap-4">
          <Champ
            libelle="Titre"
            value={nTitre}
            onChange={(e) => setNTitre(e.target.value)}
            maxLength={80}
            placeholder="ex : Rappel"
          />
          <label className="block">
            <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-encre-douce">
              Message
            </span>
            <textarea
              value={nCorps}
              onChange={(e) => setNCorps(e.target.value)}
              rows={2}
              maxLength={200}
              className="w-full resize-y rounded-2xl border border-bordure bg-verre
                         px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <Bouton
            type="button"
            variante="discret"
            disabled={enCours}
            onClick={() => {
              if (!confirm('Envoyer cette notification à tous les membres ?')) return
              agir(async () => {
                const r = await diffuserNotification(nTitre, nCorps)
                if (!r.erreur) {
                  setNTitre('')
                  setNCorps('')
                }
                return r
              })
            }}
          >
            Envoyer à tous
          </Bouton>
        </div>
      </section>
    </div>
  )
}

function Reglage({
  titre,
  detail,
  children,
}: {
  titre: string
  detail: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-filet pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div>
        <p className="text-sm font-semibold">{titre}</p>
        <p className="mt-0.5 font-mono text-[10.5px] text-encre-douce">{detail}</p>
      </div>
      <div className="shrink-0 sm:min-w-[240px]">{children}</div>
    </div>
  )
}

function Oui({
  valeur,
  onChange,
}: {
  valeur: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-1 rounded-full border border-bordure bg-verre p-1">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={valeur === v}
          className={`flex-1 rounded-full px-4 py-1.5 text-xs font-semibold ${
            valeur === v ? 'bg-encre text-fond' : 'text-encre-douce'
          }`}
        >
          {v ? 'Oui' : 'Non'}
        </button>
      ))}
    </div>
  )
}
