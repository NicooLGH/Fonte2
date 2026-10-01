'use server'

import { chargerJournal } from '@/lib/donnees-xp'
import type { PageJournal } from '@/lib/xp'

/** Semaines suivantes du journal, au bouton « Voir plus ». */
export async function journalSuite(avant: string): Promise<PageJournal> {
  if (!/^\d{4}-W\d{2}$/.test(avant)) return { entrees: [], suite: false }
  return chargerJournal(avant)
}
