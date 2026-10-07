import 'server-only'

import { creerClientServeur } from './supabase/server'
import { SEAU_STORIES, lireEtiquette, type GroupeStories } from './stories'

/* ============================================================
   Stories — lecture, serveur uniquement
   ============================================================
   La base renvoie ce que la personne a le droit de voir
   (`stories_amis`). Les liens vers les photos sont signés ici,
   valables une heure : le seau reste privé, et les règles du
   seau refusent de toute façon une photo qu'on n'a pas le droit
   de voir.
   ============================================================ */

type Brut = Record<string, unknown>

export async function chargerStories(): Promise<GroupeStories[]> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('stories_amis')
  if (error || !Array.isArray(data)) return []

  const groupes = data as Brut[]
  const chemins = groupes.flatMap((g) =>
    ((g.stories ?? []) as Brut[]).map((s) => String(s.chemin ?? ''))
  )

  const liens = new Map<string, string>()
  if (chemins.length) {
    const { data: signes } = await supabase.storage
      .from(SEAU_STORIES)
      .createSignedUrls(chemins, 3600)
    for (const s of signes ?? []) if (s.path && s.signedUrl) liens.set(s.path, s.signedUrl)
  }

  return groupes.map((g) => ({
    userId: String(g.user_id ?? ''),
    pseudo: String(g.pseudo ?? ''),
    avatar: typeof g.avatar === 'string' ? g.avatar : null,
    cadre: typeof g.cadre === 'string' ? g.cadre : 'aucun',
    moi: Boolean(g.moi),
    aVoir: Boolean(g.a_voir),
    stories: ((g.stories ?? []) as Brut[]).map((s) => ({
      id: String(s.id ?? ''),
      url: liens.get(String(s.chemin ?? '')) ?? null,
      etiquette: lireEtiquette(s.etiquette),
      position: Number(s.position) || 0.62,
      cree: String(s.cree ?? ''),
      vue: Boolean(s.vue),
      maReaction: typeof s.ma_reaction === 'string' ? s.ma_reaction : null,
      nbVues: s.nb_vues === null || s.nb_vues === undefined ? null : Number(s.nb_vues),
      reactions: (s.reactions as Record<string, number> | null) ?? null,
    })),
  }))
}
