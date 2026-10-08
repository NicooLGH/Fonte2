import { AvatarCadre } from '@/components/AvatarCadre'
import { TexteAjuste } from '@/components/ui/TexteAjuste'
import { banniere } from '@/lib/bannieres'
import { motifCss } from '@/lib/motifs'

/* ============================================================
   Aperçu d'en-tête de profil
   ============================================================
   Le haut d'un profil en miniature : teinte, motif, cadre, avatar
   et pseudo. Sert à essayer une récompense avant de l'équiper.
   ============================================================ */

export function ApercuEntete({
  teinte,
  motif,
  cadre,
  avatar,
  pseudo,
  sousTitre,
  hauteur = 190,
}: {
  teinte: string
  motif: string
  cadre: string
  avatar: string
  pseudo: string
  sousTitre?: string
  hauteur?: number
}) {
  const t = banniere(teinte)
  return (
    <div className="relative overflow-hidden rounded-[16px] bg-fond" style={{ height: hauteur }}>
      <div aria-hidden className="absolute inset-0" style={{ background: t.fond }} />
      {t.anime && <div aria-hidden className="reflet-teinte absolute inset-0" />}
      <div aria-hidden className="absolute inset-0" style={motifCss(motif)} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent to-fond" />
      <div className="absolute inset-x-4 bottom-3.5 flex items-end gap-3.5">
        <AvatarCadre avatar={avatar} cadre={cadre} taille={60} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-0.5">
          <TexteAjuste max={38} min={20} className="font-display leading-[0.9]">
            {pseudo}
          </TexteAjuste>
          {sousTitre && (
            <span className="self-start rounded-pilule bg-verre-fort px-2.5 py-0.5 font-mono text-[11px] text-encre-douce uppercase">
              {sousTitre}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
