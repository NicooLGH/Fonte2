import { AvatarCadre } from '@/components/AvatarCadre'
import { Visage } from '@/components/Visage'
import { banniere } from '@/lib/bannieres'
import { motifCss } from '@/lib/motifs'
import { couleurRarete, valeurAvatar, type ObjetBoutique } from '@/lib/boutique'

/* ============================================================
   Vignette d'un objet de la boutique
   ============================================================
   Teinte : la lueur seule. Motif : posé sur la teinte Acier.
   Cadre : autour de mon avatar. Avatar : en grand, sur un halo
   de la couleur de sa rareté.
   ============================================================ */

export function ApercuObjet({
  o,
  avatar,
  hauteur = 96,
}: {
  o: ObjetBoutique
  /** Mon avatar, pour essayer un cadre. */
  avatar: string
  hauteur?: number
}) {
  const halo = `${couleurRarete(o.rarete)}2e`
  const t = o.type === 'teinte' ? banniere(o.cle) : banniere('acier')

  return (
    <div className="relative overflow-hidden rounded-[11px] bg-fond" style={{ height: hauteur }}>
      {(o.type === 'teinte' || o.type === 'motif') && (
        <>
          <div aria-hidden className="absolute inset-0" style={{ background: t.fond }} />
          {o.type === 'teinte' && t.anime && <div aria-hidden className="reflet-teinte absolute inset-0" />}
          {o.type === 'motif' && <div aria-hidden className="absolute inset-0" style={motifCss(o.cle)} />}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-b from-transparent to-fond" />
        </>
      )}
      {o.type === 'cadre' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `radial-gradient(circle at 50% 50%, ${halo}, transparent 70%)` }}
        >
          <AvatarCadre avatar={avatar} cadre={o.cle} taille={Math.round(hauteur * 0.5)} />
        </div>
      )}
      {o.type === 'avatar' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${halo}, transparent 65%)`,
            fontSize: Math.round(hauteur * 0.62),
          }}
        >
          <Visage avatar={valeurAvatar(o.cle)} />
        </div>
      )}
    </div>
  )
}
