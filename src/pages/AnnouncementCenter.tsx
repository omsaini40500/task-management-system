import { useState, useEffect } from 'react'
import useNotificationSound from '../hooks/useNotificationSound'
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from '../api/announcements'

interface Announcement {
  id: string
  title: string
  type: string
  priority: string
  author: string
  date: string
  content: string
  pinned: boolean
}

const typeColor: Record<string, string> = { Event: '#8b5cf6', Announcement: '#6366f1', Notice: '#f59e0b' }

export default function AnnouncementCenter() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selected, setSelected] = useState<Announcement | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('Announcement')
  const [newContent, setNewContent] = useState('')
  const { play: playSound } = useNotificationSound()

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true)
      try {
        const data = await fetchAnnouncements()
        const mapped: Announcement[] = data.map(a => ({
          id: a.id,
          title: a.title,
          type: a.type,
          priority: a.priority,
          author: a.author,
          date: a.date || new Date().toISOString().split('T')[0],
          content: a.content,
          pinned: a.pinned,
        }))
        setAnnouncements(mapped)
      } catch (e) {
        console.error('Failed to load announcements', e)
      } finally {
        setLoading(false)
      }
    }
    loadAnnouncements()
  }, [])

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    try {
      const saved = await createAnnouncement({
        title: newTitle,
        type: newType,
        content: newContent,
        author: 'Current User',
        date: new Date().toISOString().split('T')[0],
        pinned: false,
      })
      const newAnnouncement: Announcement = {
        id: saved.id,
        title: saved.title,
        type: saved.type,
        priority: saved.priority,
        author: saved.author,
        date: saved.date || new Date().toISOString().split('T')[0],
        content: saved.content,
        pinned: saved.pinned,
      }
      setAnnouncements([newAnnouncement, ...announcements])
      setShowNew(false)
      setNewTitle('')
      setNewContent('')
      playSound()
    } catch (e) {
      console.error('Failed to create announcement', e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id)
      setAnnouncements(announcements.filter(a => a.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) {
      console.error('Failed to delete announcement', e)
    }
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Announcement Center</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Company-wide announcements, notices, banners, and events</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#6366f1' }}>+ New Announcement</button>
      </div>

      {showNew && (
        <div className="rounded-xl p-5 border" style={{ backgroundColor: '#1c2340', borderColor: '#6366f1' }}>
          <p className="font-semibold text-white mb-4 text-sm">Create Announcement</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title..." className="rounded-lg px-4 py-2.5 text-sm border" style={{ backgroundColor: '#0d1117', borderColor: '#252d4a', color: '#e2e8f0' }} />
            <select value={newType} onChange={e => setNewType(e.target.value)} className="rounded-lg px-4 py-2.5 text-sm border" style={{ backgroundColor: '#0d1117', borderColor: '#252d4a', color: '#e2e8f0' }}>
              <option>Announcement</option><option>Notice</option><option>Event</option>
            </select>
          </div>
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Announcement content..." rows={3} className="w-full rounded-lg px-4 py-2.5 text-sm border resize-none mb-4" style={{ backgroundColor: '#0d1117', borderColor: '#252d4a', color: '#e2e8f0' }} />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#6366f1' }}>Publish</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#252d4a', color: '#94a3b8' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-80 space-y-3 overflow-auto">
          {loading ? (
            <div className="text-center py-8 text-sm" style={{ color: '#64748b' }}>Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="rounded-xl p-6 border text-center" style={{ backgroundColor: '#1c2340', borderColor: '#252d4a' }}>
              <p className="text-sm font-medium text-white">No announcements available</p>
              <p className="text-xs mt-2" style={{ color: '#64748b' }}>Announcements will appear here once published.</p>
            </div>
          ) : announcements.map(a => (
            <div key={a.id} onClick={() => setSelected(a)} className="rounded-xl p-4 border cursor-pointer transition-colors"
              style={{ backgroundColor: selected?.id === a.id ? 'rgba(99,102,241,0.1)' : '#1c2340', borderColor: selected?.id === a.id ? '#6366f1' : '#252d4a' }}>
              <div className="flex items-start gap-2 mb-1">
                {a.pinned && <span className="text-xs text-yellow-400">📌</span>}
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor[a.type] || '#6366f1'}22`, color: typeColor[a.type] || '#6366f1' }}>{a.type}</span>
              </div>
              <p className="font-medium text-white text-sm leading-snug">{a.title}</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>{a.author} · {a.date}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 rounded-xl p-6 border overflow-auto" style={{ backgroundColor: '#1c2340', borderColor: '#252d4a' }}>
          {selected ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color: typeColor[selected.type] || '#6366f1', backgroundColor: `${typeColor[selected.type] || '#6366f1'}22` }}>{selected.type}</span>
                {selected.pinned && <span className="text-xs text-yellow-400">📌 Pinned</span>}
              </div>
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>{selected.title}</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Posted by {selected.author} · {selected.date}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{selected.content}</p>
              <div className="flex gap-2 mt-8">
                <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#252d4a', color: '#94a3b8' }}>Edit</button>
                <button onClick={() => handleDelete(selected.id)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Delete</button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm font-medium text-white">No announcement selected</p>
              <p className="text-xs mt-2" style={{ color: '#64748b' }}>Select an announcement from the list or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
