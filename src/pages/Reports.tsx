import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Download, TrendingUp, Users, CheckSquare, Clock } from "lucide-react"
import { api } from "../api/client"
import { getDepartments, resolveDeptName } from "../api/org"

interface ReportUser {
  id: string
  name: string
  email: string
  departmentId?: string
  tasksCompleted: number
  tasksTotal: number
  avatar: string
}

interface ReportSummary {
  avgProductivity: number
  tasksCompleted: number
  avgHoursPerTask: number
  teamUtilization: number
  avgProductivityChange: number
  tasksCompletedChange: number
  avgHoursPerTaskChange: number
  teamUtilizationChange: number
  revenueTrend: Array<{ month: string; revenue: number; target: number }>
  teamRadar: Array<{ subject: string; a: number; b: number }>
  users: ReportUser[]
  taskTrends: Array<{ label: string; created: number; completed: number }>
}

const reportTypes = [
  "Employee Productivity",
  "Team Performance",
  "Task Completion",
  "Late Tasks",
  "Campaign Performance",
  "Custom Report",
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-2xl" style={{ background: "#1a1b23", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-xs text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState("Employee Productivity")
  const [period, setPeriod] = useState("monthly")
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSummary = async (selectedPeriod: string) => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<ReportSummary>(`/reports/summary?period=${selectedPeriod}`)
      setSummary(data)
    } catch (err: any) {
      const message = err?.detail || err?.message || "Unable to load report data"
      setError(message)
      console.error("Reports fetch error", err)
    } finally {
      setLoading(false)
    }
  }

  const retrySummary = () => {
    void fetchSummary(period)
  }

  useEffect(() => {
    getDepartments().catch(() => undefined)
    void fetchSummary(period)
  }, [period])

  const hasSummary = Boolean(summary)
  const revenueData = summary?.revenueTrend ?? []
  const radarData = summary?.teamRadar.map((item) => ({ subject: item.subject, A: item.a, B: item.b })) ?? []
  const users = summary?.users ?? []
  const weeklyTasksData = summary?.taskTrends ?? []

  const downloadCsv = () => {
    if (!summary) {
      setError("No report data available to export")
      return
    }

    const rows = [
      ["Metric", "Value"],
      ["Avg Productivity", `${summary.avgProductivity}%`],
      ["Tasks Completed", `${summary.tasksCompleted}`],
      ["Avg Hours/Task", `${summary.avgHoursPerTask}h`],
      ["Team Utilization", `${summary.teamUtilization}%`],
      [],
      ["User", "Email", "Department", "Completed Tasks", "Total Tasks"],
      ...summary.users.map((user) => [
        user.name,
        user.email,
        resolveDeptName(user.departmentId),
        `${user.tasksCompleted}`,
        `${user.tasksTotal}`,
      ]),
    ]

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "report-summary.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = (format: "pdf" | "excel") => {
    if (format === "pdf") {
      window.print()
      return
    }
    downloadCsv()
  }

  const renderReportSection = () => {
    switch (activeReport) {
      case "Employee Productivity":
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card overflow-hidden mb-4"
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                Employee Productivity
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {[
                      "Employee",
                      "Department",
                      "Tasks Completed",
                      "Total Tasks",
                      "Completion Rate",
                      "Trend",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#4b5563", fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "#64748b" }}>
                        No productivity data available.
                      </td>
                    </tr>
                  ) : (
                    users.map((u, i) => {
                      const rate = u.tasksTotal ? Math.round((u.tasksCompleted / u.tasksTotal) * 100) : 0
                      return (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b table-row"
                          style={{ borderColor: "rgba(255,255,255,0.04)" }}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                {u.avatar}
                              </div>
                              <div>
                                <div className="text-sm text-white">{u.name}</div>
                                <div className="text-xs" style={{ color: "#6b7280" }}>
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm" style={{ color: "#94a3b8" }}>
                            {resolveDeptName(u.departmentId)}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold text-white">{u.tasksCompleted}</td>
                          <td className="px-6 py-3 text-sm" style={{ color: "#6b7280" }}>
                            {u.tasksTotal}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${rate}%`,
                                    background: rate > 85 ? "#22c55e" : rate > 70 ? "#6366f1" : "#f59e0b",
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium text-white">{rate}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-xs" style={{ color: rate > 85 ? "#22c55e" : "#f59e0b" }}>
                              {rate > 85 ? "↑ Above target" : "→ On track"}
                            </span>
                          </td>
                        </motion.tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      case "Team Performance":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  Team Skill Radar
                </h3>
              </div>
              {radarData.length === 0 ? (
                <div className="h-52 flex items-center justify-center" style={{ color: "#64748b" }}>
                  No radar data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <Radar name="Paid Media" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                    <Radar name="Brand Studio" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  Revenue vs Target
                </h3>
              </div>
              {revenueData.length === 0 ? (
                <div className="h-52 flex items-center justify-center" style={{ color: "#64748b" }}>
                  No revenue data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#r2)" dot={false} />
                    <Area type="monotone" dataKey="target" name="Target" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>
        )
      case "Task Completion":
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                Tasks Created vs Completed
              </h3>
            </div>
            {weeklyTasksData.length === 0 ? (
              <div className="h-44 flex items-center justify-center" style={{ color: "#64748b" }}>
                No task chart data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyTasksData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="created" name="Created" fill="rgba(99,102,241,0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        )
      case "Late Tasks":
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="text-sm text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
              No late task insights are available yet. Update task due dates in the backend to display late task summaries.
            </div>
          </motion.div>
        )
      case "Campaign Performance":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  Revenue vs Target
                </h3>
              </div>
              {revenueData.length === 0 ? (
                <div className="h-52 flex items-center justify-center" style={{ color: "#64748b" }}>
                  No revenue data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#r2)" dot={false} />
                    <Area type="monotone" dataKey="target" name="Target" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card p-5"
            >
              <div className="text-sm text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                Campaign performance is based on current project revenue and budget data.
              </div>
            </motion.div>
          </div>
        )
      case "Custom Report":
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="text-sm text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
              Select a report type or update the period filter to preview analytics. Export options will use the current summary data.
            </div>
          </motion.div>
        )
    }
  }

  const kpis = [
    {
      label: "Avg Productivity",
      value: hasSummary ? `${summary!.avgProductivity}%` : "—",
      change: hasSummary ? `${summary!.avgProductivityChange > 0 ? "+" : ""}${summary!.avgProductivityChange}%` : "",
      icon: TrendingUp,
      color: "#6366f1",
    },
    {
      label: "Tasks Completed",
      value: hasSummary ? summary!.tasksCompleted : "—",
      change: hasSummary ? `${summary!.tasksCompletedChange > 0 ? "+" : ""}${summary!.tasksCompletedChange}%` : "",
      icon: CheckSquare,
      color: "#22c55e",
    },
    {
      label: "Avg Hours/Task",
      value: hasSummary ? `${summary!.avgHoursPerTask}h` : "—",
      change: hasSummary ? `${summary!.avgHoursPerTaskChange > 0 ? "+" : ""}${summary!.avgHoursPerTaskChange}h` : "",
      icon: Clock,
      color: "#f59e0b",
    },
    {
      label: "Team Utilization",
      value: hasSummary ? `${summary!.teamUtilization}%` : "—",
      change: hasSummary ? `${summary!.teamUtilizationChange > 0 ? "+" : ""}${summary!.teamUtilizationChange}%` : "",
      icon: Users,
      color: "#8b5cf6",
    },
  ]

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Reports & Analytics
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Performance insights for your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input py-2 text-xs w-32" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <button type="button" className="btn btn-secondary text-xs gap-1.5" onClick={() => handleExport("pdf")}>
            <Download size={13} /> Export PDF
          </button>
          <button type="button" className="btn btn-secondary text-xs gap-1.5" onClick={() => handleExport("excel")}>
            <Download size={13} /> Export Excel
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-6">
        {reportTypes.map((r) => (
          <button
            key={r}
            onClick={() => setActiveReport(r)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth"
            style={{
              background: activeReport === r ? "#6366f1" : "rgba(255,255,255,0.04)",
              color: activeReport === r ? "white" : "#6b7280",
              border: "1px solid",
              borderColor: activeReport === r ? "#6366f1" : "rgba(255,255,255,0.07)",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {error ? (
        <div className="card p-4 mb-6 text-sm text-red-300 flex items-center justify-between" style={{ background: "rgba(220, 38, 38, 0.1)" }}>
          <span>{error}</span>
          <button type="button" onClick={retrySummary} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: '#6366f1' }}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                <kpi.icon size={13} style={{ color: kpi.color }} />
              </div>
              <span className="text-xs" style={{ color: "#6b7280" }}>
                {kpi.label}
              </span>
            </div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
              {kpi.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#22c55e" }}>
              {kpi.change}
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="card p-6 text-center text-sm text-slate-300" style={{ background: "rgba(255,255,255,0.03)" }}>
          Loading report data...
        </div>
      ) : (
        renderReportSection()
      )}
    </div>
  )
}
