import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  CheckSquare,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Filter,
  X,
  Trash2,
} from "lucide-react"
import { api } from "../api/client"
import { useEffect } from "react"
import ConfirmModal from "../components/common/ConfirmModal"

export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "on_hold" | "completed" | "cancelled"
  progress: number
  budget: number
  spent: number
  managerId: string
  clientId?: string
  category: string
  color: string
  team: string[]
  tasks: number
  completedTasks: number
  endDate?: string
}

let globalUsers: any[] = []

const statusLabels: Record<string, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
}
const statusColors: Record<string, string> = {
  active: "#22c55e",
  on_hold: "#f59e0b",
  completed: "#6366f1",
  cancelled: "#6b7280",
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project
  onDelete: (project: Project) => void
}) {
  const manager = globalUsers.find((u) => u.id === project.managerId)
  const budgetPct = Math.round((project.spent / project.budget) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(0,0,0,0.45)" }}
      className="card p-5 cursor-pointer relative overflow-hidden"
      transition={{ duration: 0.15 }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, ${project.color} 0%, transparent 100%)`,
        }}
      />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0"
            style={{
              background: `${project.color}20`,
              border: `1px solid ${project.color}30`,
            }}
          >
            <div
              className="w-full h-full rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ color: project.color }}
            >
              {project.name.charAt(0)}
            </div>
          </div>
          <div>
            <h3
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {project.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: statusColors[project.status] }}
              />
              <span className="text-xs" style={{ color: "#6b7280" }}>
                {statusLabels[project.status]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="transition-smooth p-1 rounded"
              style={{ color: "#4b5563" }}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(project)
              }}
              title="Delete project"
            >
              <Trash2 size={14} />
            </button>
            <button
              className="transition-smooth p-1 rounded"
              style={{ color: "#4b5563" }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="flex items-center justify-center mb-1">
            <CheckSquare size={11} style={{ color: "#6366f1" }} />
          </div>
          <div className="text-sm font-semibold text-white">
            {project.completedTasks}
            <span className="text-xs font-normal text-gray-600">
              /{project.tasks}
            </span>
          </div>
          <div className="text-xs" style={{ color: "#4b5563" }}>
            Tasks
          </div>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="flex items-center justify-center mb-1">
            <Users size={11} style={{ color: "#8b5cf6" }} />
          </div>
          <div className="text-sm font-semibold text-white">
            {project.team.length}
          </div>
          <div className="text-xs" style={{ color: "#4b5563" }}>
            Members
          </div>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="flex items-center justify-center mb-1">
            <DollarSign size={11} style={{ color: "#10b981" }} />
          </div>
          <div className="text-sm font-semibold text-white">{budgetPct}%</div>
          <div className="text-xs" style={{ color: "#4b5563" }}>
            Budget
          </div>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: "#6b7280" }}>
            Budget: ${(project.spent / 1000).toFixed(0)}k / $
            {(project.budget / 1000).toFixed(0)}k
          </span>
          <span
            className="text-xs"
            style={{ color: budgetPct > 85 ? "#ef4444" : "#6b7280" }}
          >
            {budgetPct}%
          </span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(budgetPct, 100)}%`,
              background: budgetPct > 85 ? "#ef4444" : "#22c55e",
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
            {manager?.avatar}
          </div>
          <span className="text-xs" style={{ color: "#6b7280" }}>
            {manager?.name}
          </span>
        </div>
        <div
          className="flex items-center gap-1 text-xs"
          style={{ color: "#6b7280" }}
        >
          <Calendar size={10} />
          {project.endDate
            ? new Date(project.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "No due date"}
        </div>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [localProjects, setLocalProjects] = useState<Project[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    createdBy: "",
    manager: "",
  })

  useEffect(() => {
    Promise.all([api.get<{items: any[]}>("/users").then(r => r.items), api.get<{items: Project[]}>("/projects").then(r => r.items)])
      .then(([uData, pData]) => {
        globalUsers = uData
        setLocalProjects(pData)
      })
      .catch(console.error)
  }, [])

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    try {
      await api.delete(`/projects/${projectToDelete.id}`)
      setLocalProjects((prev) => prev.filter((project) => project.id !== projectToDelete.id))
      setProjectToDelete(null)
    } catch (error) {
      console.error("Failed to delete project", error)
    }
  }

  const filtered = localProjects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
      return false
    if (filterStatus !== "all" && p.status !== filterStatus) return false
    return true
  })

  const totalBudget = localProjects.reduce((acc, p) => acc + p.budget, 0)
  const totalSpent = localProjects.reduce((acc, p) => acc + p.spent, 0)

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Projects
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            {localProjects.filter((p) => p.status === "active").length} active ·{" "}
            {localProjects.length} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Projects",
            value: localProjects.length,
            icon: TrendingUp,
            color: "#6366f1",
          },
          {
            label: "Active",
            value: localProjects.filter((p) => p.status === "active").length,
            icon: CheckSquare,
            color: "#22c55e",
          },
          {
            label: "Total Budget",
            value: `$${(totalBudget / 1000).toFixed(0)}k`,
            icon: DollarSign,
            color: "#f59e0b",
          },
          {
            label: "Spent",
            value: `$${(totalSpent / 1000).toFixed(0)}k`,
            icon: ArrowUpRight,
            color: "#8b5cf6",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4 flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${stat.color}18` }}
            >
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <div>
              <div
                className="text-lg font-bold text-white"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "#6b7280" }}>
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6b7280" }}
          />
          <input
            className="input pl-9 py-2 text-xs"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input py-2 text-xs w-36"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filtered.map((project, i) => (
          <motion.div key={project.id} transition={{ delay: i * 0.06 }}>
            <ProjectCard project={project} onDelete={handleDeleteProject} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            <div className="text-4xl mb-4">📁</div>
            <div className="text-sm font-medium text-white mb-1">
              No projects found
            </div>
            <div className="text-xs" style={{ color: "#6b7280" }}>
              Try adjusting your filters
            </div>
          </div>
        )}
      </div>

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
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-2xl shadow-2xl p-6"
              style={{
                background: "#13141a",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  Create New Project
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
                    Project Name
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none min-h-20"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Budget
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 50000"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Created By
                    </label>
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g. Admin"
                      value={formData.createdBy}
                      onChange={(e) =>
                        setFormData({ ...formData, createdBy: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Handled By (Manager)
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      value={formData.manager}
                      onChange={(e) =>
                        setFormData({ ...formData, manager: e.target.value })
                      }
                    >
                      <option value="">Select Manager</option>
                      {globalUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 transition-colors hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#6366f1" }}
                  disabled={isCreating}
                  onClick={async () => {
                    try {
                      setIsCreating(true)
                      const payload = {
                        name: formData.name || "Unnamed Project",
                        description: formData.description || "",
                        budget: Number(formData.budget) || 10000,
                        manager_id: formData.manager || undefined,
                        team: formData.manager ? [formData.manager] : [],
                      }
                      const newProj = await api.post<any>("/projects", payload)
                      setLocalProjects([newProj, ...localProjects])
                      setShowModal(false)
                      setFormData({
                        name: "",
                        description: "",
                        budget: "",
                        createdBy: "",
                        manager: "",
                      })
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setIsCreating(false)
                    }
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </motion.div>
          </>
        )}
        <ConfirmModal
          isOpen={!!projectToDelete}
          title="Delete Project"
          message={`Are you sure you want to delete project '${projectToDelete?.name}'? This action cannot be undone.`}
          onConfirm={confirmDeleteProject}
          onCancel={() => setProjectToDelete(null)}
        />
      </AnimatePresence>
    </div>
  )
}
