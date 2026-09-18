import { SqueletteTitre, SqueletteChiffres } from '@/components/Squelette'

export default function Chargement() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <SqueletteTitre />
      <SqueletteChiffres />
    </div>
  )
}
