import 'server-only'

import { creerClientServeur } from './supabase/server'
import { objet, type EtatBoutique, type Possession, type TypeObjet } from './boutique'

/* ============================================================
   Boutique — lecture côté serveur
   ============================================================ */

type Brut = Record<string, unknown>

/** Solde, objets possédés et objet à la une. Vide si le SQL manque. */
export async function chargerBoutique(): Promise<EtatBoutique> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('boutique_etat')
  if (error || !data || typeof data !== 'object') return { solde: 0, possessions: [], une: null }

  const b = data as Brut
  const possessions: Possession[] = Array.isArray(b.possessions)
    ? (b.possessions as Brut[])
        .map((p) => ({ type: String(p.type) as TypeObjet, cle: String(p.cle) }))
        .filter((p) => objet(p.type, p.cle))
    : []
  const u = b.une as Brut | null
  const une =
    u && objet(String(u.type), String(u.cle))
      ? { type: String(u.type) as TypeObjet, cle: String(u.cle), prix: Number(u.prix) || 0 }
      : null
  return { solde: Number(b.solde) || 0, possessions, une }
}

/** Seulement les objets possédés (écran Apparence). */
export async function chargerPossessions(): Promise<Possession[]> {
  return (await chargerBoutique()).possessions
}
