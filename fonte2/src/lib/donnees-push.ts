import { creerClientServeur } from '@/lib/supabase/server'
import type { PreferencesPush } from '@/app/(carnet)/reglages/push'

export async function chargerPreferencesPush(): Promise<PreferencesPush> {
  const defaut: PreferencesPush = { amis: true, social: true, rappels: true, defis: true, annonces: true, heure: 18 }
  const supabase = await creerClientServeur()
  const { data } = await supabase.rpc('mes_preferences_push')
  if (!data || typeof data !== 'object') return defaut
  const d = data as Partial<PreferencesPush>
  return {
    amis: d.amis ?? true,
    social: d.social ?? true,
    rappels: d.rappels ?? true,
    defis: d.defis ?? true,
    annonces: d.annonces ?? true,
    heure: typeof d.heure === 'number' ? d.heure : 18,
  }
}
