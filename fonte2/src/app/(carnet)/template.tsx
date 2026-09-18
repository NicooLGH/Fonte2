/**
 * Un `template` est recréé à chaque navigation, contrairement à
 * un `layout` qui persiste. C'est ce qui permet de rejouer
 * l'animation d'entrée à chaque changement de page.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="entree-page">{children}</div>
}
