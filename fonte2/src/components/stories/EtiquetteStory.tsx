import { rang } from '@/lib/xp'
import type { Etiquette } from '@/lib/stories'

/**
 * L'étiquette posée sur la photo : la séance, un record ou le
 * niveau. Son contenu vient de la base, jamais de la saisie.
 */
export function EtiquetteStory({ etiquette }: { etiquette: Etiquette }) {
  if (etiquette.type === 'aucune') return null

  return (
    <div className="inline-flex max-w-full flex-col gap-1.5 rounded-[18px] bg-[#0e0f11]/70 px-4 py-3 text-[#f4f3ee] backdrop-blur-md">
      {etiquette.type === 'seance' && (
        <>
          <span className="truncate font-display text-[40px] leading-[0.85] uppercase">{etiquette.titre}</span>
          <span className="flex flex-wrap gap-1.5 font-mono text-[13px]">
            {etiquette.dureeSec ? <Puce>{Math.round(etiquette.dureeSec / 60)} min</Puce> : null}
            {etiquette.volume > 0 && <Puce>{tonnes(etiquette.volume)}</Puce>}
            {etiquette.records > 0 && (
              <Puce bleu>
                +{etiquette.records} record{etiquette.records > 1 ? 's' : ''}
              </Puce>
            )}
          </span>
        </>
      )}
      {etiquette.type === 'record' && (
        <>
          <span className="font-mono text-[12px] tracking-[0.08em] text-[#4cc9f0] uppercase">Record</span>
          <span className="truncate font-display text-[40px] leading-[0.85] uppercase">{etiquette.titre}</span>
        </>
      )}
      {etiquette.type === 'niveau' && (
        <>
          <span className="font-mono text-[12px] tracking-[0.08em] text-[#ff8a63] uppercase">
            Niveau · {rang(etiquette.niveau)}
          </span>
          <span className="font-display text-[56px] leading-[0.8] text-[#ff4b2b]">{etiquette.niveau}</span>
        </>
      )}
    </div>
  )
}

function Puce({ children, bleu = false }: { children: React.ReactNode; bleu?: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 ${bleu ? 'bg-[#4cc9f0]/20 text-[#4cc9f0]' : 'bg-white/12'}`}>
      {children}
    </span>
  )
}

function tonnes(kg: number) {
  return `${Math.round(kg).toLocaleString('fr-FR')} kg`
}
