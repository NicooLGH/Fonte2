import 'server-only'

import { creerClientServeur } from './supabase/server'
import { ETAT_VIDE, type EtatLingots, type LigneLingots, type SourceLingots } from './lingots'

/* ============================================================
   Lingots — lecture côté serveur
   ============================================================
   La base crédite d'abord les paliers atteints et pas encore
   payés, puis renvoie le solde : on lit toujours un chiffre juste.
   ============================================================ */

const SOURCES: SourceLingots[] = ['bonus', 'palier', 'achat', 'remboursement', 'ajustement']

type Brut = Record<string, unknown>

/** Solde, bonus du jour et historique. Vide si le SQL n'est pas installé. */
export async function chargerLingots(): Promise<EtatLingots> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('mes_lingots')
  if (error || !data || typeof data !== 'object') return ETAT_VIDE

  const b = data as Brut
  const bonus = (b.bonus ?? {}) as Brut
  return {
    solde: Number(b.solde) || 0,
    gagne: Number(b.gagne) || 0,
    depense: Number(b.depense) || 0,
    bonus: {
      jour: Math.min(7, Math.max(1, Number(bonus.jour) || 1)),
      recupere: bonus.recupere === true,
      montant: Number(bonus.montant) || 0,
      demain: Number(bonus.demain) || 0,
    },
    historique: Array.isArray(b.historique)
      ? (b.historique as Brut[]).map(
          (h): LigneLingots => ({
            source: SOURCES.includes(h.source as SourceLingots) ? (h.source as SourceLingots) : 'ajustement',
            montant: Number(h.montant) || 0,
            libelle: String(h.libelle ?? ''),
            jour: String(h.jour ?? ''),
            cree: String(h.cree ?? ''),
          })
        )
      : [],
  }
}
