import { useEffect, useState } from "react"

import { motion, AnimatePresence } from "framer-motion"

import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  Clock,
  Star,
  Megaphone,
} from "lucide-react"

import { api } from "../api/client"

import ConfirmModal from "../components/common/ConfirmModal"

import useNotificationSound from "../hooks/useNotificationSound"

interface Notification {
  id: string

  title: string

  message: string

  type: string

  read: boolean

  time: string
}

const typeIcons: Record<string, any> = {
  task_assigned: MessageSquare,

  comment_mention: MessageSquare,

  deadline: Clock,

  approval: Star,

  announcement: Megaphone,

  system: Bell,
}

const typeColors: Record<string, string> = {
  task_assigned: "#6366f1",

  comment_mention: "#8b5cf6",

  deadline: "#f59e0b",

  approval: "#22c55e",

  announcement: "#10b981",

  system: "#94a3b8",
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([])

  const [filter, setFilter] = useState<"all" | "unread">("all")

  const [loading, setLoading] = useState(true)

  const { play: playSound } = useNotificationSound()

  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchNotifications = async () => {
      try {
        const data = await api.get<Notification[]>("/notifications")

        if (!cancelled) {
          setNotifs(data)

          const unreadCount = data.filter((n) => !n.read).length

          if (unreadCount > 0) {
            playSound()
          }
        }
      } catch (e) {
        if (!cancelled) {
          setNotifs([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchNotifications()

    return () => {
      cancelled = true
    }
  }, [playSound])

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all")
    } catch (e) {
      console.error("Failed to mark all read", e)
    }

    const updated = notifs.map((n) => ({ ...n, read: true }))

    setNotifs(updated)
  }

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`)
    } catch (e) {
      console.error("Failed to mark read", e)
    }

    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n))

    setNotifs(updated)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await api.delete(`/notifications/${itemToDelete}`)
    } catch (e) {
      console.error("Failed to delete notification", e)
    }

    const updated = notifs.filter((n) => n.id !== itemToDelete)

    setNotifs(updated)

    setItemToDelete(null)
  }

  const filtered = notifs.filter((n) => filter === "all" || !n.read)

  const unreadCount = notifs.filter((n) => !n.read).length

  return (
    <div className="page max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Notifications
            {unreadCount > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#6366f1", color: "white" }}
              >
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            {notifs.length} total · {unreadCount} unread
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="btn btn-secondary text-xs gap-1.5"
        >
          <CheckCheck size={13} /> Mark all read
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5 w-fit"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-smooth"
            style={{
              background: filter === f ? "#6366f1" : "transparent",
              color: filter === f ? "white" : "#6b7280",
            }}
          >
            {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Bell
                size={32}
                className="mx-auto mb-3"
                style={{ color: "#374151" }}
              />
              <div className="text-sm font-medium" style={{ color: "#4b5563" }}>
                Loading notifications…
              </div>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Bell
                size={32}
                className="mx-auto mb-3"
                style={{ color: "#374151" }}
              />
              <div className="text-sm font-medium" style={{ color: "#4b5563" }}>
                All caught up!
              </div>
              <div className="text-xs mt-1" style={{ color: "#374151" }}>
                No {filter === "unread" ? "unread " : ""}notifications
              </div>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const Icon = typeIcons[notif.type] || Bell

              const color = typeColors[notif.type] || "#6b7280"

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => markRead(notif.id)}
                  className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-smooth relative"
                  style={{
                    background: notif.read
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(99,102,241,0.05)",

                    border: `1px solid ${
                      notif.read
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(99,102,241,0.12)"
                    }`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.read
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(99,102,241,0.05)")
                  }
                >
                  {!notif.read && (
                    <div
                      className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full"
                      style={{ background: "#6366f1" }}
                    />
                  )}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {notif.title}
                        </div>
                        <div
                          className="text-sm mt-0.5"
                          style={{ color: "#94a3b8" }}
                        >
                          {notif.message}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setItemToDelete(notif.id)
                        }}
                        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-smooth opacity-0 group-hover:opacity-100"
                        style={{ color: "#6b7280" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: "#6b7280" }}>
                        {notif.time}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md capitalize"
                        style={{ background: `${color}10`, color }}
                      >
                        {notif.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
