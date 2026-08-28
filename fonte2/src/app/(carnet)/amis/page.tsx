import { chargerAmis } from '@/lib/donnees-social'
import { GestionAmis } from '@/components/social/Amis'

export default async function PageAmis() {
  const liste = await chargerAmis()

  return (
    <div className="flex flex-col gap-6 py-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-2">
          Comparaison douce
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Amis</h1>
      </header>

      <GestionAmis liste={liste} />
    </div>
  )
}
