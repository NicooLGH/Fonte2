'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'

export async function marquerNotifsLues(): Promise<void> {
  const supabase = await creerClientServeur()
  await supabase.rpc('marquer_notifs_lues')
  revalidatePath('/', 'layout')
}
