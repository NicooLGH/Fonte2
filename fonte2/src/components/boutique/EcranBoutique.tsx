'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Modale } from '@/components/ui/Modale'
import { usePastille, Pastille } from '@/components/ui/Pastille'
import { IconeLingot } from '@/components/lingots/IconeLingot'
import { ApercuEntete } from '@/components/xp/ApercuEntete'
import {
  CATALOGUE,
  LIBELLE_OBJET,
  PRIX,
  PRIX_MYSTERE,
  RARETES,
  REMBOURSEMENT,
  couleurRarete,
  objet,
  possede,
  valeurAvatar,
  type EtatBoutique,
  type ObjetBoutique,
  type Possession,
  type Rarete,
  type TypeObjet,
} from '@/lib/boutique'
import { formatLingots } from '@/lib/lingots'
import { acheterObjet, equiperObjet, ouvrirMystere } from '@/app/(carnet)/boutique/actions'
import { ApercuObjet } from './ApercuObjet'

/* ============================================================
   Boutique
   ============================================================
   À la une (−20 % cette semaine), trois boîtes mystère et le
   catalogue complet. Chaque achat est confirmé par la base ; le
   solde affiché suit ce qu'elle renvoie.
   ============================================================ */

type Profil = { pseudo: string; avatar: string; teinte: string; motif: string; cadre: string }
type Equipement = { teinte: string; motif: string; cadre: string; avatar: string }

const FILTRES: { cle: TypeObjet | 'tout'; nom: string }[] = [
  { cle: 'tout', nom: 'Tout' },
  { cle: 'teinte', nom: 'Teintes' },
  { cle: 'motif', nom: 'Motifs' },
  { cle: 'cadre', nom: 'Cadres' },
  { cle: 'avatar', nom: 'Avatars' },
]

export function EcranBoutique({ etat, profil }: { etat: EtatBoutique; profil: Profil }) {
  const [solde, setSolde] = useState(etat.solde)
  const [possessions, setPossessions] = useState<Possession[]>(etat.possessions)
  const [equipe, setEquipe] = useState<Equipement>({
    teinte: profil.teinte,
    motif: profil.motif,
    cadre: profil.cadre,
    avatar: profil.avatar,
  })
  const [filtre, setFiltre] = useState<TypeObjet | 'tout'>('tout')
  const [fiche, setFiche] = useState<ObjetBoutique | null>(null)
  const [boite, setBoite] = useState<Rarete | null>(null)
  const pastille = usePastille(filtre)

  const une = etat.une ? objet(etat.une.type, etat.une.cle) : null
  const prixDe = (o: ObjetBoutique) =>
    etat.une && etat.une.type === o.type && etat.une.cle === o.cle ? etat.une.prix : PRIX[o.rarete]

  function ajouter(p: Possession) {
    setPossessions((l) => (possede(l, p.type, p.cle) ? l : [...l, p]))
  }

  const liste = CATALOGUE.filter((o) => filtre === 'tout' || o.type === filtre)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 py-4">
      <header className="flex items-center gap-2.5">
        <Link
          href="/lingots"
          aria-label="Retour"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pilule bg-verre text-encre"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="titre-page flex-1">Boutique</h1>
        <Link
          href="/lingots"
          aria-label={`Mes Lingots : ${formatLingots(solde)}`}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-pilule bg-verre pr-3 pl-2.5 font-mono text-[15px] text-[#f0c04a]"
        >
          <IconeLingot className="h-5 w-5" />
          {formatLingots(solde)}
        </Link>
      </header>

      {/* À la une */}
      {une && etat.une && (
        <button
          type="button"
          onClick={() => setFiche(une)}
          className="appui overflow-hidden rounded-carte bg-verre text-left"
          style={{ boxShadow: `inset 0 0 0 1px ${couleurRarete(une.rarete)}80` }}
        >
          <div className="relative">
            <ApercuObjet o={une} avatar={equipe.avatar} hauteur={150} />
            <span className="absolute top-3 left-3 rounded-pilule bg-fond/70 px-2.5 py-1 font-mono text-[11px] tracking-[0.06em] uppercase">
              À la une · cette semaine
            </span>
            <span className="absolute top-3 right-3 rounded-pilule bg-accent px-2.5 py-1 font-mono text-[12px] text-white">
              −20 %
            </span>
          </div>
          <div className="flex items-end justify-between gap-3 px-4 pt-2 pb-4">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-[11px] uppercase" style={{ color: couleurRarete(une.rarete) }}>
                {RARETES.find((r) => r.cle === une.rarete)?.nom} · {LIBELLE_OBJET[une.type].toLowerCase()}
              </span>
              <span className="truncate font-display text-[38px] leading-[0.9]">{une.nom}</span>
            </span>
            {possede(possessions, une.type, une.cle) ? (
              <span className="shrink-0 text-[14px] font-semibold text-valide">Possédé</span>
            ) : (
              <span className="flex shrink-0 flex-col items-end font-mono">
                <span className="text-[13px] text-encre-douce line-through">{formatLingots(PRIX[une.rarete])}</span>
                <span className="text-[18px] text-[#f0c04a]">{formatLingots(etat.une.prix)}</span>
              </span>
            )}
          </div>
        </button>
      )}

      {/* Boîtes mystère */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between px-0.5">
          <span className="text-[17px] font-bold">Boîtes mystère</span>
          <span className="text-[13px] text-encre-douce">un objet au hasard</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {RARETES.map((r) => {
            const n = CATALOGUE.filter((o) => o.rarete === r.cle).length
            return (
              <button
                key={r.cle}
                type="button"
                onClick={() => setBoite(r.cle)}
                className="appui flex flex-col items-center gap-2 rounded-bloc bg-verre px-2 py-3"
                style={{ boxShadow: `inset 0 0 0 1px ${r.couleur}55` }}
              >
                <IconeBoite couleur={r.couleur} taille={52} />
                <span className="font-mono text-[11px] uppercase" style={{ color: r.couleur }}>
                  {r.boite}
                </span>
                <span className="font-mono text-[15px] text-[#f0c04a]">{formatLingots(PRIX_MYSTERE[r.cle])}</span>
                <span className="text-center text-[11px] leading-tight text-encre-douce">1 chance sur {n}</span>
              </button>
            )
          })}
        </div>
        <p className="px-0.5 text-[13px] leading-relaxed text-encre-douce">
          Doublon : la moitié du prix t&apos;est rendue. Chaque objet de la rareté a la même chance.
        </p>
      </section>

      {/* Catalogue */}
      <section className="flex flex-col gap-3">
        <span className="px-0.5 text-[17px] font-bold">Catalogue</span>
        <div
          ref={pastille.ref}
          role="group"
          aria-label="Type d'objet"
          className="defilement-isole relative -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          <Pastille pos={pastille.pos} />
          {FILTRES.map((f) => (
            <button
              key={f.cle}
              type="button"
              onClick={() => setFiltre(f.cle)}
              aria-pressed={filtre === f.cle}
              data-actif={filtre === f.cle}
              className={`relative h-9 shrink-0 rounded-pilule px-3.5 text-[14px] transition-colors duration-300 ${
                filtre === f.cle ? `${pastille.fond} font-semibold text-fond` : 'bg-verre text-encre-douce hover:text-encre'
              }`}
            >
              {f.nom}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {liste.map((o) => {
            const a = possede(possessions, o.type, o.cle)
            return (
              <button
                key={`${o.type}-${o.cle}`}
                type="button"
                onClick={() => setFiche(o)}
                className="appui flex flex-col gap-2 rounded-bloc bg-verre p-2 text-left"
                style={{ boxShadow: `inset 0 0 0 1px ${couleurRarete(o.rarete)}40` }}
              >
                <div className="relative">
                  <ApercuObjet o={o} avatar={equipe.avatar} />
                  {a && (
                    <span className="absolute top-1.5 right-1.5 rounded-pilule bg-valide/20 px-2 py-0.5 text-[11px] font-semibold text-valide">
                      Possédé
                    </span>
                  )}
                </div>
                <span className="truncate px-0.5 text-[14px] font-semibold">{o.nom}</span>
                <span className="flex justify-between px-0.5 pb-0.5 font-mono text-[12px]">
                  <span className="uppercase" style={{ color: couleurRarete(o.rarete) }}>
                    {LIBELLE_OBJET[o.type]}
                  </span>
                  <span className={a ? 'text-valide' : 'text-[#f0c04a]'}>{a ? '✓' : formatLingots(prixDe(o))}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <p className="px-0.5 text-[13px] leading-relaxed text-encre-douce">
        Collection Fonderie · 26 objets exclusifs. Ils ne sont jamais sur la piste, et les cadres de
        rang ne s&apos;achètent pas. Un achat est définitif.
      </p>

      <FicheObjet
        o={fiche}
        prix={fiche ? prixDe(fiche) : 0}
        solde={solde}
        possede={fiche ? possede(possessions, fiche.type, fiche.cle) : false}
        equipe={equipe}
        profil={profil}
        onFermer={() => setFiche(null)}
        onAchat={(o, s) => {
          setSolde(s)
          ajouter({ type: o.type, cle: o.cle })
        }}
        onEquipe={setEquipe}
      />

      <BoiteMystere
        rarete={boite}
        solde={solde}
        possessions={possessions}
        equipe={equipe}
        onFermer={() => setBoite(null)}
        onResultat={(p, s) => {
          setSolde(s)
          if (p) ajouter(p)
        }}
        onEquipe={setEquipe}
      />
    </div>
  )
}

/* ---- Fiche d'un objet ---- */

function FicheObjet({
  o,
  prix,
  solde,
  possede: aDeja,
  equipe,
  profil,
  onFermer,
  onAchat,
  onEquipe,
}: {
  o: ObjetBoutique | null
  prix: number
  solde: number
  possede: boolean
  equipe: Equipement
  profil: Profil
  onFermer: () => void
  onAchat: (o: ObjetBoutique, solde: number) => void
  onEquipe: (e: Equipement) => void
}) {
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  if (!o) return <Modale titre="" ouverte={false} onFermer={onFermer}>{null}</Modale>

  const valeur = o.type === 'avatar' ? valeurAvatar(o.cle) : o.cle
  const porte = equipe[o.type] === valeur
  const apercu = { ...equipe, [o.type]: valeur }
  const manque = prix - solde
  const r = RARETES.find((x) => x.cle === o.rarete)!

  function acheter() {
    if (!o) return
    setErreur(null)
    demarrer(async () => {
      const res = await acheterObjet(o.type, o.cle)
      if (res.erreur) setErreur(res.erreur)
      else onAchat(o, res.solde ?? solde - prix)
    })
  }

  function equiper() {
    if (!o) return
    setErreur(null)
    const avant = equipe
    onEquipe({ ...equipe, [o.type]: valeur })
    demarrer(async () => {
      const res = await equiperObjet(o.type, o.cle)
      if (res.erreur) {
        onEquipe(avant)
        setErreur(res.erreur)
      }
    })
  }

  return (
    <Modale
      titre={o.nom}
      sousTitre={`${r.nom} · ${LIBELLE_OBJET[o.type].toLowerCase()}`}
      ouverte
      onFermer={() => {
        setErreur(null)
        onFermer()
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-encre-douce">Aperçu sur ton profil</span>
          <ApercuEntete
            teinte={apercu.teinte}
            motif={apercu.motif}
            cadre={apercu.cadre}
            avatar={apercu.avatar}
            pseudo={profil.pseudo}
          />
          <p className="text-[14px] leading-relaxed text-encre-douce">{o.description}</p>
        </div>

        {aDeja ? (
          porte ? (
            <span className="flex h-[52px] items-center justify-center gap-2 rounded-bloc bg-valide/15 text-[15px] font-semibold text-valide">
              Sur ton profil
            </span>
          ) : (
            <button
              type="button"
              onClick={equiper}
              disabled={enCours}
              className="appui h-[52px] rounded-bloc bg-accent text-[16px] font-bold text-white disabled:opacity-50"
            >
              Équiper
            </button>
          )
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[14px] text-encre-douce">
              <span>Ton solde : {formatLingots(solde)}</span>
              <span>{manque > 0 ? `Il en manque ${formatLingots(manque)}` : `Il te restera ${formatLingots(solde - prix)}`}</span>
            </div>
            <button
              type="button"
              onClick={acheter}
              disabled={enCours || manque > 0}
              className="appui flex h-14 items-center justify-center gap-2.5 rounded-bloc bg-[#f0c04a] text-[16px] font-bold text-[#1a1406] disabled:opacity-40"
            >
              {enCours ? 'Achat…' : 'Acheter'}
              {prix < PRIX[o.rarete] && (
                <span className="font-mono font-medium line-through opacity-55">{formatLingots(PRIX[o.rarete])}</span>
              )}
              <span className="font-mono font-medium">{formatLingots(prix)}</span>
            </button>
          </div>
        )}

        {erreur && <p className="font-mono text-[13px] text-accent">{erreur}</p>}
      </div>
    </Modale>
  )
}

/* ---- Boîte mystère ---- */

type Tirage = { o: ObjetBoutique; doublon: boolean; rendu: number }

function BoiteMystere({
  rarete,
  solde,
  possessions,
  equipe,
  onFermer,
  onResultat,
  onEquipe,
}: {
  rarete: Rarete | null
  solde: number
  possessions: Possession[]
  equipe: Equipement
  onFermer: () => void
  onResultat: (p: Possession | null, solde: number) => void
  onEquipe: (e: Equipement) => void
}) {
  const [tirage, setTirage] = useState<Tirage | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  if (!rarete) return <Modale titre="" ouverte={false} onFermer={onFermer}>{null}</Modale>

  const r = RARETES.find((x) => x.cle === rarete)!
  const objets = CATALOGUE.filter((o) => o.rarete === rarete)
  const deja = objets.filter((o) => possede(possessions, o.type, o.cle)).length
  const prix = PRIX_MYSTERE[rarete]

  function ouvrir() {
    if (!rarete) return
    setErreur(null)
    demarrer(async () => {
      const res = await ouvrirMystere(rarete)
      const o = res.type && res.cle ? objet(res.type, res.cle) : null
      if (res.erreur || !o) {
        setErreur(res.erreur ?? 'Une erreur est survenue.')
        return
      }
      setTirage({ o, doublon: res.doublon === true, rendu: res.rendu ?? 0 })
      onResultat(res.doublon ? null : { type: o.type, cle: o.cle }, res.solde ?? solde)
    })
  }

  function equiper(o: ObjetBoutique) {
    const valeur = o.type === 'avatar' ? valeurAvatar(o.cle) : o.cle
    const avant = equipe
    onEquipe({ ...equipe, [o.type]: valeur })
    demarrer(async () => {
      const res = await equiperObjet(o.type, o.cle)
      if (res.erreur) {
        onEquipe(avant)
        setErreur(res.erreur)
      }
    })
  }

  return (
    <Modale
      titre={`Boîte mystère ${r.boite.toLowerCase()}`}
      sousTitre={`${formatLingots(prix)} Lingots · solde ${formatLingots(solde)}`}
      ouverte
      onFermer={() => {
        setTirage(null)
        setErreur(null)
        onFermer()
      }}
    >
      <div className="flex flex-col gap-4">
        {tirage ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="relative flex h-[200px] w-[200px] items-center justify-center">
              <span
                aria-hidden
                className="rayons-objet absolute inset-0 rounded-full"
                style={{
                  background: `repeating-conic-gradient(${r.couleur}29 0deg 10deg, transparent 10deg 24deg)`,
                  WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)',
                  maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)',
                }}
              />
              <span
                className="revele-objet relative w-[150px] overflow-hidden rounded-[28px] bg-verre"
                style={{ boxShadow: `inset 0 0 0 1.5px ${r.couleur}80, 0 0 40px ${r.couleur}59` }}
              >
                <ApercuObjet o={tirage.o} avatar={equipe.avatar} hauteur={150} />
              </span>
            </div>
            <span
              className="rounded-pilule px-3 py-1 font-mono text-[12px] uppercase"
              style={
                tirage.doublon
                  ? { background: 'rgb(240 192 74 / 0.16)', color: '#f0c04a' }
                  : { background: `${r.couleur}2e`, color: r.couleur }
              }
            >
              {tirage.doublon ? 'Déjà possédé' : `Nouveau · ${r.nom.toLowerCase()}`}
            </span>
            <span className="font-display text-[44px] leading-[0.9]">{tirage.o.nom}</span>
            <span className="text-[15px] text-encre-douce">
              {tirage.doublon
                ? `Doublon : +${formatLingots(tirage.rendu)} Lingots rendus.`
                : `${LIBELLE_OBJET[tirage.o.type]} · à toi pour toujours.`}
            </span>
            <div className="mt-1 flex w-full flex-col gap-2">
              {!tirage.doublon && (
                <button
                  type="button"
                  onClick={() => equiper(tirage.o)}
                  disabled={enCours}
                  className="appui h-[52px] rounded-bloc bg-accent text-[16px] font-bold text-white disabled:opacity-50"
                >
                  Équiper
                </button>
              )}
              <button
                type="button"
                onClick={() => setTirage(null)}
                className="appui h-12 rounded-bloc bg-verre-fort text-[15px] font-semibold"
              >
                Rouvrir une boîte · {formatLingots(prix)}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center py-2">
              <span className="flotte-boite" style={{ filter: `drop-shadow(0 0 26px ${r.couleur}73)` }}>
                <IconeBoite couleur={r.couleur} taille={140} />
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-bloc bg-verre-fort p-3.5">
              <span className="text-[15px] font-bold">Ce qu&apos;elle peut contenir</span>
              <span className="text-[14px] leading-relaxed text-encre-douce">
                Un des {objets.length} objets {r.nom.toLowerCase()}s, 1 chance sur {objets.length} chacun :{' '}
                {objets.map((o) => o.nom).join(', ')}.
              </span>
              <span className="text-[14px] leading-relaxed text-encre-douce">
                {deja > 0 ? `Tu en possèdes déjà ${deja}. ` : ''}Un doublon te rend{' '}
                <span className="text-[#f0c04a]">{formatLingots(REMBOURSEMENT[rarete])} Lingots</span>.
              </span>
            </div>
            <button
              type="button"
              onClick={ouvrir}
              disabled={enCours || solde < prix}
              className="appui flex h-14 items-center justify-center gap-2.5 rounded-bloc text-[16px] font-bold text-fond disabled:opacity-40"
              style={{ background: r.couleur }}
            >
              {enCours ? 'Ouverture…' : 'Ouvrir'}
              <span className="font-mono font-medium">{formatLingots(prix)}</span>
            </button>
            {solde < prix && (
              <p className="text-center text-[14px] text-encre-douce">
                Il te manque {formatLingots(prix - solde)} Lingots.
              </p>
            )}
          </>
        )}
        {erreur && <p className="font-mono text-[13px] text-accent">{erreur}</p>}
      </div>
    </Modale>
  )
}

function IconeBoite({ couleur, taille }: { couleur: string; taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
      <path d="M8 18 L24 10 L40 18 L40 36 L24 44 L8 36 Z" fill={couleur} fillOpacity="0.18" stroke={couleur}
        strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 18 L24 26 L40 18 M24 26 L24 44" stroke={couleur} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M21 19 q3 -4 6 0 q0 3 -3 4 v2" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="29" r="1.2" fill="currentColor" />
    </svg>
  )
}
