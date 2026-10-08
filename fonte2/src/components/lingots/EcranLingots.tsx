import Link from 'next/link'
import {
  BONUS_CYCLE,
  TARIFS_COSMETIQUES,
  TARIFS_PREMIUM,
  formatLingots,
  type EtatLingots,
  type LigneLingots,
} from '@/lib/lingots'
import { IconeLingot } from './IconeLingot'

/* ============================================================
   Mes Lingots
   ============================================================
   Le solde en grand, l'avancée du bonus, les tarifs de la future
   boutique et l'historique, mois par mois.
   ============================================================ */

export function EcranLingots({ etat }: { etat: EtatLingots }) {
  const { bonus } = etat
  const faits = bonus.recupere ? bonus.jour : bonus.jour - 1

  // Historique groupé par mois.
  const mois: { cle: string; lignes: LigneLingots[] }[] = []
  for (const l of etat.historique) {
    const cle = l.jour.slice(0, 7)
    let m = mois.at(-1)
    if (!m || m.cle !== cle) {
      m = { cle, lignes: [] }
      mois.push(m)
    }
    m.lignes.push(l)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 py-4">
      <header className="mb-1 flex items-center gap-2.5">
        <Link
          href="/"
          aria-label="Retour"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pilule bg-verre text-encre"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="titre-page">Lingots</h1>
      </header>

      {/* Solde */}
      <section
        className="bloc flex flex-col gap-2.5 p-5"
        style={{ backgroundImage: 'radial-gradient(ellipse 120% 100% at 100% 0%, rgb(240 192 74 / 0.2), transparent 60%)' }}
      >
        <span className="text-[15px] text-encre-douce">Ton solde</span>
        <span className="flex items-center gap-3 text-[#f0c04a]">
          <IconeLingot className="h-11 w-11" plein={0.22} />
          <span className="font-display text-[72px] leading-[0.85]">{formatLingots(etat.solde)}</span>
        </span>
        <span className="text-[14px] text-encre-douce">
          {formatLingots(etat.gagne)} gagnés depuis le début
          {etat.depense > 0 ? ` · ${formatLingots(etat.depense)} dépensés` : ''}
        </span>
      </section>

      {/* Bonus */}
      <section className="bloc flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[16px] font-bold">Bonus du jour</span>
          {bonus.recupere ? (
            <span className="text-[14px] font-semibold text-valide">Récupéré</span>
          ) : (
            <Link href="/" className="text-[14px] font-semibold text-[#f0c04a]">
              À récupérer · +{bonus.montant}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1.5" aria-hidden>
          {BONUS_CYCLE.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-pilule ${
                i < faits ? 'bg-[#f0c04a]' : i === 6 ? 'bg-[#f0c04a]/30' : 'bg-encre/[0.08]'
              }`}
            />
          ))}
        </div>
        <span className="text-[14px] text-encre-douce">
          Jour {bonus.jour} sur 7 · {bonus.recupere ? `demain +${bonus.demain}` : `aujourd'hui +${bonus.montant}`} ·
          le jour 7 vaut 40
        </span>
      </section>

      {/* Tarifs à venir */}
      <section className="bloc flex flex-col gap-3 p-4">
        <Link href="/boutique" className="appui -m-1 flex items-center justify-between rounded-bloc p-1">
          <span className="text-[16px] font-bold">Boutique</span>
          <span className="text-[14px] font-semibold text-[#f0c04a]">Ouvrir ›</span>
        </Link>
        <div className="grid grid-cols-3 gap-1.5">
          {TARIFS_COSMETIQUES.map((t) => (
            <div key={t.nom} className="flex flex-col gap-1 rounded-bloc bg-verre-fort p-2.5">
              <span className="text-[13px] text-encre-douce">{t.nom}</span>
              <span className="font-mono text-[15px] text-[#f0c04a]">{formatLingots(t.prix)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <p className="pt-1 pb-0.5 text-[13px] text-encre-douce">Premium en Lingots · bientôt</p>
          {TARIFS_PREMIUM.map((t) => (
            <div key={t.nom} className="flex items-baseline justify-between gap-3 border-b border-filet py-2.5 last:border-0">
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px]">{t.nom}</span>
                {t.limite && <span className="text-[12px] text-encre-douce">{t.limite}</span>}
              </span>
              <span className="shrink-0 font-mono text-[15px] text-[#f0c04a]">{formatLingots(t.prix)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Historique */}
      {mois.length === 0 ? (
        <p className="mt-2 px-0.5 text-[15px] leading-relaxed text-encre-douce">
          Aucun mouvement pour l&apos;instant. Récupère ton bonus du jour sur l&apos;accueil et monte
          de niveau pour gagner tes premiers Lingots.
        </p>
      ) : (
        mois.map((m) => (
          <section key={m.cle} className="mt-3 flex flex-col">
            <p className="etiquette px-0.5 pb-1.5">{nomMois(m.cle)}</p>
            <ul className="flex flex-col">
              {m.lignes.map((l, i) => (
                <li key={i} className="flex min-h-14 items-center gap-3 px-0.5">
                  <Icone source={l.source} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[16px]">{l.libelle}</span>
                    <span className="text-[13px] text-encre-douce">{jourCourt(l.jour)}</span>
                  </span>
                  <span className={`font-mono text-[15px] ${l.montant > 0 ? 'text-[#f0c04a]' : 'text-encre-douce'}`}>
                    {l.montant > 0 ? '+' : '−'}
                    {formatLingots(Math.abs(l.montant))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <p className="mt-2 px-0.5 text-[13px] leading-relaxed text-encre-douce">
        Les Lingots se gagnent en t&apos;entraînant et en revenant chaque jour, jamais avec de
        l&apos;argent. Ton historique est privé.
      </p>
    </div>
  )
}

function Icone({ source }: { source: LigneLingots['source'] }) {
  if (source === 'palier')
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent/15 text-accent-clair">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
        </svg>
      </span>
    )
  if (source === 'achat')
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent-2/15 text-accent-2">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 8h14l-1.5 11h-11zM9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      </span>
    )
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f0c04a]/15 text-[#f0c04a]">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
    </span>
  )
}

function nomMois(cle: string): string {
  const d = new Date(cle + '-15T12:00:00')
  if (Number.isNaN(d.getTime())) return cle
  const nom = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return nom.charAt(0).toUpperCase() + nom.slice(1)
}

function jourCourt(date: string): string {
  const d = new Date(date + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return date
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short' })} ${d.getDate()}`
}
