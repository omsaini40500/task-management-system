import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Download, Activity, Shield, Globe, Monitor } from "lucide-react"
import { api } from "../api/client"
import type { ActivityLog } from "../types"

const actionColors: Record<string, string> = {
  "Changed role": "#8b5cf6",
  "Created project": "#22c55e",
  "Assigned task": "#6366f1",
  "Status changed": "#f59e0b",
  "Uploaded attachment": "#10b981",
  "Changed permissions": "#ef4444",
  "System settings updated": "#6366f1",
  "Completed task": "#22c55e",
}

const moduleIcons: Record<string, any> = {
  "User Management": Shield,
  "Projects": Activity,
  "Tasks": Activity,
  "Permissions": Shield,
  "Settings": Monitor,
}

export default function ActivityLog() {
  const [search, setSearch] = useState("")
  const [filterModule, setFilterModule] = useState("all")
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<ActivityLog[]>("/activity-logs")
      .then((data) => setLogs(data))
      .catch((err) => console.error("Failed to load activity logs", err))
      .finally(() => setLoading(false))
  }, [])

  const modules = [...new Set(logs.map((l) => l.module))]
  const filtered = logs.filter((l) => {
    if (search && !l.user.toLowerCase().includes(search.toLowerCase()) && !l.action.toLowerCase().includes(search.toLowerCase())) return false
    if (filterModule !== "all" && l.module !== filterModule) return false
    return true
  })

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Activity & Audit Log</h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Enterprise-grade audit trail for all system actions</p>
        </div>
        <button className="btn btn-secondary text-xs gap-1.5"><Download size={13} /> Export Log</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Events", value: logs.length.toString(), color: "#6366f1" },
          { label: "Today", value: logs.filter((log) => new Date(log.timestamp).toDateString() === new Date().toDateString()).length.toString(), color: "#22c55e" },
          { label: "This Week", value: logs.filter((log) => new Date().getTime() - new Date(log.timestamp).getTime() <= 7 * 24 * 60 * 60 * 1000).length.toString(), color: "#f59e0b" },
          { label: "Active Users", value: new Set(logs.map((l) => l.userId)).size.toString(), color: "#8b5cf6" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
            <div className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }} />
          <input className="input pl-9 py-2 text-xs" placeholder="Search by user or action…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input py-2 text-xs w-40" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
          <option value="all">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button className="btn btn-secondary text-xs gap-1.5"><Filter size={12} /> More Filters</button>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {["User", "Action", "Target", "Module", "Old → New", "IP / Location", "Timestamp"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "#4b5563", fontFamily: "JetBrains Mono, monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center" style={{ color: "#64748b" }}>
                  {loading ? "Loading activity logs..." : "No activity logs available."}
                </td>
              </tr>
            ) : filtered.map((log, i) => {
                const ActionIcon = moduleIcons[log.module] || Activity
                const actionColor = actionColors[log.action] || "#6b7280"
                return (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b table-row" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {log.user.charAt(0)}
                        </div>
                        <span className="text-sm text-white whitespace-nowrap">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: actionColor }} />
                        <span className="text-sm whitespace-nowrap" style={{ color: "#94a3b8" }}>{log.action}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-white max-w-40 truncate">{log.target}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <ActionIcon size={11} style={{ color: "#6b7280" }} />
                        <span className="text-xs" style={{ color: "#6b7280" }}>{log.module}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {(log.oldValue || log.newValue) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          {log.oldValue && <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>{log.oldValue}</span>}
                          {log.oldValue && log.newValue && <span style={{ color: "#4b5563" }}>→</span>}
                          {log.newValue && <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>{log.newValue}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs" style={{ color: "#6b7280" }}>
                        <div className="flex items-center gap-1"><Monitor size={10} />{log.ip}</div>
                        <div className="flex items-center gap-1 mt-0.5"><Globe size={10} />{log.location}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#6b7280", fontFamily: "JetBrains Mono, monospace" }}>{log.timestamp}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
