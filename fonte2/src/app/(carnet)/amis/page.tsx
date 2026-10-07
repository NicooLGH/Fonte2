import { chargerAmis } from '@/lib/donnees-social'
import { GestionAmis } from '@/components/social/Amis'

export default async function PageAmis() {
  const liste = await chargerAmis()

  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="border-b border-filet pb-5">
        <h1 className="titre-page">Amis</h1>
      </header>

      <GestionAmis liste={liste} />
    </div>
  )
}
