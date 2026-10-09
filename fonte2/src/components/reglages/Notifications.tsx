'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  activerSurAppareil,
  desactiverSurAppareil,
  etatAppareil,
  abonnementActuel,
  type EtatAppareil,
} from '@/lib/push'
import {
  definirPreferencesPush,
  enregistrerAppareil,
  essayerPush,
  retirerAppareil,
  type PreferencesPush,
} from '@/app/(carnet)/reglages/push'

/* ============================================================
   Réglages · Notifications (session 12)
   ============================================================ */

const CATEGORIES: { cle: keyof Omit<PreferencesPush, 'heure'>; titre: string; detail: string }[] = [
  { cle: 'amis', titre: 'Amis', detail: "Demandes d'ami et nouvelles amitiés." },
  { cle: 'social', titre: 'Réactions', detail: 'Réactions et commentaires sur tes séances.' },
  { cle: 'rappels', titre: 'Rappels', detail: 'Séance prévue du jour, bonus de Lingots avant minuit.' },
  { cle: 'defis', titre: 'Défis', detail: "Un défi se termine bientôt et tu ne l'as pas encore réussi." },
  { cle: 'annonces', titre: 'Annonces', detail: 'Nouveautés de FONTE, rarement.' },
]

const HEURES = Array.from({ length: 17 }, (_, i) => i + 6)

export function Notifications({ preferences }: { preferences: PreferencesPush }) {
  const [etat, setEtat] = useState<EtatAppareil | null>(null)
  const [prefs, setPrefs] = useState(preferences)
  const [message, setMessage] = useState<{ ok?: string; ko?: string }>({})
  const [enCours, demarrer] = useTransition()

  useEffect(() => {
    let vivant = true
    etatAppareil().then(async (e) => {
      if (!vivant) return
      setEtat(e)
      // Appareil déjà abonné : on rafraîchit l'enregistrement
      // (utile si quelqu'un d'autre s'était connecté dessus).
      if (e === 'actif') {
        const cle = await abonnementActuel()
        if (cle) enregistrerAppareil(cle).catch(() => {})
      }
    })
    return () => {
      vivant = false
    }
  }, [])

  function activer() {
    setMessage({})
    demarrer(async () => {
      const r = await activerSurAppareil()
      if (!r.ok) {
        setMessage({ ko: r.erreur })
        setEtat(await etatAppareil())
        return
      }
      const s = await enregistrerAppareil(r.cle)
      setMessage({ ok: s.succes, ko: s.erreur })
      if (!s.erreur) setEtat('actif')
    })
  }

  function desactiver() {
    setMessage({})
    demarrer(async () => {
      const endpoint = await desactiverSurAppareil()
      const s = await retirerAppareil(endpoint)
      setMessage({ ok: s.succes, ko: s.erreur })
      setEtat(await etatAppareil())
    })
  }

  function changer(nouvelles: PreferencesPush) {
    const avant = prefs
    setPrefs(nouvelles)
    setMessage({})
    demarrer(async () => {
      const r = await definirPreferencesPush(nouvelles)
      if (r.erreur) {
        setPrefs(avant)
        setMessage({ ko: r.erreur })
      }
    })
  }

  function essayer() {
    setMessage({})
    demarrer(async () => {
      const r = await essayerPush()
      setMessage({ ok: r.succes, ko: r.erreur })
    })
  }

  const actif = etat === 'actif'

  return (
    <section className="flex flex-col gap-2">
      <p className="section-titre px-0.5">Notifications</p>
      <div className="bloc flex flex-col divide-y divide-filet px-4">
        <div className="flex flex-col gap-3 py-3.5">
          <div>
            <p className="text-[16px] font-semibold">Sur cet appareil</p>
            <p className="mt-0.5 text-[13px] leading-snug text-encre-douce">
              {etat === null && 'Vérification…'}
              {etat === 'indisponible' && 'Ce navigateur ne gère pas les notifications.'}
              {etat === 'iphone-installer' &&
                "Sur iPhone, les notifications ne marchent qu'une fois FONTE ajoutée à l'écran d'accueil : Partager → Sur l'écran d'accueil, puis ouvre FONTE depuis l'icône."}
              {etat === 'refuse' &&
                'Les notifications sont bloquées pour FONTE. Autorise-les dans les réglages du navigateur ou du téléphone, puis reviens ici.'}
              {etat === 'inactif' && 'Reçois les nouvelles de tes amis et tes rappels, même appli fermée.'}
              {etat === 'actif' && 'Activées. Chaque appareil se règle séparément.'}
            </p>
          </div>
          {(etat === 'inactif' || etat === 'actif') && (
            <div className="flex flex-wrap gap-2">
              {actif ? (
                <>
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={essayer}
                    className="h-10 rounded-pilule bg-encre px-4 text-[14px] font-semibold text-fond disabled:opacity-60"
                  >
                    Envoyer un essai
                  </button>
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={desactiver}
                    className="h-10 rounded-pilule bg-verre-fort px-4 text-[14px] text-encre-douce hover:text-encre disabled:opacity-60"
                  >
                    Désactiver
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={enCours}
                  onClick={activer}
                  className="h-10 rounded-pilule bg-accent px-4 text-[14px] font-semibold text-white disabled:opacity-60"
                >
                  Activer les notifications
                </button>
              )}
            </div>
          )}
          {(message.ok || message.ko) && (
            <p className={`text-[13px] ${message.ko ? 'text-accent' : 'text-encre-douce'}`} role="status">
              {message.ko ?? message.ok}
            </p>
          )}
        </div>

        {CATEGORIES.map((c) => (
          <div key={c.cle} className="flex items-center justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <p className="text-[16px] font-semibold">{c.titre}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-encre-douce">{c.detail}</p>
            </div>
            <Interrupteur
              valeur={prefs[c.cle]}
              libelle={c.titre}
              desactive={enCours}
              onChange={(v) => changer({ ...prefs, [c.cle]: v })}
            />
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[16px] font-semibold">Heure du rappel</p>
            <p className="mt-0.5 text-[13px] leading-snug text-encre-douce">
              Les jours de séance prévus, si tu ne t&apos;es pas encore entraîné.
            </p>
          </div>
          <select
            value={prefs.heure}
            disabled={enCours || !prefs.rappels}
            onChange={(e) => changer({ ...prefs, heure: Number(e.target.value) })}
            aria-label="Heure du rappel"
            className="h-10 shrink-0 rounded-pilule bg-verre-fort px-3 font-mono text-[14px] disabled:opacity-50"
          >
            {HEURES.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}h00
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
}

function Interrupteur({
  valeur,
  libelle,
  desactive,
  onChange,
}: {
  valeur: boolean
  libelle: string
  desactive: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valeur}
      aria-label={libelle}
      disabled={desactive}
      onClick={() => onChange(!valeur)}
      className="shrink-0 disabled:opacity-60"
    >
      <span
        className={`relative block h-[30px] w-[52px] rounded-pilule transition-colors ${
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
