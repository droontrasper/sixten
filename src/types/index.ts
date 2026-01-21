/**
 * Typdefinitioner för Sixten-applikationen.
 * Definierar datamodeller för länkar och AI-analys.
 */

export type ContentType = 'artikel' | 'video' | 'podd'

export type LinkStatus = 'inbox' | 'active' | 'later' | 'done' | 'deleted'

export interface Tag {
  id: string
  link_id: string
  tag_name: string
  ai_suggested: boolean
  created_at: string
}

export interface Link {
  id: string
  user_id: string
  url: string
  title: string
  summary: string
  content_type: ContentType
  estimated_minutes: number
  status: LinkStatus
  note: string | null
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface LinkInsert {
  url: string
  title: string
  summary: string
  content_type: ContentType
  estimated_minutes: number
  status?: LinkStatus
  user_id?: string
}

export interface ClaudeAnalysis {
  titel: string
  sammanfattning: string
  typ: ContentType
  tidsuppskattning_minuter: number
  taggar?: string[]
}
