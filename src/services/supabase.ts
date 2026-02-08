/**
 * Supabase-klient för databashantering.
 * Hanterar CRUD-operationer för länkar.
 */
import { createClient } from '@supabase/supabase-js'
import type { Link, LinkInsert, LinkStatus, Tag } from '../types'

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
    .select(`
      *,
      link_tags (
        id,
        link_id,
        tag_name,
        ai_suggested,
        created_at
      )
    `)
    .eq('user_id', DEFAULT_USER_ID)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Kunde inte hämta länkar: ${error.message}`)
  }

  // Mappa link_tags till tags för varje länk
  const links = (data || []).map((link: Link & { link_tags?: Tag[] }) => ({
    ...link,
    tags: link.link_tags || [],
    link_tags: undefined,
  }))

  return links
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
    .select(`
      *,
      link_tags (
        id,
        link_id,
        tag_name,
        ai_suggested,
        created_at
      )
    `)
    .single()

  if (error) {
    throw new Error(`Kunde inte uppdatera länk: ${error.message}`)
  }

  // Mappa link_tags till tags
  const link: Link = {
    ...data,
    tags: data.link_tags || [],
    link_tags: undefined,
  }

  return link
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('links')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', DEFAULT_USER_ID)

  if (error) {
    throw new Error(`Kunde inte ta bort länk: ${error.message}`)
  }
}

export async function saveTags(linkId: string, tags: string[], aiSuggested: boolean = true): Promise<Tag[]> {
  if (tags.length === 0) return []

  const tagRows = tags.map(tag => ({
    link_id: linkId,
    tag_name: tag.toLowerCase(),
    ai_suggested: aiSuggested,
  }))

  const { data, error } = await supabase
    .from('link_tags')
    .insert(tagRows)
    .select()

  if (error) {
    throw new Error(`Kunde inte spara taggar: ${error.message}`)
  }

  return data || []
}

export async function updateTags(
  linkId: string,
  tags: { name: string; ai_suggested: boolean }[]
): Promise<Tag[]> {
  // Ta bort befintliga taggar
  const { error: deleteError } = await supabase
    .from('link_tags')
    .delete()
    .eq('link_id', linkId)

  if (deleteError) {
    throw new Error(`Kunde inte uppdatera taggar: ${deleteError.message}`)
  }

  if (tags.length === 0) return []

  // Lägg till nya taggar
  const tagRows = tags.map(tag => ({
    link_id: linkId,
    tag_name: tag.name.toLowerCase(),
    ai_suggested: tag.ai_suggested,
  }))

  const { data, error } = await supabase
    .from('link_tags')
    .insert(tagRows)
    .select()

  if (error) {
    throw new Error(`Kunde inte spara taggar: ${error.message}`)
  }

  return data || []
}

export async function getFavoriteTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorite_tags')
    .select('tag_name')
    .eq('user_id', DEFAULT_USER_ID)
    .order('tag_name')

  if (error) {
    throw new Error(`Kunde inte hämta favorittaggar: ${error.message}`)
  }

  return (data || []).map(d => d.tag_name)
}

export async function addFavoriteTag(tagName: string): Promise<void> {
  const { error } = await supabase
    .from('favorite_tags')
    .insert({ user_id: DEFAULT_USER_ID, tag_name: tagName.toLowerCase() })

  if (error) {
    if (error.code === '23505') return // Already exists, ignore
    throw new Error(`Kunde inte spara favorittagg: ${error.message}`)
  }
}

export async function removeFavoriteTag(tagName: string): Promise<void> {
  const { error } = await supabase
    .from('favorite_tags')
    .delete()
    .eq('user_id', DEFAULT_USER_ID)
    .eq('tag_name', tagName.toLowerCase())

  if (error) {
    throw new Error(`Kunde inte ta bort favorittagg: ${error.message}`)
  }
}

export async function getHandledThisWeekCount(): Promise<number> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count, error } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', DEFAULT_USER_ID)
    .in('status', ['done', 'deleted'])
    .gte('updated_at', weekAgo.toISOString())

  if (error) {
    throw new Error(`Kunde inte räkna hanterade länkar: ${error.message}`)
  }

  return count ?? 0
}

export async function getTagsForLink(linkId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('link_tags')
    .select('*')
    .eq('link_id', linkId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Kunde inte hämta taggar: ${error.message}`)
  }

  return data || []
}
