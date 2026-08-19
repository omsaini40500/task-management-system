import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Filter, Search, List, Calendar as CalIcon,
  MoreHorizontal, Paperclip, MessageSquare, Clock,
  X, CheckSquare, Trash, Columns, Send
} from "lucide-react"
import { api } from "../api/client"
import { useAuth } from "../context/AuthContext"
import { useDailyEmailScheduler } from "../hooks/useDailyEmailScheduler"
import ConfirmModal from "../components/common/ConfirmModal"

export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked"
export type Priority = "critical" | "high" | "medium" | "low"

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  tags: string[]
  assignedTo: string[]
  project?: string
  comments: number
  attachments: number
  estimatedHours: number
  spentHours: number
  progress: number
  checklist: Array<{id: string, text: string, done: boolean}>
}

let globalUsers: any[] = []

type View = "kanban" | "list" | "calendar"

// Extended Task interface locally to handle pending/blocked reasons
interface ExtendedTask extends Task {
  pendingReason?: string
}

const statusCols: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "#94a3b8" },
  { key: "in_progress", label: "In Progress / Pending", color: "#6366f1" },
  { key: "review", label: "In Review", color: "#f59e0b" },
  { key: "done", label: "Done", color: "#22c55e" },
  { key: "blocked", label: "Blocked", color: "#ef4444" },
]

const priorityColors: Record<Priority, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e"
}
const priorityDot: Record<Priority, string> = {
  critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500"
}

function Avatar({ userId, size = 22 }: { userId: string; size?: number }) {
  const u = globalUsers.find((u) => u.id === userId)
  const colors = ["from-indigo-500 to-violet-500", "from-blue-500 to-cyan-500", "from-green-500 to-emerald-500", "from-orange-500 to-amber-500"]
  const ci = globalUsers.findIndex((u) => u.id === userId) % colors.length
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colors[ci]} flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={u?.name}
    >
      {u?.avatar}
    </div>
  )
}

function TaskCard({ task, onOpen }: { task: ExtendedTask; onOpen: (t: ExtendedTask) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      onClick={() => onOpen(task)}
      className="kanban-card cursor-pointer rounded-2xl p-4"
      style={{ background: "#13141a", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
          <span className="text-xs font-mono" style={{ color: "#4b5563" }}>#{task.id.replace("t", "TK-")}</span>
        </div>
        <button className="transition-smooth p-0.5 rounded" style={{ color: "#4b5563" }} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={13} />
        </button>
      </div>
      <h4 className="text-sm font-medium text-white mb-2 leading-snug">{task.title}</h4>
      {task.progress > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "#6b7280" }}>Progress</span>
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>{task.progress}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="h-full rounded-full"
              style={{ background: task.progress === 100 ? "#22c55e" : "#6366f1" }}
            />
          </div>
        </div>
      )}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#6b7280" }}>
          <Clock size={11} />
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No Date"}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6b7280" }}>
          {task.comments > 0 && <span className="flex items-center gap-1"><MessageSquare size={11} />{task.comments}</span>}
          {task.attachments > 0 && <span className="flex items-center gap-1"><Paperclip size={11} />{task.attachments}</span>}
          <div className="flex -space-x-1">
            {task.assignedTo.slice(0, 3).map((uid) => <Avatar key={uid} userId={uid} size={20} />)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TaskDrawer({ 
  task, 
  onClose, 
  onDelete, 
  onUpdateStatus 
}: { 
  task: ExtendedTask; 
  onClose: () => void; 
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus, pendingReason?: string) => void;
}) {
  const { user } = useAuth()
  const role = user?.role || "member"
  
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status)
  const [reason, setReason] = useState(task.pendingReason || "")

  const canDelete = 
    role === "super_admin" || 
    role === "admin" || 
    ((role === "team_leader" || role === "member") && task.assignedTo.includes(user?.id || ""))

  const handleStatusChange = (newStatus: TaskStatus) => {
    setCurrentStatus(newStatus)
    onUpdateStatus(task.id, newStatus, reason)
  }

  const handleReasonBlur = () => {
    onUpdateStatus(task.id, currentStatus, reason)
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto"
      style={{ width: 440, background: "#0f1017", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: "rgba(15,16,23,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: "#6366f1" }}>#{task.id.replace("t", "TK-")}</span>
          <span className={`badge priority-${task.priority}`}>{task.priority}</span>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <button onClick={() => onDelete(task.id)} className="px-2 py-1 rounded text-xs transition-smooth hover:bg-red-500/20 text-red-400">
              <Trash size={12} className="inline mr-1"/>Delete
            </button>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-smooth" style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>{task.title}</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "#6b7280" }}>{task.description}</p>

        {/* Status Dropdown & Priority */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-1" style={{ color: "#4b5563" }}>Status</div>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress / Pending</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-1" style={{ color: "#4b5563" }}>Priority</div>
            <span className={`badge priority-${task.priority}`}>{task.priority}</span>
          </div>
        </div>

        {/* Reason for Pending / Blocked Option */}
        {(currentStatus === "blocked" || currentStatus === "in_progress") && (
          <div className="mb-5 rounded-xl p-3" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <label className="block text-xs font-medium text-red-400 mb-1">
              Reason for {currentStatus === "blocked" ? "Blocker" : "Pending Status"}
            </label>
            <textarea
              rows={2}
              placeholder="Enter reason why this task is pending or blocked..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={handleReasonBlur}
            />
          </div>
        )}

        {/* Time */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Estimated", value: `${task.estimatedHours}h` },
            { label: "Spent", value: `${task.spentHours}h` },
            { label: "Remaining", value: `${Math.max(0, task.estimatedHours - task.spentHours).toFixed(1)}h` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-sm font-semibold text-white">{item.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Progress</span>
            <span className="text-xs font-semibold text-white">{task.progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${task.progress}%`, background: "#6366f1" }} />
          </div>
        </div>

        {/* Assignees */}
        <div className="mb-5">
          <div className="text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>Assignees</div>
          <div className="flex flex-wrap gap-2">
            {task.assignedTo.map((uid) => {
              const u = globalUsers.find((x) => x.id === uid)
              return (
                <div key={uid} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Avatar userId={uid} size={20} />
                  <span className="text-xs text-white">{u?.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Checklist */}
        {task.checklist.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Checklist</span>
              <span className="text-xs" style={{ color: "#6b7280" }}>{task.checklist.filter((c) => c.done).length}/{task.checklist.length}</span>
            </div>
            <div className="space-y-2">
              {task.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${item.done ? "bg-indigo-500" : ""}`} style={{ border: item.done ? "none" : "1.5px solid rgba(255,255,255,0.2)" }}>
                    {item.done && <CheckSquare size={10} className="text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: item.done ? "#6b7280" : "#94a3b8", textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Tasks() {
  const { user } = useAuth()
  const [view, setView] = useState<View>("kanban")
  const [tasks, setTasks] = useState<ExtendedTask[]>([])
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const { sendDailyEmail, sending } = useDailyEmailScheduler()

  const openNewTaskModal = () => {
    setFormData(prev => ({ ...prev, assignedBy: user?.name || '' }))
    setShowNewTask(true)
  }

  useEffect(() => {
    Promise.all([
      api.get<{items: any[]}>("/users").then(r => r.items),
      api.get<{items: Task[]}>("/tasks").then(r => r.items)
    ]).then(([usersData, tasksData]) => {
      globalUsers = usersData
      setTasks(tasksData as ExtendedTask[])
    }).catch(console.error)
  }, [])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all")
  const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', estimatedHours: '', assignedBy: '', assignedTo: '' })

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return
    try {
      await api.delete(`/tasks/${taskToDelete}`)
      setTasks(prev => prev.filter(t => t.id !== taskToDelete))
      setSelectedTask(null)
      setTaskToDelete(null)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendDailyReport = async () => {
    const sent = await sendDailyEmail()
    if (sent) {
      setEmailStatus('Daily task summary email sent to super admin successfully!')
      setTimeout(() => setEmailStatus(null), 5000)
    } else {
      setEmailStatus('Failed to send daily report. Please try again.')
      setTimeout(() => setEmailStatus(null), 5000)
    }
  }

  const handleUpdateStatus = async (taskId: string, status: TaskStatus, pendingReason?: string) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status, progress: status === "done" ? 100 : undefined })
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return { 
            ...t, 
            status, 
            pendingReason,
            progress: status === "done" ? 100 : t.progress 
          }
        }
        return t
      }))
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status, pendingReason, progress: status === "done" ? 100 : prev.progress } : null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    if (filterPriority !== "all" && t.priority !== filterPriority) return false
    return true
  })

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Tasks</h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{filtered.length} tasks · {tasks.filter((t) => t.status === "done").length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-xl overflow-hidden p-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {([["kanban", <Columns size={14} />], ["list", <List size={14} />], ["calendar", <CalIcon size={14} />]] as const).map(([v, icon]) => (
              <button
                key={v}
                onClick={() => setView(v as View)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth flex items-center gap-1.5"
                style={{ background: view === v ? "#6366f1" : "transparent", color: view === v ? "white" : "#6b7280" }}
              >
                {icon}{v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={openNewTaskModal} className="btn btn-primary">
            <Plus size={14} /> New Task
          </button>
          <button
            onClick={handleSendDailyReport}
            disabled={sending}
            className="btn btn-secondary"
            title="Send daily task summary to super admin"
          >
            <Send size={14} />
            {sending ? 'Sending...' : 'Send Daily Report'}
          </button>
          {emailStatus && (
            <span className="text-xs px-3 py-1.5 rounded-lg" style={{
              background: emailStatus.includes('success') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: emailStatus.includes('success') ? '#10b981' : '#ef4444',
              border: `1px solid ${emailStatus.includes('success') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              {emailStatus}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }} />
          <input className="input pl-9 py-2 text-xs" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          className="input py-2 text-xs w-36"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">All Status</option>
          {statusCols.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select
          className="input py-2 text-xs w-36"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as any)}
        >
          <option value="all">All Priority</option>
          {(["critical", "high", "medium", "low"] as Priority[]).map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <button className="btn btn-secondary text-xs gap-1.5">
          <Filter size={12} /> Filters
        </button>
      </div>

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusCols.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.key)
            return (
              <div key={col.key} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-xs font-semibold text-white">{col.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md ml-auto" style={{ background: "rgba(255,255,255,0.06)", color: "#6b7280" }}>{colTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-24 rounded-2xl p-2" style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.04)" }}>
                  <AnimatePresence>
                    {colTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onOpen={setSelectedTask} />
                    ))}
                  </AnimatePresence>
                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs" style={{ color: "#374151" }}>No tasks</div>
                  )}
                  <button onClick={openNewTaskModal} className="w-full py-2 rounded-xl text-xs transition-smooth flex items-center justify-center gap-1" style={{ color: "#4b5563" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <Plus size={12} /> Add task
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="card overflow-hidden">
          <div className="grid text-xs font-semibold uppercase tracking-widest px-4 py-3 border-b" style={{ gridTemplateColumns: "1fr 120px 100px 100px 120px 80px", color: "#4b5563", borderColor: "rgba(255,255,255,0.06)", fontFamily: "JetBrains Mono, monospace" }}>
            <span>Task</span><span>Assignee</span><span>Priority</span><span>Status</span><span>Due Date</span><span>Progress</span>
          </div>
          <AnimatePresence>
            {filtered.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedTask(task)}
                className="grid items-center px-4 py-3 border-b table-row cursor-pointer"
                style={{ gridTemplateColumns: "1fr 120px 100px 100px 120px 80px", borderColor: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityColors[task.priority] }} />
                  <span className="text-sm text-white truncate">{task.title}</span>
                </div>
                <div className="flex -space-x-1">
                  {task.assignedTo.slice(0, 2).map((uid) => <Avatar key={uid} userId={uid} size={22} />)}
                </div>
                <span className={`badge priority-${task.priority} text-xs`}>{task.priority}</span>
                <span className={`badge status-${task.status.replace("_", "-")} text-xs`}>{task.status.replace("_", " ")}</span>
                <span className="text-xs" style={{ color: "#6b7280" }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No Date"}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: "#6366f1" }} />
                  </div>
                  <span className="text-xs" style={{ color: "#6b7280" }}>{task.progress}%</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="card p-6">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "#6b7280", fontFamily: "JetBrains Mono, monospace" }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 4 + 1
              const dayTasks = filtered.filter((t) => {
                if (!t.dueDate) return false
                const d = new Date(t.dueDate)
                return d.getMonth() === 10 && d.getDate() === day
              })
              const isToday = day === 8
              return (
                <div key={i} className="min-h-20 rounded-xl p-2 transition-smooth" style={{ background: day < 1 || day > 30 ? "transparent" : isToday ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)", border: day < 1 || day > 30 ? "none" : isToday ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(255,255,255,0.04)" }}>
                  {day >= 1 && day <= 30 && (
                    <>
                      <div className={`text-xs font-semibold mb-1 ${isToday ? "text-indigo-400" : ""}`} style={{ color: isToday ? "#818cf8" : "#6b7280" }}>{day}</div>
                      {dayTasks.slice(0, 2).map((t) => (
                        <div key={t.id} onClick={() => setSelectedTask(t)} className="text-xs px-1.5 py-0.5 rounded-md mb-0.5 truncate cursor-pointer" style={{ background: `${priorityColors[t.priority]}18`, color: priorityColors[t.priority] }}>{t.title}</div>
                      ))}
                      {dayTasks.length > 2 && <div className="text-xs" style={{ color: "#4b5563" }}>+{dayTasks.length - 2}</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Drawers and Modals */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedTask(null)} />
            <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} onDelete={handleDeleteTask} onUpdateStatus={handleUpdateStatus} />
          </>
        )}
        <ConfirmModal
          isOpen={!!taskToDelete}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={confirmDeleteTask}
          onCancel={() => setTaskToDelete(null)}
        />
        {showNewTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowNewTask(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-2xl shadow-2xl p-6"
              style={{ background: "#13141a", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Create New Task</h2>
                <button onClick={() => setShowNewTask(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Task Title</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                  <textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none min-h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Priority</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Est. Hours</label>
                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" value={formData.estimatedHours} onChange={e => setFormData({...formData, estimatedHours: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Assigned By</label>
                    <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" placeholder="e.g. Admin" value={formData.assignedBy} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Assigned To</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                      <option value="">Select Assignee</option>
                      {globalUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 transition-colors hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#6366f1' }}
                  disabled={isCreating}
                  onClick={async () => {
                    try {
                      setIsCreating(true)
                      const payload = {
                        title: formData.title || 'Unnamed Task',
                        description: formData.description || '',
                        priority: formData.priority,
                        estimated_hours: Number(formData.estimatedHours) || 0,
                        assigned_to: formData.assignedTo ? [formData.assignedTo] : []
                      }
                      const newTask = await api.post<any>("/tasks", payload)
                      setTasks(prev => [newTask, ...prev])
                      setShowNewTask(false)
                      setFormData({ title: '', description: '', priority: 'medium', estimatedHours: '', assignedBy: '', assignedTo: '' })
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setIsCreating(false)
                    }
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
