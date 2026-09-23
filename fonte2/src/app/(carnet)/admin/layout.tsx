import { notFound } from 'next/navigation'
import { suisJeAdmin } from '@/lib/donnees-notifs'
import { accesOuvert, codeRequis } from '@/app/(carnet)/admin/verrou'
import { Verrou } from '@/components/admin/Verrou'

/**
 * Porte de l'administration.
 *
 * Deux contrôles successifs : le rôle, puis le code. Le premier
 * est celui qui compte — les fonctions de publication le
 * revérifient de toute façon en base. Le second protège d'une
 * publication par accident, ou d'un téléphone laissé ouvert.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await suisJeAdmin())) notFound()

  const [ouvert, requis] = await Promise.all([accesOuvert(), codeRequis()])

  if (requis && !ouvert) return <Verrou />

  return <>{children}</>
}
