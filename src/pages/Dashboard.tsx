import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts"
import {
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, Zap,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, ChevronRight, Loader2, TrendingDown
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { api } from "../api/client"

// ── Types ────────────────────────────────────────────────────────────────────
interface Task {
  id: string; title: string; status: string; priority: string
  projectId?: string; dueDate?: string; progress: number; assignedTo: string[]
  startDate?: string
}
interface Project {
  id: string; name: string; status: string; progress: number
  color: string; tasks: number; completedTasks: number; budget: number; spent: number; category?: string
}

// ── Colours ───────────────────────────────────────────────────────────────────
const priorityColors: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e",
}

const CHANNEL_COLORS: Record<string, string> = {
  "Paid Media": "#6366f1",
  "Social Media": "#f59e0b",
  "Technology": "#10b981",
  "Business Development": "#8b5cf6",
  "Finance": "#ec4899",
  "HR & Operations": "#06b6d4",
  "Creative": "#f97316",
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getWeeklyTasksData(tasks: Task[]) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const counts: Record<string, { completed: number; created: number }> = {}
  DAYS.forEach(d => { counts[d] = { completed: 0, created: 0 } })

  tasks.forEach(task => {
    const start = task.startDate ? new Date(task.startDate) : null
    if (start && start >= startOfWeek) {
      const day = DAYS[start.getDay()]
      counts[day].created++
    }
    if (task.status === "done" && task.dueDate) {
      const due = new Date(task.dueDate)
      if (due >= startOfWeek) {
        const day = DAYS[due.getDay()]
        counts[day].completed++
      }
    }
  })

  return DAYS.map(day => ({ day, ...counts[day] }))
}

function getChannelData(projects: Project[]) {
  const map: Record<string, { name: string; value: number; color: string }> = {}
  projects.forEach(p => {
    const cat = p.category || "Other"
    if (!map[cat]) {
      map[cat] = {
        name: cat,
        value: 0,
        color: CHANNEL_COLORS[cat] || "#6b7280",
      }
    }
    map[cat].value += p.tasks || 0
  })
  return Object.values(map).filter(c => c.value > 0)
}

// ── Sub-components ────────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const dur = 1200, start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / dur, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(ease * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <span>{display}{suffix}</span>
}

function KpiCard({ icon: Icon, label, value, suffix = "", change, changeUp, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 relative overflow-hidden" style={{ background: "#13141a" }}
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }} transition={{ duration: 0.15 }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${changeUp ? "text-green-400" : "text-red-400"}`}>
          {changeUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{change}
        </div>
      </div>
      <div className="text-2xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-xs mt-1" style={{ color: "#6b7280" }}>{label}</div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-2xl" style={{ background: "#1a1b23", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-xs text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teamMemberCount, setTeamMemberCount] = useState(0)
  const [reports, setReports] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [expenseSummary, setExpenseSummary] = useState<{total_spent: number; count: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  const role = user?.role || "member"
  const canViewRevenue = role === "super_admin" || role === "admin"
  const canViewTeamPerf = role === "super_admin" || role === "admin" || role === "team_leader" || role === "project_manager"
  const isOnlyMember = role === "member" || role === "client"

  useEffect(() => {
    const load = async () => {
      try {
        const [allTasks, mine, allProjects, allUsers, summary, expensesData, expSummary] = await Promise.all([
          api.get<{items: Task[]}>("/tasks").then(r => Array.isArray(r?.items) ? r.items : []),
          api.get<{items: Task[]}>("/tasks/my").then(r => Array.isArray(r?.items) ? r.items : []),
          api.get<{items: Project[]}>("/projects").then(r => Array.isArray(r?.items) ? r.items : []),
          api.get<{items: any[]}>("/users").then(r => Array.isArray(r?.items) ? r.items : []),
          api.get<any>("/reports/summary").catch(() => null),
          api.get<any[]>("/expenses").catch(() => []),
          api.get<{total_spent: number; count: number}>("/expenses/summary").catch(() => null),
        ])
        setTasks(Array.isArray(allTasks) ? allTasks : [])
        setMyTasks(Array.isArray(mine) ? mine : [])
        setProjects(Array.isArray(allProjects) ? allProjects : [])
        setTeamMemberCount(Array.isArray(allUsers) ? allUsers.filter((u: any) => u.isActive).length : 0)
        if (summary) setReports(summary)
        setExpenses(Array.isArray(expensesData) ? expensesData : [])
      } catch (e) {
        console.error("Dashboard load error", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id, refreshCount])

  useEffect(() => {
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        setRefreshCount(c => c + 1)
      }
    }
    const usersUpdatedHandler = () => {
      setRefreshCount(c => c + 1)
    }
    window.addEventListener('visibilitychange', visibilityHandler)
    window.addEventListener('users-updated', usersUpdatedHandler)
    return () => {
      window.removeEventListener('visibilitychange', visibilityHandler)
      window.removeEventListener('users-updated', usersUpdatedHandler)
    }
  }, [])

  if (loading) {
    return (
      <div className="page flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-indigo-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const weeklyTasksData = getWeeklyTasksData(tasks)
  const channelData = getChannelData(projects)
  const revenueData = reports?.revenueTrend || []

  // Computed KPIs from real data
  const completedToday = tasks.filter(t => t.status === "done").length
  const inProgress = tasks.filter(t => t.status === "in_progress").length
  const overdue = tasks.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date()).length
  const pendingApproval = tasks.filter(t => t.status === "review").length
  const myCompleted = myTasks.filter(t => t.status === "done").length
  const myPending = myTasks.filter(t => t.status !== "done").length

  const productivity = reports?.avgProductivity ?? (tasks.length ? Math.round((completedToday / tasks.length) * 100) : 0)

  const teamPerfData = projects.map(p => ({
    name: p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
    productivity: p.tasks > 0 ? Math.round((p.completedTasks / p.tasks) * 100) : 0,
    completed: p.completedTasks,
    tasks: p.tasks,
  }))

  return (
    <div className="page">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Good morning, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {(!isOnlyMember ? [
          { icon: CheckCircle2, label: "Tasks Completed",  value: completedToday, change: "+20%", changeUp: true,  color: "#22c55e" },
          { icon: Clock,        label: "In Progress",      value: inProgress,     change: "+5%",  changeUp: true,  color: "#6366f1" },
          { icon: AlertTriangle,label: "Overdue",          value: overdue,        change: "-2",   changeUp: false, color: "#ef4444" },
          { icon: Zap,          label: "Pending Approval", value: pendingApproval,change: "+3",   changeUp: false, color: "#f59e0b" },
          { icon: TrendingUp,   label: "Productivity",     value: productivity, suffix: "%", change: reports?.avgProductivityChange ? `${reports.avgProductivityChange > 0 ? '+' : ''}${reports.avgProductivityChange}%` : "+4%", changeUp: true,  color: "#8b5cf6" },
          ...(canViewRevenue ? [{ icon: TrendingDown, label: "Total Expenses", value: expenseSummary?.total_spent ?? expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), prefix: "$", change: `${expenseSummary?.count ?? expenses.length} items`, changeUp: false, color: "#ef4444" }] : [{ icon: Users, label: "Active Members", value: teamMemberCount, change: "stable", changeUp: true, color: "#10b981" }]),
        ] : [
          { icon: CheckCircle2, label: "My Completed",     value: myCompleted,    change: "+2",   changeUp: true,  color: "#22c55e" },
          { icon: Clock,        label: "My Pending",       value: myPending,      change: "steady",changeUp: true, color: "#6366f1" },
          { icon: AlertTriangle,label: "My Overdue",       value: myTasks.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date()).length, change: "-1", changeUp: true, color: "#ef4444" },
        ]).map((kpi, i) => (
          <motion.div key={kpi.label} transition={{ delay: i * 0.06 }} className={isOnlyMember ? "col-span-2" : ""}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Spend Overview - Admins+ */}
      {role === "super_admin" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(() => {
            const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
            const totalSpent = projects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0)
            const remaining = totalBudget - totalSpent
            const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

            return [
              { label: "Total Budget", value: totalBudget, prefix: "$", color: "#6366f1" },
              { label: "Total Spent", value: totalSpent, prefix: "$", color: "#f59e0b" },
              { label: "Remaining", value: remaining, prefix: "$", color: "#10b981" },
              { label: "Utilization", value: utilization, suffix: "%", color: "#8b5cf6" },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                  style={{ background: `radial-gradient(circle, ${kpi.color} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
                <div className="text-xs mb-2" style={{ color: "#6b7280" }}>{kpi.label}</div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  {kpi.prefix}{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}{kpi.suffix || ""}
                </div>
                {kpi.label === "Utilization" && (
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, utilization)}%`, background: utilization > 90 ? "#ef4444" : kpi.color }} />
                  </div>
                )}
              </motion.div>
            ))
          })()}
        </div>
      )}

      {/* Budget vs Spent Chart - Admins+ */}
      {canViewRevenue && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Budget vs Spent</h3>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>By project</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projects.map(p => ({ name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name, budget: Number(p.budget) || 0, spent: Number(p.spent) || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="spent" name="Spent" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Charts row - Admins only */}
      {canViewRevenue && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Revenue Overview</h3>
                <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>vs. target last 6 months</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg transition-smooth" style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.07)" }}>Monthly</button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="target" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenue)" dot={false} />
                <Area type="monotone" dataKey="target" name="Target" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#target)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Channel Mix</h3>
              <MoreHorizontal size={14} style={{ color: "#6b7280" }} />
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                  {channelData.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {channelData.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-xs flex-1" style={{ color: "#94a3b8" }}>{c.name}</span>
                  <span className="text-xs font-medium text-white">{c.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Team Performance - Leaders+ */}
      {canViewTeamPerf && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Weekly Tasks</h3>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyTasksData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="created" name="Created" fill="rgba(99,102,241,0.25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Project Completion</h3>
              <button className="flex items-center gap-1 text-xs" style={{ color: "#6366f1" }}>View all <ChevronRight size={12} /></button>
            </div>
            <div className="space-y-3">
              {teamPerfData.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "#6b7280" }}>No project data available</p>
              ) : teamPerfData.map((team, i) => (
                <motion.div key={team.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center gap-4">
                  <div className="text-xs font-medium w-36 flex-shrink-0 truncate" style={{ color: "#94a3b8" }}>{team.name}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${team.productivity}%` }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: team.productivity > 85 ? "#22c55e" : team.productivity > 70 ? "#6366f1" : "#f59e0b" }}
                    />
                  </div>
                  <div className="text-xs font-semibold w-10 text-right text-white">{team.productivity}%</div>
                  <div className="text-xs w-16 text-right" style={{ color: "#6b7280" }}>{team.completed}/{team.tasks} tasks</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom row - For Everyone */}
      <div className={`grid grid-cols-1 ${!isOnlyMember ? "xl:grid-cols-2" : ""} gap-4`}>
        {/* My Tasks */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>My Tasks</h3>
            <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>{myTasks.length} total</span>
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 ? (
              <div className="text-center py-8" style={{ color: "#6b7280" }}>
                <CheckCircle2 size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No tasks assigned to you yet</p>
              </div>
            ) : myTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl table-row cursor-pointer">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityColors[task.priority] || "#94a3b8" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{task.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                    {task.status.replace("_", " ")} · {task.progress}% done
                  </div>
                </div>
                <span className={`badge status-${task.status.replace("_", "-")}`}>{task.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Projects */}
        {!isOnlyMember && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Active Projects</h3>
              <button className="flex items-center gap-1 text-xs" style={{ color: "#6366f1" }}>All projects <ChevronRight size={12} /></button>
            </div>
            <div className="space-y-3">
              {projects.filter(p => p.status === "active").map((proj, i) => (
                <motion.div key={proj.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 + i * 0.05 }} className="flex items-center gap-3 p-3 rounded-xl table-row cursor-pointer">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: proj.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white mb-1 truncate">{proj.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${proj.progress}%` }}
                          transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
                          className="h-full rounded-full" style={{ background: proj.color }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: "#6b7280" }}>{proj.progress}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white font-medium">{proj.completedTasks}/{proj.tasks}</div>
                    <div className="text-xs" style={{ color: "#6b7280" }}>tasks</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
