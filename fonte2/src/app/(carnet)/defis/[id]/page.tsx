import Link from 'next/link'
import { chargerDefi } from '@/lib/donnees-defis'
import { DetailDefi } from '@/components/defis/DetailDefi'

/** Un défi : en cours ou terminé, rejoint ou non. */
export default async function PageDefi({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const defi = /^[0-9a-f-]{36}$/i.test(id) ? await chargerDefi(id) : null

  if (!defi)
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-3xl">Défi introuvable</h1>
        <p className="text-sm text-encre-douce">Il a peut-être été retiré.</p>
        <Link
          href="/defis"
          className="rounded-bloc bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          Voir les défis en cours
        </Link>
      </div>
    )

  return <DetailDefi defi={defi} />
}
