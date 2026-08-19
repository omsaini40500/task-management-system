import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { api } from "../api/client"

interface RecycleBinItem {
  id: string
  itemType: string
  itemId: string
  deletedAt: string
  deletedBy: string
}

export default function RecycleBin() {
  const [items, setItems] = useState<RecycleBinItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      try {
        const data = await api.get<RecycleBinItem[]>('/recycle-bin')
        setItems(data)
      } catch (e) {
        console.error('Failed to load recycle bin', e)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [])

  const handleRestore = async (id: string) => {
    try {
      await api.delete(`/recycle-bin/${id}`)
      setItems(items.filter(item => item.id !== id))
    } catch (e) {
      console.error('Failed to restore item', e)
    }
  }

  return (
    <div className="page">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>Recycle Bin</h3>
            <p className="text-sm" style={{ color: "#6b7280" }}>Restore or permanently delete removed items</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-sm text-gray-400">Loading recycle bin...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🗑️</div>
            <p className="font-medium text-white mb-1">Recycle Bin is empty</p>
            <p className="text-sm" style={{ color: '#64748b' }}>Deleted items will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                    <span className="text-lg">🗑️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.itemType} - {item.itemId}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Deleted by {item.deletedBy} on {new Date(item.deletedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(item.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
