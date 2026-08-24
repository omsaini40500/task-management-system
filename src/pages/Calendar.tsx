import { useEffect, useState } from "react"
import useNotificationSound from "../hooks/useNotificationSound"

import { motion, AnimatePresence } from "framer-motion"

import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react"

import { api } from "../api/client"

import type { Task } from "../types"

import ConfirmModal from "../components/common/ConfirmModal"

const priorityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function Calendar() {
  const { play: playSound } = useNotificationSound()
  const [year, setYear] = useState(() => new Date().getFullYear())

  const [month, setMonth] = useState(() => new Date().getMonth())

  const [tasksList, setTasksList] = useState<Task[]>([])

  const [loading, setLoading] = useState(true)

  const [showNewEvent, setShowNewEvent] = useState(false)

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    dueDate: "",
    priority: "medium",
  })

  const [selectedEvent, setSelectedEvent] = useState<Task | null>(null)

  const [itemToDelete, setItemToDelete] = useState<Task | null>(null)

  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    api

      .get<{ items: Task[] }>("/tasks")

      .then((data) =>
        setTasksList(Array.isArray(data?.items) ? data.items : []),
      )

      .catch((err) => console.error("Failed to load calendar tasks", err))

      .finally(() => setLoading(false))
  }, [])

  const firstDay = new Date(year, month, 1).getDay()

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prev = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }

  const next = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await api.delete(`/tasks/${itemToDelete.id}`)

      setTasksList((prev) => prev.filter((t) => t.id !== itemToDelete.id))

      setSelectedEvent(null)
    } catch (e) {
      console.error(e)
    }

    setItemToDelete(null)
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Calendar
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Task schedule and deadlines
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowNewEvent(true)}
        >
          <Plus size={14} /> New Event
        </button>
      </div>

      <div className="card p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-smooth"
            style={{ background: "rgba(255,255,255,0.04)", color: "#6b7280" }}
          >
            <ChevronLeft size={14} />
          </button>
          <h3
            className="text-base font-semibold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {MONTHS[month]} {year}
          </h3>
          <button
            onClick={next}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-smooth"
            style={{ background: "rgba(255,255,255,0.04)", color: "#6b7280" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold py-2"
              style={{
                color: "#6b7280",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1

            const dayTasks = tasksList.filter((t) => {
              const d = new Date(t.dueDate)

              return (
                d.getFullYear() === year &&
                d.getMonth() === month &&
                d.getDate() === day
              )
            })

            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()

            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.02 }}
                className="min-h-24 rounded-xl p-2 transition-smooth"
                style={{
                  background: isToday
                    ? "rgba(99,102,241,0.1)"
                    : "rgba(255,255,255,0.02)",

                  border: `1px solid ${
                    isToday ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)"
                  }`,
                }}
              >
                <div
                  className={`text-xs font-semibold mb-1.5 w-6 h-6 rounded-full flex items-center justify-center`}
                  style={{
                    color: isToday ? "white" : "#94a3b8",
                    background: isToday ? "#6366f1" : "transparent",
                  }}
                >
                  {day}
                </div>
                {dayTasks.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedEvent(t)}
                    className="text-xs px-1.5 py-0.5 rounded-md mb-0.5 truncate cursor-pointer hover:opacity-80"
                    style={{
                      background: `${priorityColors[t.priority]}18`,
                      color: priorityColors[t.priority],
                      fontSize: 10,
                    }}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "#4b5563", fontSize: 10 }}
                  >
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="mt-5 card p-5">
        <h3
          className="text-sm font-semibold text-white mb-4"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Upcoming Deadlines
        </h3>
        <div className="space-y-2">
          {tasksList
            .filter((t) => t.status !== "done")
            .sort(
              (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
            )
            .slice(0, 6)
            .map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedEvent(task)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl table-row cursor-pointer hover:bg-white/5 transition-smooth"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: priorityColors[task.priority] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {task.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                    {task.department}
                  </div>
                </div>
                <div className="text-xs font-mono" style={{ color: "#6b7280" }}>
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <span className={`badge priority-${task.priority}`}>
                  {task.priority}
                </span>
              </motion.div>
            ))}
          {!loading &&
            tasksList.filter((t) => t.status !== "done").length === 0 && (
              <div
                className="py-10 text-center text-sm"
                style={{ color: "#64748b" }}
              >
                No upcoming task deadlines available.
              </div>
            )}
          {loading && (
            <div
              className="py-10 text-center text-sm"
              style={{ color: "#64748b" }}
            >
              Loading tasks…
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowNewEvent(false)}
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
                <h2 className="text-lg font-bold text-white">New Event</h2>
                <button
                  onClick={() => setShowNewEvent(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Event Title
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none min-h-20"
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      value={eventForm.startDate}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      value={eventForm.dueDate}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={eventForm.priority}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, priority: e.target.value })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 transition-colors hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#6366f1" }}
                  disabled={isCreating}
                  onClick={async () => {
                    try {
                      setIsCreating(true)

                      const payload = {
                        title: eventForm.title || "Unnamed Event",

                        description: eventForm.description || "",

                        startDate:
                          eventForm.startDate ||
                          new Date().toISOString().split("T")[0],

                        dueDate:
                          eventForm.dueDate ||
                          new Date().toISOString().split("T")[0],

                        priority: eventForm.priority,

                        status: "todo",

                        progress: 0,

                        estimatedHours: 0,

                        assignedTo: [],

                        tags: [],

                        checklist: [],

                        comments: 0,

                        attachments: 0,

                        watchers: [],
                      }

                      const newTask = await api.post<any>("/tasks", payload)
                      playSound()
                      setTasksList((prev) => [newTask, ...prev])

                      setShowNewEvent(false)

                      setEventForm({
                        title: "",
                        description: "",
                        startDate: "",
                        dueDate: "",
                        priority: "medium",
                      })
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setIsCreating(false)
                    }
                  }}
                >
                  {isCreating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setSelectedEvent(null)}
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
                <h2 className="text-lg font-bold text-white">Event Details</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1">
                    Title
                  </div>
                  <div className="text-sm text-white">
                    {selectedEvent.title}
                  </div>
                </div>
                {selectedEvent.description && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">
                      Description
                    </div>
                    <div className="text-sm text-white">
                      {selectedEvent.description}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">
                      Start Date
                    </div>
                    <div className="text-sm text-white">
                      {selectedEvent.startDate
                        ? new Date(selectedEvent.startDate).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-1">
                      Due Date
                    </div>
                    <div className="text-sm text-white">
                      {selectedEvent.dueDate
                        ? new Date(selectedEvent.dueDate).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1">
                    Priority
                  </div>
                  <span className={`badge priority-${selectedEvent.priority}`}>
                    {selectedEvent.priority}
                  </span>
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-4 transition-colors hover:bg-red-600 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#ef4444" }}
                  onClick={() => setItemToDelete(selectedEvent)}
                >
                  <Trash2 size={14} /> Delete Event
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Event"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
