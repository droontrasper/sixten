/**
 * Supabase-klient för databashantering.
 * Hanterar CRUD-operationer för länkar.
 */
import { createClient } from '@supabase/supabase-js'
import type { Link, LinkInsert, LinkStatus } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Saknar VITE_SUPABASE_URL eller VITE_SUPABASE_ANON_KEY i miljövariabler')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const DEFAULT_USER_ID = 'user_1'

export async function getLinks(status?: LinkStatus): Promise<Link[]> {
  let query = supabase
    .from('links')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Kunde inte hämta länkar: ${error.message}`)
  }

  return data || []
}

export async function createLink(link: LinkInsert): Promise<Link> {
  const { data, error } = await supabase
    .from('links')
    .insert({
      ...link,
      user_id: DEFAULT_USER_ID,
      status: link.status || 'inbox',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Kunde inte skapa länk: ${error.message}`)
  }

  return data
}

export async function updateLinkStatus(id: string, status: LinkStatus, note?: string): Promise<Link> {
  const updates: { status: LinkStatus; updated_at: string; note?: string } = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (note !== undefined) {
    updates.note = note
  }

  const { data, error } = await supabase
    .from('links')
    .update(updates)
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)
    .select()
    .single()

  if (error) {
    throw new Error(`Kunde inte uppdatera länk: ${error.message}`)
  }

  return data
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)

  if (error) {
    throw new Error(`Kunde inte ta bort länk: ${error.message}`)
  }
}
