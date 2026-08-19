import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PauseCircle, PlayCircle, Trash2, Eye, Lock, CheckCircle2, AlertCircle, Plus, Search, MoreVertical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign } from '../api/campaigns'
import ConfirmModal from '../components/common/ConfirmModal'

interface Campaign {
  id: string
  name: string
  client: string
  status: string
  start: string
  end: string
  team: string[]
}

interface ChecklistItem {
  key: string
  label: string
  verifiedBy: string
}

interface CampaignChecklistItem {
  key: string
  label: string
  verifiedBy: string
  done: boolean
}

interface CampaignChecklist {
  id?: string
  items: CampaignChecklistItem[]
  createdAt: string
  createdBy: string
}

const CHECKLIST_ITEMS_STORAGE_KEY = 'flash_checklist_items'

const tabs = [
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'Timeline', label: 'Timeline' },
  { id: 'Assets', label: 'Assets' },
  { id: 'Reports', label: 'Reports' },
]

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  Running: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Running' },
  Planning: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'Planning' },
  Completed: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Completed' },
  Paused: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Paused' },
}

function createEmptyChecklist(createdBy: string, items: ChecklistItem[]): CampaignChecklist {
  return {
    items: items.map(item => ({ ...item, done: false })),
    createdAt: new Date().toISOString(),
    createdBy,
  }
}

function getStoredChecklistItems(): ChecklistItem[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_ITEMS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [
    { key: 'clientName', label: 'Client Name', verifiedBy: 'PM' },
    { key: 'pm', label: 'PM', verifiedBy: 'PM' },
    { key: 'campaignObjective', label: 'Campaign Objective', verifiedBy: 'PM' },
    { key: 'campaignType', label: 'Campaign Type', verifiedBy: 'PM' },
    { key: 'approvedBudget', label: 'Approved Budget', verifiedBy: 'PM' },
    { key: 'adAccountCurrency', label: 'Ad Account Currency', verifiedBy: 'PM' },
    { key: 'budgetConverted', label: 'Budget Converted (if required)', verifiedBy: 'PM' },
    { key: 'billingAccount', label: 'Billing Account', verifiedBy: 'PM' },
    { key: 'pixelConnected', label: 'Pixel Connected', verifiedBy: 'PM' },
    { key: 'conversionEvent', label: 'Conversion Event', verifiedBy: 'PM' },
    { key: 'countryGeography', label: 'Country / Geography', verifiedBy: 'PM' },
    { key: 'audience', label: 'Audience', verifiedBy: 'PM' },
    { key: 'creative', label: 'Creative', verifiedBy: 'PM' },
    { key: 'landingPage', label: 'Landing Page', verifiedBy: 'PM' },
    { key: 'utmParameters', label: 'UTM Parameters', verifiedBy: 'PM' },
    { key: 'trackingTested', label: 'Tracking Tested', verifiedBy: 'PM' },
    { key: 'finalQA', label: 'Final QA', verifiedBy: 'Team Lead' },
  ]
}

export default function CampaignManagement() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const [tab, setTab] = useState('Dashboard')
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '', client: '', start: '', end: '', team: ''
  })

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [checklist, setChecklist] = useState<CampaignChecklist | null>(null)

  const selectedCampaign = localCampaigns.find(c => c.id === selectedId)

  const filteredCampaigns = localCampaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true)
      try {
        const data = await fetchCampaigns()
        const mapped: Campaign[] = data.map(c => ({
          id: c.id,
          name: c.name,
          client: c.client || 'General',
          status: c.status,
          start: c.start || '',
          end: c.end || '',
          team: c.team ? c.team.split(',') : [],
        }))
        setLocalCampaigns(mapped)
        if (mapped.length > 0 && !selectedId) setSelectedId(mapped[0].id)
      } catch (e) {
        console.error('Failed to load campaigns', e)
      } finally {
        setLoading(false)
      }
    }
    loadCampaigns()
  }, [])

  useEffect(() => {
    if (!showChecklist) return
    const stored = getStoredChecklistItems()
    setChecklistItems(stored)
    setChecklist(createEmptyChecklist(user?.name || 'Admin', stored))
  }, [showChecklist, user?.name])

  const persistCampaigns = (campaigns: Campaign[]) => {
    setLocalCampaigns(campaigns)
  }

  const handleDeleteCampaign = (id: string) => {
    if (isClient) return
    setItemToDelete(id)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await deleteCampaign(itemToDelete)
      persistCampaigns(localCampaigns.filter(c => c.id !== itemToDelete))
      if (selectedId === itemToDelete) setSelectedId(null)
    } catch (e) {
      console.error('Failed to delete campaign', e)
    } finally {
      setItemToDelete(null)
    }
  }

  const toggleCampaignStatus = async (id: string) => {
    if (isClient) return
    const campaign = localCampaigns.find(c => c.id === id)
    if (!campaign) return
    const newStatus = campaign.status === 'Running' ? 'Paused' : 'Running'
    try {
      await updateCampaign(id, { status: newStatus })
      persistCampaigns(localCampaigns.map(c => c.id === id ? { ...c, status: newStatus } : c))
    } catch (e) {
      console.error('Failed to update campaign status', e)
    }
  }

  const toggleChecklistItem = (key: string) => {
    if (!checklist) return
    setChecklist(prev => {
      if (!prev) return prev
      const updated = {
        ...prev,
        items: prev.items.map(item => item.key === key ? { ...item, done: !item.done } : item),
      }
      return updated
    })
  }

  const isChecklistComplete = checklist ? checklist.items.every(item => item.done) : false

  const openChecklist = () => {
    setShowChecklist(true)
  }

  const handleCreateCampaign = async () => {
    if (!isChecklistComplete || !checklist) {
      alert('Please complete all checklist items before launching the campaign.')
      return
    }

    try {
      const saved = await createCampaign({
        name: formData.name || 'New Campaign',
        client: formData.client || 'General',
        status: 'Planning',
        start: formData.start || '2026-08-01',
        end: formData.end || '2026-09-01',
        team: formData.team || '',
      })
      const newCampaign: Campaign = {
        id: saved.id,
        name: saved.name,
        client: saved.client || 'General',
        status: saved.status,
        start: saved.start || '',
        end: saved.end || '',
        team: saved.team ? saved.team.split(',') : [],
      }
      persistCampaigns([newCampaign, ...localCampaigns])
      setSelectedId(newCampaign.id)
      resetAndClose()
    } catch (e) {
      console.error('Failed to create campaign', e)
    }
  }

  const resetAndClose = () => {
    setShowChecklist(false)
    setShowModal(false)
    setFormData({ name: '', client: '', start: '', end: '', team: '' })
    setChecklist(null)
  }

  const activeCount = localCampaigns.filter(c => c.status === 'Running').length
  const totalCampaigns = localCampaigns.length

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Campaign Management
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {isClient
              ? `Viewing campaigns for ${user?.clientName ?? 'your account'}`
              : 'Track, manage and optimize marketing campaigns'}
          </p>
        </div>

        {!isClient && (
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}
            onClick={() => setShowModal(true)}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4f46e5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366f1')}
          >
            <Plus size={16} />
            New Campaign
          </button>
        )}

        {isClient && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(236,72,153,0.12)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.25)' }}>
            <Eye size={15} />
            View Only
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isClient ? 'Your Campaigns' : 'Total Campaigns', value: totalCampaigns.toString(), icon: '🚀', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Active Campaigns', value: activeCount.toString(), icon: '▶', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Avg. CTR', value: '2.4%', icon: '📈', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
        ].map(m => (
          <div key={m.label} className="rounded-xl p-4 border transition-all hover:border-opacity-20" style={{ backgroundColor: '#1c2340', borderColor: '#252d4a' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                <span className="text-lg">{m.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>{m.value}</p>
            <p className="text-xs" style={{ color: '#64748b' }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs and Search */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b flex-1" style={{ borderColor: '#252d4a' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-medium transition-all relative"
              style={{ color: tab === t.id ? '#6366f1' : '#64748b' }}>
              {t.label}
              {tab === t.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: '#6366f1' }} />
              )}
            </button>
          ))}
        </div>

        <div className="ml-4 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:border-indigo-500 transition-colors"
            style={{ backgroundColor: '#1c2340', borderColor: '#252d4a', color: '#e2e8f0', width: '240px' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-5 flex-1 min-h-0">
        <div className="flex-1 rounded-xl border overflow-hidden" style={{ backgroundColor: '#1c2340', borderColor: '#252d4a' }}>
          {tab === 'Dashboard' && (
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
              {loading ? (
                <div className="text-center py-16 text-sm" style={{ color: '#64748b' }}>Loading campaigns...</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #252d4a' }}>
                      {['Campaign', 'Client', 'Status', 'Period', ...(isClient ? [] : [''])].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 font-medium text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={isClient ? 4 : 5} className="px-4 py-16 text-center" style={{ color: '#64748b' }}>
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.08)' }}>
                              <Lock size={24} style={{ color: '#6366f1' }} />
                            </div>
                            <div>
                              <p className="font-medium text-white mb-1">No campaigns found</p>
                              <p className="text-xs">No campaigns are currently assigned to your account.</p>
                            </div>
                            {!isClient && (
                              <button
                                onClick={() => setShowModal(true)}
                                className="mt-2 px-4 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1.5"
                                style={{ backgroundColor: '#6366f1' }}
                              >
                                <Plus size={12} />
                                Create your first campaign
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.map(c => {
                        const status = statusConfig[c.status] || statusConfig.Planning
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                            className="cursor-pointer transition-all group"
                            style={{
                              backgroundColor: selectedId === c.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                              borderBottom: '1px solid #252d4a'
                            }}
                            onMouseEnter={e => { if (selectedId !== c.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = selectedId === c.id ? 'rgba(99,102,241,0.08)' : 'transparent' }}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-white">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5" style={{ color: '#94a3b8' }}>{c.client}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5" style={{ color: status.color, backgroundColor: status.bg }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{c.start} → {c.end}</td>
                            {!isClient && (
                              <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {(c.status === 'Running' || c.status === 'Paused') && (
                                    <button
                                      onClick={() => toggleCampaignStatus(c.id)}
                                      className="p-1.5 rounded-lg transition-colors"
                                      style={{ color: c.status === 'Running' ? '#ef4444' : '#10b981' }}
                                      title={c.status === 'Running' ? 'Pause' : 'Resume'}
                                    >
                                      {c.status === 'Running' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteCampaign(c.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Delete Campaign"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {tab !== 'Dashboard' && (
            <div className="h-full flex items-center justify-center" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-medium text-white text-lg mb-1">{tab} View</p>
                <p className="text-sm" style={{ color: '#64748b' }}>Select a campaign to view {tab.toLowerCase()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Detail Panel */}
        {selectedCampaign && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-80 rounded-xl border overflow-hidden flex flex-col"
            style={{ backgroundColor: '#1c2340', borderColor: '#252d4a' }}
          >
            <div className="p-5 border-b" style={{ borderColor: '#252d4a' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                  {selectedCampaign.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => setSelectedId(null)} className="w-6 h-6 rounded flex items-center justify-center transition-colors" style={{ color: '#64748b' }}>
                  <X size={14} />
                </button>
              </div>
              <h3 className="font-semibold text-white text-base mb-2">{selectedCampaign.name}</h3>
              <div className="flex items-center gap-2">
                {(() => {
                  const status = statusConfig[selectedCampaign.status] || statusConfig.Planning
                  return (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ color: status.color, backgroundColor: status.bg }}>
                      {status.label}
                    </span>
                  )
                })()}
              </div>
            </div>

            <div className="p-5 space-y-5 flex-1 overflow-auto">
              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#252d4a' }}>
                  <span className="text-xs" style={{ color: '#64748b' }}>Client</span>
                  <span className="text-sm text-white font-medium">{selectedCampaign.client}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#252d4a' }}>
                  <span className="text-xs" style={{ color: '#64748b' }}>Period</span>
                  <span className="text-xs text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedCampaign.start} → {selectedCampaign.end}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#252d4a' }}>
                  <span className="text-xs" style={{ color: '#64748b' }}>Team</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {selectedCampaign.team.map(m => (
                      <span key={m} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#252d4a', color: '#94a3b8' }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isClient && (
                <div className="flex gap-2">
                  {(selectedCampaign.status === 'Running' || selectedCampaign.status === 'Paused') && (
                    <button
                      onClick={() => toggleCampaignStatus(selectedCampaign.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: selectedCampaign.status === 'Running' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: selectedCampaign.status === 'Running' ? '#ef4444' : '#10b981'
                      }}
                    >
                      {selectedCampaign.status === 'Running' ? (
                        <><PauseCircle size={13} /> Pause</>
                      ) : (
                        <><PlayCircle size={13} /> Resume</>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Checklist status */}
              {checklist && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: '#13182e', borderColor: '#252d4a' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-gray-300">Launch Checklist</p>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                      {checklist.items.filter(i => i.done).length}/{checklist.items.length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#252d4a' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(checklist.items.filter(i => i.done).length / checklist.items.length) * 100}%`, backgroundColor: '#10b981' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#64748b' }}>
                    {checklist.items.filter(i => i.done).length === checklist.items.length
                      ? 'Ready to launch'
                      : `${checklist.items.filter(i => !i.done).length} items remaining`}
                  </p>
                </div>
              )}
            </div>

            {/* Delete — hidden for clients */}
            {!isClient && (
              <div className="p-5 border-t" style={{ borderColor: '#252d4a' }}>
                <button
                  onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete Campaign
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* New Campaign Modal — only for non-clients */}
      {!isClient && (
        <AnimatePresence>
          {showModal && !showChecklist && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div>
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Create New Campaign</h2>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>Fill in the campaign details below</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Campaign Name</label>
                    <input
                      className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                      style={{ borderColor: '#252d4a' }}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Summer Sale 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Client</label>
                    <input
                      className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                      style={{ borderColor: '#252d4a' }}
                      value={formData.client}
                      onChange={e => setFormData({...formData, client: e.target.value})}
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                        style={{ borderColor: '#252d4a' }}
                        value={formData.start}
                        onChange={e => setFormData({...formData, start: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>End Date</label>
                      <input
                        type="date"
                        className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                        style={{ borderColor: '#252d4a' }}
                        value={formData.end}
                        onChange={e => setFormData({...formData, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Team Members</label>
                    <input
                      className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                      style={{ borderColor: '#252d4a' }}
                      placeholder="e.g. Alex M., Sarah L., John D."
                      value={formData.team}
                      onChange={e => setFormData({...formData, team: e.target.value})}
                    />
                    <p className="text-xs mt-1.5" style={{ color: '#64748b' }}>Separate names with commas</p>
                  </div>
                  <button
                    className="w-full py-3 rounded-lg text-sm font-medium text-white mt-2 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}
                    onClick={openChecklist}
                  >
                    <CheckCircle2 size={16} />
                    Continue to Launch Checklist
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Campaign Launch Checklist Modal */}
      <AnimatePresence>
        {showChecklist && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowChecklist(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}
            >
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Campaign Launch Checklist</h2>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Mandatory — complete all items to launch campaign</p>
                </div>
                <button onClick={() => setShowChecklist(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                {checklistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(100,116,139,0.1)' }}>
                      <AlertCircle size={20} style={{ color: '#64748b' }} />
                    </div>
                    <p className="text-sm text-gray-400">No checklist items available.</p>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>Contact your administrator to configure launch checklist.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-5 px-1">
                      <div className="flex items-center gap-3">
                        {isChecklistComplete ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                            <AlertCircle size={18} style={{ color: '#f59e0b' }} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {isChecklistComplete ? 'All items completed' : `${checklist ? checklist.items.filter(i => !i.done).length : 0} item(s) remaining`}
                          </p>
                          <p className="text-xs" style={{ color: '#64748b' }}>
                            {checklist ? checklist.items.filter(i => i.done).length : 0} of {checklistItems.length} completed
                          </p>
                        </div>
                      </div>
                      <div className="w-16 h-16 relative">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="#252d4a" strokeWidth="4" fill="none" />
                          <circle
                            cx="32" cy="32" r="28"
                            stroke={isChecklistComplete ? '#10b981' : '#6366f1'}
                            strokeWidth="4" fill="none"
                            strokeLinecap="round"
                            style={{
                              strokeDasharray: `${((checklist ? checklist.items.filter(i => i.done).length : 0) / checklistItems.length) * 175.9} 175.9`,
                              transition: 'stroke-dasharray 0.3s ease'
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {Math.round(((checklist ? checklist.items.filter(i => i.done).length : 0) / checklistItems.length) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {checklistItems.map((item) => {
                        const checked = checklist?.items.find(i => i.key === item.key)?.done || false
                        return (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer group"
                            style={{
                              backgroundColor: checked ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${checked ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}`,
                            }}
                            onClick={() => toggleChecklistItem(item.key)}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = checked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = checked ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)')}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all" style={{
                                backgroundColor: checked ? '#10b981' : 'transparent',
                                border: `1.5px solid ${checked ? '#10b981' : '#64748b'}`,
                              }}>
                                {checked && <CheckCircle2 size={12} color="white" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium transition-colors" style={{ color: checked ? '#10b981' : '#e2e8f0' }}>{item.label}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Verified by: {item.verifiedBy}</p>
                              </div>
                            </div>
                            {checked && (
                              <span className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Done</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0d0f14' }}>
                <button type="button" onClick={() => setShowChecklist(false)} className="px-4 py-2 rounded-lg text-xs font-medium transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {!isChecklistComplete && (
                    <span className="text-xs flex items-center gap-1.5" style={{ color: '#ef4444' }}>
                      <AlertCircle size={12} />
                      Complete all items to launch
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateCampaign}
                    disabled={!isChecklistComplete}
                    className="text-xs font-medium px-5 py-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: isChecklistComplete ? '#6366f1' : '#252d4a',
                      color: isChecklistComplete ? 'white' : '#64748b',
                      cursor: isChecklistComplete ? 'pointer' : 'not-allowed',
                      boxShadow: isChecklistComplete ? '0 4px 12px rgba(99,102,241,0.25)' : 'none'
                    }}
                  >
                    {isChecklistComplete ? 'Launch Campaign' : 'Complete Checklist First'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Campaign"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
