import { imageAvatar } from '@/lib/boutique'

/**
 * Le visage d'un membre : son emoji, ou son avatar spécial
 * (dessin de la boutique). L'image suit la taille du texte autour,
 * comme un emoji : il suffit de régler la taille de police du parent.
 */
export function Visage({ avatar, className = '' }: { avatar: string | null | undefined; className?: string }) {
  const image = avatar ? imageAvatar(avatar) : null
  if (image)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" draggable={false} className={`inline-block h-[1.2em] w-[1.2em] ${className}`} />
  return <>{avatar || '💪'}</>
}
