import Link from 'next/link'
import { AvatarCadre } from '@/components/AvatarCadre'
import type { Classement as Donnees, LigneClassement, PeriodeClassement } from '@/lib/social'

/* ============================================================
   Classement entre amis
   ============================================================
   L'XP gagnée sur la semaine, sur le mois, ou le niveau total.
   On compare de l'assiduité, pas des charges : un débutant qui
   s'entraîne quatre fois passe devant un costaud qui vient une.
   ============================================================ */

const PERIODES: { cle: PeriodeClassement; nom: string }[] = [
  { cle: 'semaine', nom: 'Semaine' },
  { cle: 'mois', nom: 'Mois' },
  { cle: 'niveau', nom: 'Niveau' },
]

export function Classement({ donnees }: { donnees: Donnees }) {
  const { periode, lignes, joursRestants } = donnees
  const podium = lignes.slice(0, 3)
  const suite = lignes.slice(3)
  const seul = lignes.length <= 1

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5">
        {PERIODES.map((p) => (
          <Link
            key={p.cle}
            href={`/amis?onglet=classement&periode=${p.cle}`}
            aria-current={p.cle === periode ? 'true' : undefined}
            className={`flex h-[38px] items-center rounded-pilule px-4 text-[15px] transition-colors ${
              p.cle === periode
                ? 'bg-encre font-semibold text-fond'
                : 'bg-verre text-encre-douce hover:text-encre'
            }`}
          >
            {p.nom}
          </Link>
        ))}
        <span className="flex-1" />
        {joursRestants !== null && (
          <span className="font-mono text-[13px] text-encre-douce">
            {joursRestants === 0 ? 'fin ce soir' : `fin dans ${joursRestants} j`}
          </span>
        )}
      </div>

      {seul ? (
        <div className="bloc motif-cercles flex flex-col gap-2 p-5">
          <p className="font-display text-[34px] leading-none">Seul en tête</p>
          <p className="text-[15px] leading-relaxed text-encre-douce">
            Le classement se joue entre amis. Ajoute-en un avec le bouton + en haut.
          </p>
        </div>
      ) : (
        <>
          <Podium lignes={podium} periode={periode} />
          {suite.length > 0 && (
            <ul className="flex flex-col">
              {suite.map((l) => (
                <Ligne key={l.id} l={l} periode={periode} />
              ))}
            </ul>
          )}
        </>
      )}

      <p className="px-0.5 text-[13px] leading-relaxed text-encre-douce">
        {periode === 'niveau'
          ? 'XP gagnée depuis le début.'
          : `XP gagnée ${periode === 'semaine' ? 'depuis lundi' : 'depuis le 1er du mois'} : séances, cardio, records, relevés, badges et défis.`}
      </p>
    </div>
  )
}

/* ---- Podium : 2e, 1er, 3e ---- */

function Podium({ lignes, periode }: { lignes: LigneClassement[]; periode: PeriodeClassement }) {
  const ordre = [lignes[1], lignes[0], lignes[2]]
  const hauteurs = ['h-[92px]', 'h-[124px]', 'h-[72px]']

  return (
    <div className="grid grid-cols-3 items-end gap-2">
      {ordre.map((l, i) =>
        l ? (
          <Link
            key={l.id}
            href={l.moi ? '/profil' : `/u/${encodeURIComponent(l.pseudo)}`}
            className="flex min-w-0 flex-col items-center gap-2"
          >
            {i === 1 && <Couronne />}
            <AvatarCadre avatar={l.avatar ?? '💪'} cadre={l.cadre} taille={i === 1 ? 60 : 50} />
            <span className={`max-w-full truncate text-[15px] font-semibold ${l.moi ? 'text-accent-clair' : ''}`}>
              {l.moi ? 'Toi' : l.pseudo}
            </span>
            <div
              className={`flex w-full flex-col items-center justify-start gap-0.5 rounded-t-[16px] pt-3 ${hauteurs[i]} ${
                i === 1 ? 'bg-accent/20' : 'bg-verre'
              }`}
            >
              <span className={`font-display text-[36px] leading-none ${i === 1 ? 'text-accent' : ''}`}>
                {l.rang}
              </span>
              <span className="font-mono text-[12px] text-encre-douce">{valeur(l, periode)}</span>
            </div>
          </Link>
        ) : (
          <span key={i} />
        )
      )}
    </div>
  )
}

function Ligne({ l, periode }: { l: LigneClassement; periode: PeriodeClassement }) {
  return (
    <li>
      <Link
        href={l.moi ? '/profil' : `/u/${encodeURIComponent(l.pseudo)}`}
        className={`flex min-h-14 items-center gap-3 rounded-bloc px-2 ${l.moi ? 'bg-accent/10' : ''}`}
      >
        <span className="w-6 text-center font-mono text-[14px] text-encre-douce">{l.rang}</span>
        <AvatarCadre avatar={l.avatar ?? '💪'} cadre={l.cadre} taille={36} />
        <span className={`min-w-0 flex-1 truncate text-[16px] font-semibold ${l.moi ? 'text-accent-clair' : ''}`}>
          {l.moi ? 'Toi' : l.pseudo}
        </span>
        <span className="font-mono text-[14px] text-encre-douce">{valeur(l, periode)}</span>
      </Link>
    </li>
  )
}

function valeur(l: LigneClassement, periode: PeriodeClassement) {
  return periode === 'niveau'
    ? `niv. ${l.niveau}`
    : `${l.xp.toLocaleString('fr-FR')} XP`
}

function Couronne() {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden className="text-[#f0c04a]">
      <path d="M2 17h22L22 5l-5.5 5L13 2 9.5 10 4 5z" fill="currentColor" />
    </svg>
  )
}
