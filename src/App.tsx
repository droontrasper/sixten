/**
 * Huvudkomponent för Sixten-applikationen.
 * Hanterar routing mellan vyer och global state för länkar.
 */
import { useState, useEffect } from 'react'
import type { Link, LinkStatus } from './types'
import { getLinks, createLink, updateLinkStatus, deleteLink, saveTags, updateTags } from './services/supabase'
import { fetchPageContent } from './services/jina'
import { analyzeContent, analyzeImage } from './services/claude'
import { AddLink, type AddLinkResult } from './components/AddLink'
import { Inbox } from './components/Inbox'
import { ActiveList } from './components/ActiveList'
import { Later } from './components/Later'
import { Saved } from './components/Saved'
import { SaveDialog } from './components/SaveDialog'
import { Landing } from './components/Landing'

type Tab = 'inbox' | 'active' | 'later' | 'saved'

const MAX_ACTIVE_LINKS = 5
const MAX_ACTIVE_MINUTES = 90

function App() {
  const [links, setLinks] = useState<Link[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogLink, setDialogLink] = useState<Link | null>(null)
  const [landingMode, setLandingMode] = useState(true)

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

  async function handleAddLink({ url, manualText, skipAnalysis, imageData, manualTitle, manualTags }: AddLinkResult) {
    setIsLoading(true)
    setError(null)

    try {
      let newLink: Link

      if (imageData && manualTitle) {
        // Manuell input efter AI-fel - spara med användarens titel och taggar
        newLink = await createLink({
          url: `image://${Date.now()}`,
          title: manualTitle,
          summary: 'Bildinnehåll (manuellt tillagd)',
          content_type: 'artikel',
          estimated_minutes: 3,
          status: 'inbox',
          image_data: imageData,
        })

        if (manualTags && manualTags.length > 0) {
          const tags = await saveTags(newLink.id, manualTags, false)
          newLink.tags = tags
        }
      } else if (imageData) {
        // Bilduppladdning - analysera bilden med Claude Vision
        try {
          const analysis = await analyzeImage(imageData)
          newLink = await createLink({
            url: `image://${Date.now()}`, // Unik placeholder-URL för bilder
            title: analysis.titel,
            summary: analysis.sammanfattning,
            content_type: analysis.typ,
            estimated_minutes: analysis.tidsuppskattning_minuter,
            status: 'inbox',
            image_data: imageData, // Spara base64-bilden
          })

          if (analysis.taggar && analysis.taggar.length > 0) {
            const tags = await saveTags(newLink.id, analysis.taggar, true)
            newLink.tags = tags
          }
        } catch {
          // AI-analys misslyckades - trigga fallback-dialog
          setIsLoading(false)
          const showFallback = (window as unknown as { showImageFallback?: (data: string) => void }).showImageFallback
          if (showFallback) {
            showFallback(imageData)
          } else {
            setError('Kunde inte analysera bilden. Försök igen.')
          }
          return
        }
      } else if (url) {
        const normalizedUrl = normalizeUrl(url)
        const existingLink = links.find(l => normalizeUrl(l.url) === normalizedUrl)

        if (existingLink) {
          throw new Error(`Denna länk finns redan i ${getStatusLabel(existingLink.status)}`)
        }

        if (skipAnalysis) {
          // Spara utan AI-analys (LinkedIn eller Jina-fallback)
          const urlTitle = extractLinkedInTitle(url)
          const isLinkedIn = url.includes('linkedin.com')
          newLink = await createLink({
            url,
            title: urlTitle || (isLinkedIn ? 'LinkedIn-inlägg' : extractDomainTitle(url)),
            summary: isLinkedIn ? 'LinkedIn-inlägg (ingen sammanfattning tillgänglig)' : 'Innehåll kunde inte hämtas automatiskt.',
            content_type: 'artikel',
            estimated_minutes: 5,
            status: 'inbox',
          })
        } else if (manualText) {
          // LinkedIn-post med manuell text - analysera texten
          const analysis = await analyzeContent(manualText)
          newLink = await createLink({
            url,
            title: analysis.titel,
            summary: analysis.sammanfattning,
            content_type: analysis.typ,
            estimated_minutes: analysis.tidsuppskattning_minuter,
            status: 'inbox',
            manual_content: manualText,
          })

          if (analysis.taggar && analysis.taggar.length > 0) {
            const tags = await saveTags(newLink.id, analysis.taggar, true)
            newLink.tags = tags
          }
        } else {
          // Vanlig länk - hämta innehåll och analysera
          try {
            const { content } = await fetchPageContent(url)
            const analysis = await analyzeContent(content)

            newLink = await createLink({
              url,
              title: analysis.titel,
              summary: analysis.sammanfattning,
              content_type: analysis.typ,
              estimated_minutes: analysis.tidsuppskattning_minuter,
              status: 'inbox',
            })

            if (analysis.taggar && analysis.taggar.length > 0) {
              const tags = await saveTags(newLink.id, analysis.taggar, true)
              newLink.tags = tags
            }
          } catch {
            // Jina.ai kunde inte läsa länken - visa fallback-dialog
            setIsLoading(false)
            const showFallback = (window as unknown as { showJinaFallback?: (url: string) => void }).showJinaFallback
            if (showFallback) {
              showFallback(url)
              throw new Error('__fallback__')
            }
            throw new Error('Kunde inte hämta innehåll från länken.')
          }
        }
      } else {
        throw new Error('Ingen URL eller bild angiven')
      }

      setLinks(prev => [newLink, ...prev])
      // Gå till inbox endast om vi inte är i landing mode
      if (!landingMode) {
        setActiveTab('inbox')
      }
    } catch (err) {
      // Ignorera fallback-signaler (hanteras av AddLink-dialogen)
      if (err instanceof Error && err.message === '__fallback__') return
      setError(err instanceof Error ? err.message : 'Kunde inte lägga till länk')
    } finally {
      setIsLoading(false)
    }
  }

  function extractDomainTitle(url: string): string {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '')
      return `Länk från ${hostname}`
    } catch {
      return url
    }
  }

  function extractLinkedInTitle(url: string): string | null {
    // Försök extrahera författarnamn från LinkedIn-URL
    // Format: linkedin.com/posts/username_activity-id
    const match = url.match(/linkedin\.com\/posts\/([^_]+)/)
    if (match) {
      return `LinkedIn-inlägg av ${match[1]}`
    }
    return null
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

  const allTags = Array.from(
    new Set(links.flatMap(l => (l.tags || []).map(t => t.tag_name)))
  ).sort()

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

  async function handleAddTag(linkId: string, tagName: string) {
    try {
      const link = links.find(l => l.id === linkId)
      if (!link) return

      const existingTags = link.tags || []
      if (existingTags.length >= 10) return
      if (existingTags.some(t => t.tag_name.toLowerCase() === tagName.toLowerCase())) return

      const [newTag] = await saveTags(linkId, [tagName], false)
      setLinks(prev => prev.map(l =>
        l.id === linkId
          ? { ...l, tags: [...(l.tags || []), newTag] }
          : l
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte lägga till tagg')
    }
  }

  async function handleRemoveTag(linkId: string, tagId: string) {
    try {
      const link = links.find(l => l.id === linkId)
      if (!link) return

      const remainingTags = (link.tags || []).filter(t => t.id !== tagId)
      await updateTags(linkId, remainingTags.map(t => ({ name: t.tag_name, ai_suggested: t.ai_suggested })))

      setLinks(prev => prev.map(l =>
        l.id === linkId
          ? { ...l, tags: remainingTags }
          : l
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ta bort tagg')
    }
  }

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: 'inbox', label: 'Inkorg', icon: '📥', count: inboxLinks.length },
    { id: 'active', label: 'Aktiv', icon: '⚡', count: activeLinks.length },
    { id: 'later', label: 'Senare', icon: '🕐', count: laterLinks.length },
    { id: 'saved', label: 'Sparat', icon: '⭐', count: savedLinks.length },
  ]

  // Hämta senast tillagda länk för landing page
  const latestLink = links.length > 0 ? links[0] : null

  // Visa landing page om landingMode är true
  if (landingMode) {
    return (
      <Landing
        latestLink={latestLink}
        onAdd={handleAddLink}
        onGoToSorting={() => setLandingMode(false)}
        onGoToActive={() => {
          setLandingMode(false)
          setActiveTab('active')
        }}
        isLoading={isLoading}
      />
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8 -mx-4 -mt-8 px-4 py-6 bg-gradient-to-b from-sky-50 to-stone-50">
          <button
            onClick={() => setLandingMode(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src="/sixten-icon-192.png" alt="Hem" className="w-10 h-10" />
            <div className="text-left">
              <h1 className="text-3xl font-bold text-stone-800 mb-1">Sixten</h1>
              <p className="text-stone-500">Din lugna innehållskö</p>
            </div>
          </button>
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
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              allTags={allTags}
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
