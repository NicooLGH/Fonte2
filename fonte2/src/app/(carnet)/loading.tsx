import { SqueletteListe } from '@/components/Squelette'

export default function Chargement() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <span className="block h-[11px] w-[30%] animate-pulse rounded bg-verre-fort" />
      <SqueletteListe lignes={3} />
    </div>
  )
}
