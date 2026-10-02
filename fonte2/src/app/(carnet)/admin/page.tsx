import { notFound } from 'next/navigation'
import { suisJeAdmin, chargerToutesAnnonces } from '@/lib/donnees-notifs'
import { Admin } from '@/components/admin/Admin'
import { codeRequis } from '@/app/(carnet)/admin/verrou'
import { chargerDefisAdmin } from '@/lib/donnees-defis'

/**
 * Administration.
 *
 * La page renvoie une 404 si l'on n'est pas administrateur —
 * mais ce n'est qu'un confort d'affichage. Les fonctions de
 * publication vérifient elles-mêmes le rôle en base : forcer
 * l'accès à cette page ne permettrait rien.
 */
export default async function PageAdmin() {
  if (!(await suisJeAdmin())) notFound()

  const [annonces, requis, defis] = await Promise.all([
    chargerToutesAnnonces(),
    codeRequis(),
    chargerDefisAdmin(),
  ])
  return <Admin annonces={annonces} verrouillable={requis} defis={defis} />
}
