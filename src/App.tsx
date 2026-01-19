/**
 * Huvudkomponent för Sixten-applikationen.
 * Hanterar routing mellan vyer och global state för länkar.
 */
import { useState, useEffect } from 'react'
import type { Link, LinkStatus } from './types'
import { getLinks, createLink, updateLinkStatus, deleteLink } from './services/supabase'
import { fetchPageContent } from './services/jina'
import { analyzeContent } from './services/claude'
import { AddLink } from './components/AddLink'
import { Inbox } from './components/Inbox'
import { ActiveList } from './components/ActiveList'
import { Later } from './components/Later'
import { Saved } from './components/Saved'
import { SaveDialog } from './components/SaveDialog'

type Tab = 'inbox' | 'active' | 'later' | 'saved'

const MAX_ACTIVE_LINKS = 5
const MAX_ACTIVE_MINUTES = 90

function App() {
  const [links, setLinks] = useState<Link[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogLink, setDialogLink] = useState<Link | null>(null)

  useEffect(() => {
    loadLinks()
  }, [])

  async function loadLinks() {
    try {
      const data = await getLinks()
      setLinks(data.filter(l => l.status !== 'deleted'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda länkar')
    }
  }

  function getStatusLabel(status: LinkStatus): string {
    const labels: Record<LinkStatus, string> = {
      inbox: 'Inkorg',
      active: 'Aktiv lista',
      later: 'Senare',
      done: 'Sparat',
      deleted: 'Borttaget',
    }
    return labels[status]
  }

  function normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return parsed.href.replace(/\/$/, '')
    } catch {
      return url.toLowerCase().trim()
    }
  }

  async function handleAddLink(url: string) {
    setIsLoading(true)
    setError(null)

    try {
      const normalizedUrl = normalizeUrl(url)
      const existingLink = links.find(l => normalizeUrl(l.url) === normalizedUrl)

      if (existingLink) {
        setError(`Denna länk finns redan i ${getStatusLabel(existingLink.status)}`)
        setIsLoading(false)
        return
      }

      const { content } = await fetchPageContent(url)
      const analysis = await analyzeContent(content)

      const newLink = await createLink({
        url,
        title: analysis.titel,
        summary: analysis.sammanfattning,
        content_type: analysis.typ,
        estimated_minutes: analysis.tidsuppskattning_minuter,
        status: 'inbox',
      })

      setLinks(prev => [newLink, ...prev])
      setActiveTab('inbox')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte lägga till länk')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdateStatus(id: string, status: LinkStatus) {
    setError(null)
    try {
      const updated = await updateLinkStatus(id, status)
      setLinks(prev => prev.map(l => l.id === id ? updated : l))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte uppdatera länk')
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    try {
      await deleteLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ta bort länk')
    }
  }

  function handleMarkDone(link: Link) {
    setDialogLink(link)
  }

  async function handleDialogSave(note: string) {
    if (!dialogLink) return
    try {
      const updated = await updateLinkStatus(dialogLink.id, 'done', note || undefined)
      setLinks(prev => prev.map(l => l.id === dialogLink.id ? updated : l))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara länk')
    }
    setDialogLink(null)
  }

  async function handleDialogDelete() {
    if (!dialogLink) return
    await handleDelete(dialogLink.id)
    setDialogLink(null)
  }

  async function handleDialogMoveToLater() {
    if (!dialogLink) return
    await handleUpdateStatus(dialogLink.id, 'later')
    setDialogLink(null)
  }

  const inboxLinks = links.filter(l => l.status === 'inbox')
  const activeLinks = links.filter(l => l.status === 'active')
  const laterLinks = links.filter(l => l.status === 'later')
  const savedLinks = links.filter(l => l.status === 'done')

  const activeMinutes = activeLinks.reduce((sum, l) => sum + l.estimated_minutes, 0)

  function canAddToActive(link: Link): { allowed: boolean; reason?: string } {
    if (activeLinks.length >= MAX_ACTIVE_LINKS) {
      return { allowed: false, reason: `Aktiv lista är full (max ${MAX_ACTIVE_LINKS} länkar). Markera något som klart först.` }
    }
    if (activeMinutes + link.estimated_minutes > MAX_ACTIVE_MINUTES) {
      return { allowed: false, reason: `Länken (${link.estimated_minutes} min) överskrider tidsgränsen. Du har ${MAX_ACTIVE_MINUTES - activeMinutes} min kvar av ${MAX_ACTIVE_MINUTES}.` }
    }
    return { allowed: true }
  }

  function handleMoveToActive(id: string) {
    const link = links.find(l => l.id === id)
    if (!link) return

    const check = canAddToActive(link)
    if (!check.allowed) {
      setError(check.reason!)
      return
    }

    handleUpdateStatus(id, 'active')
  }

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: 'inbox', label: 'Inkorg', icon: '📥', count: inboxLinks.length },
    { id: 'active', label: 'Aktiv', icon: '⚡', count: activeLinks.length },
    { id: 'later', label: 'Senare', icon: '🕐', count: laterLinks.length },
    { id: 'saved', label: 'Sparat', icon: '⭐', count: savedLinks.length },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8 -mx-4 -mt-8 px-4 py-6 bg-gradient-to-b from-sky-50 to-stone-50">
          <h1 className="text-3xl font-bold text-stone-800 mb-1">Sixten</h1>
          <p className="text-stone-500">Din lugna innehållskö</p>
        </header>

        <AddLink onAdd={handleAddLink} isLoading={isLoading} />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <nav className="flex gap-2 mb-6 p-1.5 bg-stone-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-white text-stone-800 shadow-md ring-1 ring-stone-200'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs
                  ${activeTab === tab.id ? 'bg-sky-100 text-sky-700' : 'bg-stone-200 text-stone-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <main>
          {activeTab === 'inbox' && (
            <Inbox
              links={inboxLinks}
              onMoveToActive={handleMoveToActive}
              onMoveToLater={(id) => handleUpdateStatus(id, 'later')}
              onDelete={handleDelete}
            />
          )}
          {activeTab === 'active' && (
            <ActiveList
              links={activeLinks}
              maxLinks={MAX_ACTIVE_LINKS}
              maxMinutes={MAX_ACTIVE_MINUTES}
              onMarkDone={handleMarkDone}
              onMoveToLater={(id) => handleUpdateStatus(id, 'later')}
            />
          )}
          {activeTab === 'later' && (
            <Later
              links={laterLinks}
              onMoveToActive={handleMoveToActive}
              onMarkDone={handleMarkDone}
              onDelete={handleDelete}
            />
          )}
          {activeTab === 'saved' && (
            <Saved
              links={savedLinks}
              onDelete={handleDelete}
            />
          )}
        </main>
      </div>

      {dialogLink && (
        <SaveDialog
          link={dialogLink}
          onSave={handleDialogSave}
          onDelete={handleDialogDelete}
          onMoveToLater={handleDialogMoveToLater}
          onClose={() => setDialogLink(null)}
        />
      )}
    </div>
  )
}

export default App
