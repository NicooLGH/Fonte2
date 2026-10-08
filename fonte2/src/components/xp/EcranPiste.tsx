'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { calculerNiveau, rang, xpCumulePourNiveau, RANGS } from '@/lib/xp'
import {
  CADRES,
  LIBELLE_TYPE,
  RECOMPENSES,
  donneLingots,
  recompensesDuNiveau,
  type Recompense,
} from '@/lib/recompenses'
import { equiperRecompense } from '@/app/(carnet)/piste/actions'
import { montantPalier } from '@/lib/lingots'
import { IconeLingot as Lingot } from '@/components/lingots/IconeLingot'
import { Echantillon, type AmiPiste } from './PisteNiveaux'
import { ApercuEntete } from './ApercuEntete'
import { Visage } from '@/components/Visage'

/* ============================================================
   Piste complète
   ============================================================
   Tous les niveaux à la verticale, du plus haut au plus bas :
   les passés en orange, le mien en grand, les suivants en gris.
   Un niveau à récompense s'ouvre : aperçu sur mon profil, et
   bouton Équiper s'il est atteint.
   ============================================================ */

type Equipement = { teinte: string; motif: string; cadre: string }

export function EcranPiste({
  total,
  rythme,
  profil,
  amis,
}: {
  total: number
  /** XP moyenne par semaine, pour estimer les délais. */
  rythme: number | null
  profil: Equipement & { pseudo: string; avatar: string }
  amis: AmiPiste[]
}) {
  const n = calculerNiveau(total)
  const [equipe, setEquipe] = useState<Equipement>({
    teinte: profil.teinte,
    motif: profil.motif,
    cadre: profil.cadre,
  })
  const [ouvert, setOuvert] = useState<number | null>(null)
  const actuel = useRef<HTMLLIElement>(null)

  // La piste s'ouvre sur mon niveau.
  useEffect(() => {
    actuel.current?.scrollIntoView({ block: 'center' })
  }, [])

  const haut = Math.ceil(Math.max(85, n.niveau + 10) / 5) * 5
  const niveaux = Array.from({ length: haut }, (_, i) => haut - i)
  const prochaine = RECOMPENSES.filter((r) => r.niveau > n.niveau).sort((a, b) => a.niveau - b.niveau)[0]
  const niveauxARecompense = [...new Set(RECOMPENSES.filter((r) => r.niveau > 0).map((r) => r.niveau))]
    .concat(niveaux.filter(donneLingots))
    .sort((a, b) => a - b)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-4">
      <header className="flex items-center gap-2.5">
        <Link
          href="/xp"
          aria-label="Retour"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pilule bg-verre text-encre"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="titre-page">Piste</h1>
      </header>

      {/* Mon niveau */}
      <section
        className="bloc flex flex-col gap-3.5 p-4"
        style={{ backgroundImage: `radial-gradient(ellipse 120% 100% at 100% 0%, ${couleurRang(n.niveau)}24, transparent 60%)` }}
      >
        <div className="flex items-center gap-3.5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-accent font-display text-[36px] text-accent">
            {n.niveau}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className="self-start rounded-pilule px-2.5 py-1 font-mono text-[11px] uppercase"
              style={{ background: `${couleurRang(n.niveau)}29`, color: couleurRang(n.niveau) }}
            >
              {n.rang} · {n.niveau}
            </span>
            <span className="text-[15px] text-encre-douce">
              <span className="font-semibold text-encre">
                {(n.xp - n.xpDebut).toLocaleString('fr-FR')} / {(n.xpSuivant - n.xpDebut).toLocaleString('fr-FR')} XP
              </span>{' '}
              · encore {(n.xpSuivant - n.xp).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-pilule bg-encre/[0.08]">
          <div className="h-full rounded-pilule bg-accent" style={{ width: `${Math.round(n.progression * 100)}%` }} />
        </div>
        {prochaine && (
          <button
            type="button"
            onClick={() => setOuvert(prochaine.niveau)}
            className="appui flex items-center gap-3 rounded-bloc bg-verre-fort px-3 py-2.5 text-left"
          >
            <Echantillon r={prochaine} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] text-encre-douce">Prochaine récompense · niv. {prochaine.niveau}</span>
              <span className="truncate text-[15px] font-semibold">
                {LIBELLE_TYPE[prochaine.type]} {prochaine.nom}
              </span>
            </span>
            {rythme && (
              <span className="shrink-0 font-mono text-[12px] text-encre-douce">
                {delai(xpCumulePourNiveau(prochaine.niveau) - n.xp, rythme)}
              </span>
            )}
          </button>
        )}
      </section>

      {/* La piste */}
      <ol className="flex flex-col pb-4" aria-label="Niveaux">
        {niveaux.map((l) => {
          const recompenses = recompensesDuNiveau(l)
          const lingots = donneLingots(l)
          const ici = amis.filter((a) => a.niveau === l)
          const estMoi = l === n.niveau
          const passe = l < n.niveau
          const rangIci = RANGS.find((r) => r.niveau === l && r.niveau > 0)
          const riche = recompenses.length > 0
          const hauteur = riche ? 64 : lingots || estMoi || ici.length ? 52 : 36
          const orange = 'var(--color-accent)'
          const gris = 'color-mix(in srgb, var(--color-encre) 8%, transparent)'
          const ouvrable = riche || lingots

          const contenu = (
            <>
              <span className="relative flex w-11 shrink-0 items-center justify-center">
                <span
                  aria-hidden
                  className="absolute top-0 left-5 h-1/2 w-1"
                  style={{ background: l === haut ? 'transparent' : l + 1 <= n.niveau ? orange : gris }}
                />
                <span
                  aria-hidden
                  className="absolute bottom-0 left-5 h-1/2 w-1"
                  style={{ background: l <= n.niveau ? orange : gris }}
                />
                {estMoi ? (
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-accent bg-fond font-display text-[24px] text-accent">
                    {l}
                  </span>
                ) : riche || lingots ? (
                  <span
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full font-mono text-[12px] ${
                      passe ? 'bg-accent text-white' : 'bg-verre-fort text-encre-douce'
                    }`}
                  >
                    {l}
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={`relative h-3 w-3 rounded-full ${passe ? 'bg-accent' : 'bg-verre-fort'}`}
                  />
                )}
              </span>

              <span className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5">
                {riche && (
                  <span
                    className={`flex min-w-0 flex-1 items-center gap-3 rounded-bloc px-3 py-2.5 ${
                      prochaine?.niveau === l ? 'bg-accent/10 ring-[1.5px] ring-accent/50 ring-inset' : 'bg-verre'
                    }`}
                  >
                    <Echantillon r={recompenses[0]} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-semibold">
                        {recompenses.length > 1
                          ? recompenses.map((r) => r.nom).join(' · ')
                          : `${LIBELLE_TYPE[recompenses[0].type]} ${recompenses[0].nom}`}
                      </span>
                      <span className="text-[13px] text-encre-douce">
                        {recompenses.length > 1
                          ? `${recompenses.length} récompenses`
                          : prochaine?.niveau === l
                            ? 'Prochaine récompense'
                            : LIBELLE_TYPE[recompenses[0].type]}
                      </span>
                    </span>
                    {l <= n.niveau ? <IconeOk /> : <IconeCadenas />}
                  </span>
                )}
                {lingots && !riche && <PuceLingots montant={montantPalier(l)} credite={l <= n.niveau} />}
                {estMoi && (
                  <span className="shrink-0 rounded-pilule bg-encre px-3 py-1.5 text-[14px] font-bold text-fond">
                    Toi · {Math.round(n.progression * 100)} %
                  </span>
                )}
                {ici.length > 0 && (
                  <span className="flex min-w-0 items-center gap-2 text-[14px] text-encre-douce">
                    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-verre-fort text-[15px]">
                      <Visage avatar={ici[0].avatar} />
                    </span>
                    <span className="truncate">
                      {ici[0].pseudo}
                      {ici.length > 1 ? ` +${ici.length - 1}` : ''}
                    </span>
                  </span>
                )}
              </span>
            </>
          )

          return (
            <li key={l} ref={estMoi ? actuel : undefined}>
              {rangIci && (
                <div className="flex items-center gap-2.5 pt-2.5 pb-1.5" aria-hidden>
                  <span className="h-px flex-1" style={{ background: `${couleurRang(l)}59` }} />
                  <span className="font-mono text-[11px] tracking-[0.08em] uppercase" style={{ color: couleurRang(l) }}>
                    {rangIci.nom} · niv. {l}
                  </span>
                  <span className="h-px flex-1" style={{ background: `${couleurRang(l)}59` }} />
                </div>
              )}
              {ouvrable ? (
                <button
                  type="button"
                  onClick={() => setOuvert(l)}
                  aria-label={`Niveau ${l}`}
                  className="flex w-full items-stretch gap-3 text-left"
                  style={{ minHeight: hauteur }}
                >
                  {contenu}
                </button>
              ) : (
                <div className="flex items-stretch gap-3" style={{ minHeight: hauteur }} aria-label={`Niveau ${l}`}>
                  {contenu}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <p className="px-0.5 text-[13px] leading-relaxed text-encre-douce">
        Les niveaux continuent après {haut}. Après le niveau 80, +500 Lingots tous les 5 niveaux.
      </p>

      <FicheNiveau
        niveau={ouvert}
        total={total}
        rythme={rythme}
        profil={profil}
        equipe={equipe}
        onEquipe={setEquipe}
        onFermer={() => setOuvert(null)}
        onAller={setOuvert}
        voisins={niveauxARecompense}
      />
    </div>
  )
}

/* ---- Un niveau touché ---- */

function FicheNiveau({
  niveau,
  total,
  rythme,
  profil,
  equipe,
  onEquipe,
  onFermer,
  onAller,
  voisins,
}: {
  niveau: number | null
  total: number
  rythme: number | null
  profil: { pseudo: string; avatar: string }
  equipe: Equipement
  onEquipe: (e: Equipement) => void
  onFermer: () => void
  onAller: (n: number) => void
  voisins: number[]
}) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [, demarrer] = useTransition()
  const l = niveau ?? 0
  const n = calculerNiveau(total)
  const atteint = l <= n.niveau
  const recompenses = recompensesDuNiveau(l)
  const lingots = donneLingots(l)
  const avant = [...voisins].reverse().find((v) => v < l)
  const apres = voisins.find((v) => v > l)

  // Aperçu : mon profil, avec les récompenses de ce niveau posées dessus.
  const apercu: Equipement = { ...equipe }
  for (const r of recompenses) apercu[r.type === 'teinte' ? 'teinte' : r.type] = r.cle

  function equiper(r: Recompense) {
    const type = r.type === 'teinte' ? 'teinte' : r.type
    const avantEquipe = equipe
    onEquipe({ ...equipe, [type]: r.cle })
    setErreur(null)
    demarrer(async () => {
      const res = await equiperRecompense(r.type, r.cle)
      if (res.erreur) {
        onEquipe(avantEquipe)
        setErreur(res.erreur)
      }
    })
  }

  const reste = xpCumulePourNiveau(l) - total

  return (
    <Modale
      titre={`Niveau ${l}`}
      sousTitre={`Rang ${rang(l)}`}
      ouverte={niveau !== null}
      onFermer={() => {
        setErreur(null)
        onFermer()
      }}
    >
      <div className="flex flex-col gap-4">
        {recompenses.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-encre-douce">Aperçu sur ton profil</span>
            <ApercuEntete
              teinte={apercu.teinte}
              motif={apercu.motif}
              cadre={apercu.cadre}
              avatar={profil.avatar}
              pseudo={profil.pseudo}
              sousTitre={`${rang(Math.max(l, n.niveau))} · ${Math.max(l, n.niveau)}`}
            />
          </div>
        )}

        {recompenses.map((r) => {
          const type = r.type === 'teinte' ? 'teinte' : r.type
          const porte = equipe[type] === r.cle
          return (
            <div key={`${r.type}-${r.cle}`} className="flex items-center gap-3 rounded-bloc bg-verre-fort p-3">
              <Echantillon r={r} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[16px] font-semibold">
                  {LIBELLE_TYPE[r.type]} {r.nom}
                </span>
                <span className="text-[13px] text-encre-douce">
                  {porte ? 'Sur ton profil' : atteint ? `Débloqué au niveau ${l}` : `Se débloque au niveau ${l}`}
                </span>
              </span>
              {atteint ? (
                porte ? (
                  <span className="flex h-11 items-center gap-1.5 rounded-pilule bg-valide/15 px-4 text-[15px] font-semibold text-valide">
                    <IconeOk /> Équipé
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => equiper(r)}
                    className="appui h-11 shrink-0 rounded-pilule bg-accent px-4 text-[15px] font-bold text-white"
                  >
                    Équiper
                  </button>
                )
              ) : (
                <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-pilule bg-verre px-3.5 text-[14px] text-encre-douce">
                  <IconeCadenas /> Niv. {l}
                </span>
              )}
            </div>
          )
        })}

        {lingots && (
          <div className="flex items-center gap-3 rounded-bloc bg-[#f0c04a]/10 p-3">
            <Lingot className="h-7 w-7 shrink-0 text-[#f0c04a]" plein={0.25} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[16px] font-semibold">+{montantPalier(l).toLocaleString('fr-FR')} Lingots</span>
              <span className="text-[13px] text-encre-douce">
                {atteint ? 'Crédités sur ton solde.' : `Versés en atteignant le niveau ${l}.`}
              </span>
            </span>
            {atteint && <IconeOk />}
          </div>
        )}

        {!atteint && (
          <div className="flex flex-col gap-2">
            <div className="h-2 overflow-hidden rounded-pilule bg-encre/[0.08]">
              <div
                className="h-full rounded-pilule bg-accent"
                style={{ width: `${Math.min(100, Math.round((total / Math.max(1, xpCumulePourNiveau(l))) * 100))}%` }}
              />
            </div>
            <span className="text-[14px] text-encre-douce">
              Encore {reste.toLocaleString('fr-FR')} XP
              {rythme ? ` · ${delai(reste, rythme, true)} à ton rythme` : ''}
            </span>
          </div>
        )}

        {erreur && <p className="font-mono text-[13px] text-accent">{erreur}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={avant === undefined}
            onClick={() => avant !== undefined && onAller(avant)}
            className="appui flex h-12 items-center justify-center gap-1.5 rounded-bloc bg-verre-fort text-[15px] font-semibold disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {avant !== undefined ? `Niv. ${avant}` : 'Début'}
          </button>
          <button
            type="button"
            disabled={apres === undefined}
            onClick={() => apres !== undefined && onAller(apres)}
            className="appui flex h-12 items-center justify-center gap-1.5 rounded-bloc bg-verre-fort text-[15px] font-semibold disabled:opacity-40"
          >
            {apres !== undefined ? `Niv. ${apres}` : 'Fin'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </Modale>
  )
}

/* ---- Petits éléments ---- */

function PuceLingots({ montant, credite }: { montant: number; credite: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-pilule px-3 py-1.5 text-[14px] font-semibold ${
        credite ? 'bg-[#f0c04a]/10 text-[#f0c04a]/70' : 'bg-[#f0c04a]/10 text-[#f0c04a]'
      }`}
    >
      <Lingot className="h-4 w-4" />+{montant.toLocaleString('fr-FR')}
      {credite && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"
          strokeLinecap="round" strokeLinejoin="round" aria-label="Crédité">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
    </span>
  )
}

function IconeOk() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" aria-label="Débloqué" className="shrink-0 text-valide">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function IconeCadenas() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-label="Verrouillé" className="shrink-0 text-encre-douce">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/** Couleur d'un rang : celle du cadre du même nom. */
function couleurRang(niveau: number): string {
  const nom = rang(niveau)
  const cle = nom === 'Légende' ? 'legende' : nom.toLowerCase()
  return CADRES.find((c) => c.cle === cle)?.couleur ?? '#8d9096'
}

/** « ≈ 3 sem. », « ≈ 5 mois », « ≈ 1,5 an ». */
function delai(xp: number, rythme: number, long = false): string {
  if (xp <= 0) return long ? 'tout de suite' : 'atteint'
  const semaines = Math.ceil(xp / rythme)
  if (semaines <= 1) return long ? 'environ une semaine' : '≈ 1 sem.'
  if (semaines <= 8) return long ? `environ ${semaines} semaines` : `≈ ${semaines} sem.`
  const mois = Math.round(semaines / 4.35)
  if (mois < 24) return long ? `environ ${mois} mois` : `≈ ${mois} mois`
  const ans = (semaines / 52).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  return long ? `environ ${ans} ans` : `≈ ${ans} ans`
}
