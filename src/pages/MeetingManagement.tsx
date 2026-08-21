import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"

import { X, Trash2, Video, ExternalLink } from "lucide-react"

import {
  fetchMeetings,
  createMeeting,
  deleteMeeting,
  updateMeeting,
} from "../api/meetings"
import { api } from "../api/client"
import { formatDate } from "../utils/date"

import ConfirmModal from "../components/common/ConfirmModal"

interface Meeting {
  id: string

  title: string

  date: string

  time: string

  duration: string

  type: "Internal" | "Client"

  participants: string[]

  agenda: string[]

  status: "Upcoming" | "Completed" | "Cancelled"

  meetingLink?: string
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function MeetingManagement() {
  const [tab, setTab] = useState("Calendar")

  const [meetings, setMeetings] = useState<Meeting[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)

  const [loading, setLoading] = useState(true)

  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "10:00 AM",
    duration: "30 min",
    type: "Internal" as "Internal" | "Client",
    meetingLink: "",
    participants: "",
    agenda: "",
  })

  const selected = meetings.find((m) => m.id === selectedId) || null

  useEffect(() => {
    const loadMeetings = async () => {
      setLoading(true)

      try {
        const data = await fetchMeetings()

        const mapped: Meeting[] = data.map((m) => ({
          id: m.id,

          title: m.title,

          date: m.date,

          time: m.time,

          duration: m.duration,

          type: m.type as "Internal" | "Client",

          participants: m.participants ? m.participants.split(",") : [],

          agenda: m.agenda ? m.agenda.split(",") : [],

          status: m.status as "Upcoming" | "Completed" | "Cancelled",

          meetingLink: m.meetingLink,
        }))

        setMeetings(mapped)
      } catch (e) {
        console.error("Failed to load meetings", e)
      } finally {
        setLoading(false)
      }
    }

    loadMeetings()
  }, [])

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await deleteMeeting(itemToDelete)

      setMeetings((prev) => prev.filter((m) => m.id !== itemToDelete))

      if (selectedId === itemToDelete) setSelectedId(null)

      setItemToDelete(null)
    } catch (e) {
      console.error("Failed to delete meeting", e)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const meeting = meetings.find((m) => m.id === id)

    if (!meeting) return

    const nextStatus = meeting.status === "Upcoming" ? "Completed" : "Upcoming"

    try {
      await updateMeeting(id, { status: nextStatus })

      setMeetings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m)),
      )
    } catch (e) {
      console.error("Failed to update meeting status", e)
    }
  }

  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = i - 1

    const dateStr = d > 0 && d <= 31 ? `2026-08-${d < 10 ? "0" + d : d}` : ""

    const hasMeeting = meetings.some((m) => m.date === dateStr)

    return { day: d > 0 && d <= 31 ? d : null, hasMeeting }
  })

  const tabs = ["Calendar", "Meetings"]

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Meeting Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Schedule and manage client and internal meetings
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          style={{ backgroundColor: "#6366f1" }}
        >
          + Schedule Meeting
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "#252d4a" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium transition-colors relative"
            style={{ color: tab === t ? "#6366f1" : "#64748b" }}
          >
            {t}
            {tab === t && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ backgroundColor: "#6366f1" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {tab === "Calendar" && (
        <div className="flex gap-4 flex-1 min-h-0">
          <div
            className="flex-1 rounded-xl border p-5 flex flex-col"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">August 2026</h3>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded text-xs"
                  style={{ backgroundColor: "#252d4a", color: "#94a3b8" }}
                >
                  ◀
                </button>
                <button
                  className="px-3 py-1 rounded text-xs"
                  style={{ backgroundColor: "#252d4a", color: "#94a3b8" }}
                >
                  ▶
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs py-1 font-medium"
                  style={{ color: "#64748b" }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarDays.map((d, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-colors"
                  style={{
                    backgroundColor:
                      d.day === 6 ? "rgba(99,102,241,0.2)" : "transparent",
                  }}
                >
                  {d.day && (
                    <span
                      className="text-sm"
                      style={{
                        color:
                          d.day === 6
                            ? "#6366f1"
                            : d.day > 0
                              ? "#e2e8f0"
                              : "#64748b",
                      }}
                    >
                      {d.day}
                    </span>
                  )}
                  {d.hasMeeting && d.day && (
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ backgroundColor: "#6366f1" }}
                    />
                  )}
                </div>
              ))}
            </div>
            {meetings.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="rounded-xl p-6 border text-center"
                  style={{
                    backgroundColor: "rgba(28,35,64,0.9)",
                    borderColor: "#252d4a",
                  }}
                >
                  <p className="text-sm font-medium text-white">
                    No meetings scheduled yet
                  </p>
                  <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                    Schedule your first meeting to get started.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="w-80 space-y-3 overflow-auto">
            <p className="text-xs font-medium" style={{ color: "#64748b" }}>
              UPCOMING & SCHEDULED MEETINGS
            </p>
            {loading ? (
              <div
                className="text-center py-8 text-sm"
                style={{ color: "#64748b" }}
              >
                Loading meetings...
              </div>
            ) : meetings.length === 0 ? (
              <div
                className="rounded-xl p-6 border text-center"
                style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
              >
                <p className="text-sm font-medium text-white">
                  No meetings found
                </p>
                <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                  Schedule a meeting to see it here.
                </p>
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="rounded-xl p-4 border cursor-pointer transition-colors"
                  style={{
                    backgroundColor:
                      selected?.id === m.id
                        ? "rgba(99,102,241,0.1)"
                        : "#1c2340",
                    borderColor: selected?.id === m.id ? "#6366f1" : "#252d4a",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-white text-sm">{m.title}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-2"
                      style={{
                        backgroundColor:
                          m.type === "Client"
                            ? "rgba(139,92,246,0.15)"
                            : "rgba(99,102,241,0.15)",
                        color: m.type === "Client" ? "#8b5cf6" : "#6366f1",
                      }}
                    >
                      {m.type}
                    </span>
                  </div>
                    <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
                      {formatDate(m.date)} • {m.time} • {m.duration}
                    </p>
                  {m.meetingLink && (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-medium"
                    >
                      <Video size={13} /> Join Meeting{" "}
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Meetings Tab */}
      {tab === "Meetings" && (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="space-y-3 flex-1 overflow-auto">
            {loading ? (
              <div
                className="text-center py-8 text-sm"
                style={{ color: "#64748b" }}
              >
                Loading meetings...
              </div>
            ) : meetings.length === 0 ? (
              <div
                className="rounded-xl p-8 border text-center"
                style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
              >
                <p className="text-sm font-medium text-white">
                  No meetings are available
                </p>
                <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                  Schedule a meeting to get started.
                </p>
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="rounded-xl p-4 border cursor-pointer transition-colors"
                  style={{
                    backgroundColor:
                      selected?.id === m.id
                        ? "rgba(99,102,241,0.08)"
                        : "#1c2340",
                    borderColor: selected?.id === m.id ? "#6366f1" : "#252d4a",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-center flex-shrink-0"
                      style={{ backgroundColor: "#252d4a" }}
                    >
                      <span
                        className="text-xs font-bold text-white"
                        style={{ lineHeight: 1 }}
                      >
                        {m.date.split("-")[2] || "01"}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "#64748b", lineHeight: 1 }}
                      >
                        Aug
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">
                        {m.title}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#64748b" }}
                      >
                        {m.time} · {m.duration} · {m.participants.length}{" "}
                        participants
                      </p>
                    </div>

                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 flex items-center gap-1.5 transition-colors border border-indigo-500/30 mr-2"
                      >
                        <Video size={14} /> Join Call
                      </a>
                    )}

                    <span
                      className="text-xs px-2 py-0.5 rounded mr-2"
                      style={{
                        backgroundColor:
                          m.status === "Completed"
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(99,102,241,0.15)",
                        color: m.status === "Completed" ? "#10b981" : "#6366f1",
                      }}
                    >
                      {m.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(m.id)
                      }}
                      className="text-xs px-2.5 py-1 rounded border transition-colors mr-2"
                      style={{ borderColor: "#252d4a", color: "#94a3b8" }}
                    >
                      Mark as{" "}
                      {m.status === "Upcoming" ? "Completed" : "Upcoming"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setItemToDelete(m.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {selected && (
            <div
              className="w-80 rounded-xl p-5 border space-y-4"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">
                  {selected.title}
                </h3>
                <button
                  onClick={() => setSelectedId(null)}
                  style={{ color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {selected.meetingLink && (
                <a
                  href={selected.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Video size={15} /> Join Video Call
                </a>
              )}

              <div className="flex items-center justify-between">
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor:
                      selected.status === "Completed"
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(99,102,241,0.15)",
                    color:
                      selected.status === "Completed" ? "#10b981" : "#6366f1",
                  }}
                >
                  {selected.status}
                </span>
                <button
                  onClick={() => handleToggleStatus(selected.id)}
                  className="text-xs px-2.5 py-1 rounded border transition-colors"
                  style={{ borderColor: "#252d4a", color: "#94a3b8" }}
                >
                  Mark as{" "}
                  {selected.status === "Upcoming" ? "Completed" : "Upcoming"}
                </button>
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                  Agenda
                </p>
                {selected.agenda.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center text-xs"
                      style={{ borderColor: "#252d4a", color: "#64748b" }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs" style={{ color: "#94a3b8" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                  Participants
                </p>
                <div className="flex flex-wrap gap-1">
                  {selected.participants.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: "#252d4a", color: "#94a3b8" }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setItemToDelete(selected.id)}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={14} /> Delete Meeting
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-12 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-2xl shadow-2xl p-6"
              style={{
                background: "#13141a",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  Schedule Meeting
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Meeting Title
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Meeting Link (Google Meet, Zoom, Teams)
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="https://meet.google.com/..."
                    value={formData.meetingLink}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingLink: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Time
                    </label>
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="10:00 AM"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "Internal" | "Client",
                        })
                      }
                    >
                      <option value="Internal">Internal</option>
                      <option value="Client">Client</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Duration
                    </label>
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="45 min"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Participants (comma separated)
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Sarah L., Tom K."
                    value={formData.participants}
                    onChange={(e) =>
                      setFormData({ ...formData, participants: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Agenda Items (comma separated)
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="Review goals, Q3 strategy"
                    value={formData.agenda}
                    onChange={(e) =>
                      setFormData({ ...formData, agenda: e.target.value })
                    }
                  />
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 transition-colors hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#6366f1" }}
                  disabled={isCreating}
                  onClick={async () => {
                    let formattedLink = formData.meetingLink

                    if (formattedLink && !formattedLink.startsWith("http")) {
                      formattedLink = `https://${formattedLink}`
                    }

                    try {
                      setIsCreating(true)

                      const saved = await createMeeting({
                        title: formData.title || "New Meeting",

                        date: formData.date || "2026-08-06",

                        time: formData.time || "10:00 AM",

                        duration: formData.duration || "30 min",

                        type: formData.type,

                        meetingLink:
                          formattedLink || "https://meet.google.com/new",

                        participants: formData.participants,

                        agenda: formData.agenda,

                        status: "Upcoming",
                      })

                      const newMeeting: Meeting = {
                        id: saved.id,

                        title: saved.title,

                        date: saved.date,

                        time: saved.time,

                        duration: saved.duration,

                        type: saved.type as "Internal" | "Client",

                        participants: saved.participants
                          ? saved.participants.split(",")
                          : [],

                        agenda: saved.agenda ? saved.agenda.split(",") : [],

                        status:
                          saved.status as "Upcoming" | "Completed" | "Cancelled",

                        meetingLink: saved.meetingLink,
                      }

                      setMeetings([newMeeting, ...meetings])

                      setSelectedId(newMeeting.id)

                      setShowModal(false)

                      setFormData({
                        title: "",
                        date: "",
                        time: "10:00 AM",
                        duration: "30 min",
                        type: "Internal",
                        meetingLink: "",
                        participants: "",
                        agenda: "",
                      })
                    } catch (e) {
                      console.error("Failed to create meeting", e)
                    } finally {
                      setIsCreating(false)
                    }
                  }}
                >
                  {isCreating ? "Creating..." : "Create Meeting"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Meeting"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
