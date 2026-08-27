import { useState } from "react"

import { motion, AnimatePresence } from "framer-motion"

import {
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  Mail,
  Clock,
  Trash,
  X,
} from "lucide-react"

import { api } from "../api/client"
import { getDepartments, resolveDeptName } from "../api/org"

import { useEffect } from "react"

import ConfirmModal from "../components/common/ConfirmModal"

export type Role = "super_admin" | "admin" | "team_leader" | "project_manager" | "member" | "client"

export interface User {
  id: string

  name: string

  email: string

  avatar: string

  role: Role

  department: string

  team: string

  status: "active" | "inactive"

  joinedAt: string

  lastActive: string

  tasksCompleted: number

  tasksTotal: number

  isBlocked?: boolean

  isActive: boolean
}

import { useAuth } from "@/context/AuthContext"

const roleColors: Record<Role, string> = {
  super_admin: "from-violet-500 to-indigo-500",

  admin: "from-blue-500 to-cyan-500",

  team_leader: "from-green-500 to-emerald-500",

  project_manager: "from-orange-500 to-amber-500",

  member: "from-slate-500 to-slate-400",

  client: "from-pink-500 to-rose-500",
}

const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",

  admin: "Admin",

  team_leader: "Team Leader",

  project_manager: "Project Manager",

  member: "Member",

  client: "Client",
}

const roleBadgeColors: Record<Role, string> = {
  super_admin: "rgba(139,92,246,0.15)",

  admin: "rgba(59,130,246,0.15)",

  team_leader: "rgba(34,197,94,0.15)",

  project_manager: "rgba(249,115,22,0.15)",

  member: "rgba(148,163,184,0.12)",

  client: "rgba(236,72,153,0.12)",
}

const roleTextColors: Record<Role, string> = {
  super_admin: "#a78bfa",

  admin: "#60a5fa",

  team_leader: "#4ade80",

  project_manager: "#fb923c",

  member: "#94a3b8",

  client: "#f472b6",
}

function MemberCard({
  user,
  onDelete,
  canDelete,
  onUnblock,
  canUnblock,
}: {
  user: User
  onDelete: (id: string) => void
  canDelete: boolean
  onUnblock: (id: string) => void
  canUnblock: boolean
}) {
  const completion =
    user.tasksTotal > 0
      ? Math.round((user.tasksCompleted / user.tasksTotal) * 100)
      : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}
      className={`card p-5 relative ${user.isBlocked ? 'border border-red-500/30' : ''}`}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0`}
          >
            {user.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              {user.name}
              {user.role === "super_admin" && (
                <Shield size={11} style={{ color: "#6366f1" }} />
              )}
              {user.isBlocked && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  BLOCKED
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              {user.department}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUnblock && user.isBlocked && (
            <button
              onClick={() => onUnblock(user.id)}
              className="transition-smooth px-2 py-1 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              title="Unblock Account"
            >
              UNBLOCK
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(user.id)}
              className="transition-smooth p-0.5 rounded text-red-400 hover:bg-red-500/20"
              title="Delete Account"
            >
              <Trash size={13} />
            </button>
          )}
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              user.isActive ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <button
            className="transition-smooth p-0.5 rounded"
            style={{ color: "#4b5563" }}
          >
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      <div
        className="px-2 py-1.5 rounded-lg mb-4 inline-flex"
        style={{ background: roleBadgeColors[user.role] }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: roleTextColors[user.role] }}
        >
          {roleLabels[user.role]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "#6b7280" }}
        >
          <Mail size={11} />
          {user.email}
        </div>
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "#6b7280" }}
        >
          <Clock size={11} />
          Last active: {user.lastActive}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: "#6b7280" }}>
            Task completion
          </span>
          <span className="text-xs font-semibold text-white">
            {user.tasksCompleted}/{user.tasksTotal}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full rounded-full"
            style={{
              background:
                completion > 80
                  ? "#22c55e"
                  : completion > 60
                    ? "#6366f1"
                    : "#f59e0b",
            }}
          />
        </div>
        <div className="text-xs mt-1 text-right" style={{ color: "#6b7280" }}>
          {completion}%
        </div>
      </div>
    </motion.div>
  )
}

export default function Team() {
  const [search, setSearch] = useState("")

  const [filterRole, setFilterRole] = useState<Role | "all">("all")

  const [filterDept, setFilterDept] = useState("all")

  const [activeTab, setActiveTab] =
    useState<"members" | "departments" | "clients" | "blocked" | "permissions">("members")

  const [teamUsers, setTeamUsers] = useState<User[]>([])

  const [showInviteModal, setShowInviteModal] = useState(false)

  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [realDepartments, setRealDepartments] = useState<Array<{
    id: string
    name: string
  }>>([])

  const { user: currentUser } = useAuth()

  useEffect(() => {
    Promise.all([
      api.get<{ items: any[] }>("/users").then((r) => r.items),
      getDepartments(),
    ])
      .then(([usersData, depts]) => {
        setRealDepartments(depts)
        if (depts.length > 0 && !inviteForm.department) {
          setInviteForm((prev) => ({ ...prev, department: depts[0].id }))
          setImmediateForm((prev) => ({ ...prev, department: depts[0].id }))
        }

        const isShalom = currentUser?.department?.toLowerCase() === "shalom" || currentUser?.department?.toLowerCase() === "shellom"
        
        const mapped = usersData.map((u) => ({
            ...u,
            department: resolveDeptName(u.departmentId) || "Unassigned",
            team: u.teamId || "",
            tasksCompleted: u.tasksCompleted || 0,
            tasksTotal: u.tasksTotal || 0,
            lastActive: u.lastActiveAt
              ? new Date(u.lastActiveAt).toLocaleDateString()
              : "Never",
            isActive: u.isActive ?? true,
            status: u.isActive ? "active" : "inactive",
          }))

        setTeamUsers(
          isShalom ? mapped.filter(u => u.department.toLowerCase() === "shalom" || u.department.toLowerCase() === "shellom") : mapped
        )
      })
      .catch(console.error)
  }, [currentUser?.department])

  // Form State for Invite Member

  const [inviteForm, setInviteForm] = useState({
    name: "",

    email: "",

    role: "member" as Role,

    department: "",
  })

  // Form State for Add Immediately

  const [showAddImmediateModal, setShowAddImmediateModal] = useState(false)

  const [immediateForm, setImmediateForm] = useState({
    name: "",

    email: "",

    role: "member" as Role,

    department: "",

    password: "",
  })

  const canDeleteUsers = currentUser?.role === "super_admin"

  const departments = [...new Set(teamUsers.map((u) => u.department))]

  const filtered = teamUsers.filter((u) => {
    if (
      search &&
      !u.name.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase())
    )
      return false

    if (activeTab === "members" && u.role === "client") return false
    if (activeTab === "clients" && u.role !== "client") return false

    if (filterRole !== "all" && u.role !== filterRole) return false

    if (filterDept !== "all" && u.department !== filterDept) return false

    return true
  })

  const handleDeleteUser = (id: string) => {
    setItemToDelete(id)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await api.delete(`/users/${itemToDelete}`)

      setTeamUsers((prev) => prev.filter((u) => u.id !== itemToDelete))

      window.dispatchEvent(new Event("users-updated"))
    } catch (e) {
      console.error(e)
    } finally {
      setItemToDelete(null)
    }
  }

  const handleUnblockUser = async (id: string) => {
    try {
      await api.post(`/users/${id}/unblock`)
      setTeamUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isBlocked: false } : u))
      )
    } catch (e) {
      console.error(e)
    }
  }

  const [isInviting, setIsInviting] = useState(false)
  
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteForm.name || !inviteForm.email || isInviting) return
    setIsInviting(true)
    try {
      const u = await api.post<any>("/users", {
        name: inviteForm.name,

        email: inviteForm.email,

        role: inviteForm.role,

        departmentId: inviteForm.department,
      })

      setTeamUsers((prev) => [
        ...prev,
        {
          id: u.id,

          name: u.name,

          email: u.email,

          role: u.role,

          department: resolveDeptName(u.departmentId) || "Unassigned",

          avatar: "",

          isActive: true,

          status: "active",

          tasksCompleted: 0,

          tasksTotal: 0,

          lastActive: "Just now",

          team: u.teamId || "",
        },
      ])

      setInviteForm({
        name: "",
        email: "",
        role: "member" as any,
        department: realDepartments.length > 0 ? realDepartments[0].id : "",
      })

      window.dispatchEvent(new Event("users-updated"))
      setShowInviteModal(false)
      alert(msg)
    } catch (e: any) {
      console.error(e)

      const msg = e?.detail
        ? Array.isArray(e.detail)
          ? e.detail.map((x: any) => x.msg).join(", ")
          : e.detail
        : e?.message || "An error occurred"

      alert(msg)
    } finally { setIsInviting(false) }
  }

  const handleAddImmediateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const u = await api.post<any>("/users", {
        name: immediateForm.name,

        email: immediateForm.email,

        role: immediateForm.role,

        departmentId: immediateForm.department,

        password: immediateForm.password,
      })

      setTeamUsers((prev) => [
        ...prev,
        {
          id: u.id,

          name: u.name,

          email: u.email,

          role: u.role,

          department: resolveDeptName(u.departmentId) || "Unassigned",

          avatar: "",

          isActive: true,

          status: "active",

          tasksCompleted: 0,

          tasksTotal: 0,

          lastActive: "Just now",

          team: u.teamId || "",
        },
      ])

      setShowAddImmediateModal(false)

      setImmediateForm({
        name: "",
        email: "",
        role: "member",
        department: realDepartments.length > 0 ? realDepartments[0].id : "",
        password: "",
      })

      window.dispatchEvent(new Event("users-updated"))
    } catch (e: any) {
      console.error(e)

      const msg = e?.detail
        ? Array.isArray(e.detail)
          ? e.detail.map((x: any) => x.msg).join(", ")
          : e.detail
        : e?.message || "An error occurred"

      alert(msg)
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Team
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            {teamUsers.filter((u) => u.isActive).length} active ·{" "}
            {teamUsers.length} total members
          </p>
        </div>
        <div className="flex gap-2">
          {currentUser?.role === "super_admin" && (
            <button
              onClick={() => setShowAddImmediateModal(true)}
              className="btn btn-secondary flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Immediately
            </button>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Invite Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {(currentUser?.role === "super_admin"
          ? ["members", "clients", "departments", "blocked"]
          : ["members", "clients", "departments"]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className="px-4 py-2 rounded-lg text-xs font-medium capitalize transition-smooth"
            style={{
              background: activeTab === tab ? "#6366f1" : "transparent",
              color: activeTab === tab ? "white" : "#6b7280",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {(activeTab === "members" || activeTab === "clients") && (
        <>
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
                placeholder="Search members…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input py-2 text-xs w-40"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
            >
              <option value="all">All Roles</option>
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              className="input py-2 text-xs w-40"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((user, i) => (
              <motion.div key={user.id} transition={{ delay: i * 0.04 }}>
                <MemberCard
                  user={user}
                  onDelete={handleDeleteUser}
                  canDelete={canDeleteUsers}
                  onUnblock={handleUnblockUser}
                  canUnblock={currentUser?.role === "super_admin"}
                />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeTab === "departments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept, i) => {
            const deptUsers = teamUsers.filter((u) => u.department === dept)

            const avgCompletion = Math.round(
              (deptUsers.reduce(
                (acc, u) =>
                  acc +
                  (u.tasksTotal > 0 ? u.tasksCompleted / u.tasksTotal : 0),
                0,
              ) /
                (deptUsers.length || 1)) *
                100,
            )

            return (
              <motion.div
                key={dept}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  >
                    {dept}
                  </h3>
                  <span
                    className="badge"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#818cf8",
                    }}
                  >
                    {deptUsers.length} members
                  </span>
                </div>
                <div className="flex -space-x-2 mb-4">
                  {deptUsers.slice(0, 4).map((u) => (
                    <div
                      key={u.id}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColors[u.role]} flex items-center justify-center text-xs font-bold text-white border-2`}
                      style={{ borderColor: "#13141a" }}
                    >
                      {u.avatar}
                    </div>
                  ))}
                  {deptUsers.length > 4 && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "2px solid #13141a",
                        color: "#6b7280",
                      }}
                    >
                      +{deptUsers.length - 4}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      Avg completion
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {avgCompletion}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${avgCompletion}%`,
                        background: "#6366f1",
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="card overflow-hidden">
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-sm font-semibold text-white">
              Role Permissions Matrix
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              Configure what each role can access
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <th
                    className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest"
                    style={{
                      color: "#4b5563",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    Permission
                  </th>
                  {([
                    "super_admin",
                    "admin",
                    "team_leader",
                    "project_manager",
                    "member",
                  ] as Role[]).map((role) => (
                    <th
                      key={role}
                      className="px-4 py-3 text-xs font-semibold text-center uppercase tracking-widest"
                      style={{
                        color: roleTextColors[role],
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {role.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "Create Tasks",
                    perms: [true, true, true, true, true],
                  },

                  {
                    label: "Delete Tasks",
                    perms: [true, true, false, false, false],
                  },

                  {
                    label: "Assign Tasks",
                    perms: [true, true, true, true, false],
                  },

                  {
                    label: "Approve Tasks",
                    perms: [true, true, true, false, false],
                  },

                  {
                    label: "View All Tasks",
                    perms: [true, true, true, true, false],
                  },

                  {
                    label: "Create Projects",
                    perms: [true, true, false, true, false],
                  },

                  {
                    label: "Delete Projects",
                    perms: [true, true, false, false, false],
                  },

                  {
                    label: "View Reports",
                    perms: [true, true, true, true, false],
                  },

                  {
                    label: "Export Data",
                    perms: [true, true, false, true, false],
                  },

                  {
                    label: "Manage Users",
                    perms: [true, true, false, false, false],
                  },

                  {
                    label: "Manage Settings",
                    perms: [true, false, false, false, false],
                  },

                  {
                    label: "View Audit Logs",
                    perms: [true, true, false, false, false],
                  },
                ].map((row) => (
                  <tr
                    key={row.label}
                    className="border-b table-row"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <td
                      className="px-6 py-3 text-sm"
                      style={{ color: "#94a3b8" }}
                    >
                      {row.label}
                    </td>
                    {row.perms.map((allowed, j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        <div
                          className={`w-4 h-4 rounded mx-auto flex items-center justify-center ${
                            allowed ? "bg-green-500/20" : "bg-gray-800"
                          }`}
                        >
                          {allowed ? (
                            <span className="text-green-400 text-xs">✓</span>
                          ) : (
                            <span
                              style={{ color: "#374151" }}
                              className="text-xs"
                            >
                              –
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "blocked" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teamUsers.filter(u => u.isBlocked).length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm" style={{ color: "#6b7280" }}>
              No blocked accounts found.
            </div>
          ) : (
            teamUsers
              .filter((user) => user.isBlocked)
              .map((user, i) => (
                <motion.div key={user.id} transition={{ delay: i * 0.04 }}>
                  <MemberCard
                    user={user}
                    onDelete={handleDeleteUser}
                    canDelete={canDeleteUsers}
                    onUnblock={handleUnblockUser}
                    canUnblock={currentUser?.role === "super_admin"}
                  />
                </motion.div>
              ))
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-2xl p-6 shadow-2xl border"
              style={{
                background: "#13141a",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Invite Team Member
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={inviteForm.name}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex@company.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Role
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          role: e.target.value as Role,
                        })
                      }
                    >
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {inviteForm.role !== "client" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Department
                      </label>
                      <select
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        value={inviteForm.department}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            department: e.target.value,
                          })
                        }
                      >
                        {realDepartments.length > 0 ? (
                          realDepartments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))
                        ) : (
                          <option value="">No departments available</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="btn btn-primary text-xs px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isInviting ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}

        {/* Add Immediately Modal */}
        {showAddImmediateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddImmediateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">
                  Add Member Immediately
                </h3>
                <button
                  onClick={() => setShowAddImmediateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddImmediateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. John Doe"
                    value={immediateForm.name}
                    onChange={(e) =>
                      setImmediateForm({
                        ...immediateForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="john@example.com"
                    value={immediateForm.email}
                    onChange={(e) =>
                      setImmediateForm({
                        ...immediateForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Set a password for the user"
                    value={immediateForm.password}
                    onChange={(e) =>
                      setImmediateForm({
                        ...immediateForm,
                        password: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Role
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={immediateForm.role}
                      onChange={(e) =>
                        setImmediateForm({
                          ...immediateForm,
                          role: e.target.value as Role,
                        })
                      }
                    >
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {immediateForm.role !== "client" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Department
                      </label>
                      <select
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        value={immediateForm.department}
                        onChange={(e) =>
                          setImmediateForm({
                            ...immediateForm,
                            department: e.target.value,
                          })
                        }
                      >
                        {realDepartments.length > 0 ? (
                          realDepartments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))
                        ) : (
                          <option value="">No departments available</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddImmediateModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-secondary text-xs px-4 py-2 rounded-lg"
                  >
                    Add User Immediately
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Member"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
