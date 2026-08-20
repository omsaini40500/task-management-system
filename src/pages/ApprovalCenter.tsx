import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"

import {
  Plus,
  X,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"

import { api } from "../api/client"

type Status = "Pending" | "Approved" | "Rejected"

interface Approval {
  id: string

  title: string

  description: string

  type: string

  priority: string

  status: Status

  requesterId: string

  requesterName: string

  comment: string

  createdAt: string

  updatedAt: string
}

const priorityColor: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#6366f1",
  Low: "#64748b",
}

const statusColor: Record<Status, string> = {
  Pending: "#f59e0b",
  Approved: "#10b981",
  Rejected: "#ef4444",
}

export default function ApprovalCenter() {
  const { user } = useAuth()

  const [filter, setFilter] = useState<"All" | Status>("All")

  const [approvals, setApprovals] = useState<Approval[]>([])

  const [selected, setSelected] = useState<Approval | null>(null)

  const [showNewApproval, setShowNewApproval] = useState(false)

  const [loading, setLoading] = useState(true)

  const [comment, setComment] = useState("")

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    priority: "medium",
  })

  const role = user?.role || "member"

  const canManage = role === "super_admin" || role === "admin"

  const isApprover = role === "super_admin" || role === "admin"

  useEffect(() => {
    const load = async () => {
      try {
        if (isApprover) {
          const data = await api.get<Approval[]>("/approvals")

          setApprovals(data)
        } else {
          const data = await api.get<Approval[]>("/approvals/my")

          setApprovals(data)
        }
      } catch (e) {
        console.error("Failed to load approvals", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id, isApprover])

  const filtered =
    filter === "All" ? approvals : approvals.filter((a) => a.status === filter)

  const handleCreate = async () => {
    try {
      const newApproval = await api.post<Approval>("/approvals", {
        title: form.title || "Untitled Request",

        description: form.description,

        type: form.type || "General",

        priority: form.priority,
      })

      setApprovals((prev) => [newApproval, ...prev])

      setShowNewApproval(false)

      setForm({ title: "", description: "", type: "", priority: "medium" })
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (id: string, status: Status) => {
    try {
      const updated = await api.patch<Approval>(`/approvals/${id}`, {
        status,
        comment,
      })

      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)))

      setSelected(null)

      setComment("")
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/approvals/${id}`)

      setApprovals((prev) => prev.filter((a) => a.id !== id))

      setSelected(null)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-400">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading approvals...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Approval Center
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {isApprover
              ? "Manage approvals across all departments"
              : "Submit and track your approval requests"}
          </p>
        </div>
        <button
          onClick={() => setShowNewApproval(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "#6366f1" }}
        >
          <Plus size={14} /> New Approval
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(["All", "Pending", "Approved", "Rejected"] as const).map((s) => {
          const count =
            s === "All"
              ? approvals.length
              : approvals.filter((a) => a.status === s).length

          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="rounded-xl p-4 border text-left transition-colors"
              style={{
                backgroundColor:
                  filter === s ? "rgba(99,102,241,0.15)" : "#1c2340",
                borderColor: filter === s ? "#6366f1" : "#252d4a",
              }}
            >
              <p
                className="text-2xl font-bold mb-1"
                style={{
                  color:
                    s === "All"
                      ? "#e2e8f0"
                      : statusColor[(s as Status)] || "#e2e8f0",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {count}
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {s === "All" ? "Total Approvals" : `${s}`}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 space-y-3 overflow-auto">
          {filtered.length === 0 ? (
            <div
              className="rounded-xl p-8 border text-center"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <p className="text-sm font-medium text-white">
                No approval requests found
              </p>
              <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                Click "New Approval" to create a request.
              </p>
            </div>
          ) : (
            filtered.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(a === selected ? null : a)}
                className="rounded-xl p-4 border cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    selected?.id === a.id ? "rgba(99,102,241,0.08)" : "#1c2340",
                  borderColor: selected?.id === a.id ? "#6366f1" : "#252d4a",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${priorityColor[a.priority]}22`,
                          color: priorityColor[a.priority],
                        }}
                      >
                        {a.priority}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#252d4a", color: "#94a3b8" }}
                      >
                        {a.type}
                      </span>
                    </div>
                    <p className="font-medium text-white text-sm">{a.title}</p>
                    <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                      Requested by {a.requesterName} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: `${statusColor[a.status]}22`,
                      color: statusColor[a.status],
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 rounded-xl p-5 border space-y-4"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">
                  Approval Details
                </h3>
                <button
                  onClick={() => {
                    setSelected(null)
                    setComment("")
                  }}
                  style={{ color: "#64748b" }}
                >
                  <X size={14} />
                </button>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                  Title
                </p>
                <p className="text-sm text-white">{selected.title}</p>
              </div>
              {selected.description && (
                <div>
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                    Description
                  </p>
                  <p className="text-xs text-white">{selected.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                    Type
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: "#252d4a", color: "#94a3b8" }}
                  >
                    {selected.type}
                  </span>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                    Priority
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${priorityColor[selected.priority]}22`,
                      color: priorityColor[selected.priority],
                    }}
                  >
                    {selected.priority}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                  Requester
                </p>
                <p className="text-xs text-white">{selected.requesterName}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                  Status
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${statusColor[selected.status]}22`,
                    color: statusColor[selected.status],
                  }}
                >
                  {selected.status}
                </span>
              </div>
              {selected.comment && (
                <div>
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                    Comment
                  </p>
                  <p className="text-xs text-white">{selected.comment}</p>
                </div>
              )}

              {selected.status === "Pending" && isApprover && (
                <>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                      Add Comment
                    </p>
                    <textarea
                      className="w-full rounded-lg p-3 text-sm resize-none border"
                      rows={3}
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{
                        backgroundColor: "#0d1117",
                        borderColor: "#252d4a",
                        color: "#e2e8f0",
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(selected.id, "Approved")}
                      className="flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1"
                      style={{ backgroundColor: "#10b981" }}
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdate(selected.id, "Rejected")}
                      className="flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1"
                      style={{ backgroundColor: "#ef4444" }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </>
              )}

              {selected.requesterId === user?.id &&
                selected.status === "Pending" && (
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="w-full py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: "#ef4444" }}
                  >
                    Cancel Request
                  </button>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showNewApproval && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowNewApproval(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-2xl shadow-2xl p-6"
              style={{
                background: "#13141a",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  New Approval Request
                </h2>
                <button
                  onClick={() => setShowNewApproval(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Title
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Budget Approval for Q4 Campaign"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none min-h-20"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe what needs approval..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                    >
                      <option value="">Select Type</option>
                      <option value="Budget">Budget</option>
                      <option value="Leave">Leave</option>
                      <option value="Resource">Resource</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 transition-colors hover:bg-indigo-600 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#6366f1" }}
                  onClick={handleCreate}
                >
                  <Send size={14} /> Submit Request
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
