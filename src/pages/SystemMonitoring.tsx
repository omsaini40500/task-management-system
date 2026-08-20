import { useState, useEffect, useCallback, useRef } from "react"

import { motion, AnimatePresence } from "framer-motion"

import { Activity, AlertTriangle, Clock, RefreshCw } from "lucide-react"

import {
  fetchServices,
  fetchErrorLogs,
  fetchCronJobs,
  type ServiceHealthFromApi,
  type ErrorLogFromApi,
  type CronJobFromApi,
} from "../api/monitoring"

type ServiceHealth = ServiceHealthFromApi

type ErrorLog = ErrorLogFromApi

type CronJob = CronJobFromApi

function useMonitoringData<T>(
  fetchFn: () => Promise<T[]>,
  defaultValue: T[],
): [T[], boolean, () => Promise<void>] {
  const [data, setData] = useState<T[]>(defaultValue)

  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const defaultValueRef = useRef(defaultValue)

  defaultValueRef.current = defaultValue

  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      const result = await fetchFn()

      setData(result)
    } catch (e) {
      console.error("Failed to load monitoring data", e)

      setData(defaultValueRef.current)
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  const refresh = useCallback(async () => {
    setRefreshing(true)

    try {
      const result = await fetchFn()

      setData(result)
    } catch (e) {
      console.error("Failed to refresh monitoring data", e)
    } finally {
      setRefreshing(false)

      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    loadData()
  }, [loadData])

  return [data, refreshing, refresh]
}

function Gauge({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
    >
      <p className="text-xs mb-3" style={{ color: "#64748b" }}>
        {label}
      </p>
      <div className="flex items-end gap-2 mb-2">
        <p
          className="text-3xl font-bold"
          style={{ color, fontFamily: "DM Sans, sans-serif" }}
        >
          {value}%
        </p>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "#252d4a" }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function useAnimatedValue(target: number, interval = 3000) {
  const [value, setValue] = useState(target)

  useEffect(() => {
    const id = setInterval(
      () =>
        setValue(
          Math.max(10, Math.min(99, target + (Math.random() - 0.5) * 10)),
        ),
      interval,
    )

    return () => clearInterval(id)
  }, [target, interval])

  return Math.round(value)
}

export default function SystemMonitoring() {
  const cpu = useAnimatedValue(34)

  const ram = useAnimatedValue(61)

  const storage = useAnimatedValue(48)

  const [tab, setTab] = useState("Overview")

  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)

  const [services, , refreshServices] = useMonitoringData<ServiceHealth>(
    fetchServices,
    [],
  )

  const [errorLogs, , refreshErrors] = useMonitoringData<ErrorLog>(
    fetchErrorLogs,
    [],
  )

  const [cronJobs, , refreshCron] = useMonitoringData<CronJob>(
    fetchCronJobs,
    [],
  )

  const handleRefreshAll = async () => {
    await Promise.all([refreshServices(), refreshErrors(), refreshCron()])
  }

  const healthyServices = services.filter((s) => s.status === "Healthy").length

  const degradedServices = services.filter(
    (s) => s.status === "Degraded",
  ).length

  const downServices = services.filter((s) => s.status === "Down").length

  const totalServices = services.length

  const errorCount = errorLogs.filter((l) => l.level === "ERROR").length

  const warnCount = errorLogs.filter((l) => l.level === "WARN").length

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            System Monitoring
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Real-time infrastructure health for super admins
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-all"
          style={{ backgroundColor: "#6366f1" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#4f46e5")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#6366f1")
          }
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: "#252d4a" }}>
        {["Overview", "Error Logs", "Cron Jobs"].map((t) => (
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

      {tab === "Overview" && (
        <div className="flex-1 overflow-auto space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Gauge label="CPU Usage" value={cpu} color="#6366f1" />
            <Gauge label="RAM Usage" value={ram} color="#8b5cf6" />
            <Gauge label="Storage" value={storage} color="#10b981" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Total Services
              </p>
              <p
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {totalServices}
              </p>
            </div>
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Healthy
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "#10b981", fontFamily: "DM Sans, sans-serif" }}
              >
                {healthyServices}
              </p>
            </div>
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Degraded
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "#f59e0b", fontFamily: "DM Sans, sans-serif" }}
              >
                {degradedServices}
              </p>
            </div>
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Down
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "#ef4444", fontFamily: "DM Sans, sans-serif" }}
              >
                {downServices}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "#252d4a" }}
            >
              <p className="font-medium text-white text-sm">Service Health</p>
              <span className="text-xs" style={{ color: "#64748b" }}>
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #252d4a" }}>
                  {["Service", "Status", "Latency", "Uptime"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium"
                      style={{ color: "#64748b" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center"
                      style={{ color: "#64748b" }}
                    >
                      No service health data available.
                    </td>
                  </tr>
                ) : (
                  services.map((s) => (
                    <tr
                      key={s.name}
                      style={{ borderBottom: "1px solid #252d4a" }}
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {s.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                s.status === "Healthy"
                                  ? "#10b981"
                                  : s.status === "Degraded"
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          />
                          <span
                            style={{
                              color:
                                s.status === "Healthy"
                                  ? "#10b981"
                                  : s.status === "Degraded"
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          >
                            {s.status}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{
                          color: "#94a3b8",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {s.latency}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                        {s.uptime}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Error Logs" && (
        <div
          className="flex-1 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <div
            className="p-3 border-b flex items-center justify-between"
            style={{ borderColor: "#252d4a", backgroundColor: "#161b2e" }}
          >
            <div className="flex items-center gap-4">
              <span
                className="text-xs"
                style={{
                  color: "#64748b",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                $ tail -f /var/log/agencyos/app.log
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                  }}
                >
                  {errorCount} errors
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "rgba(245,158,11,0.15)",
                    color: "#f59e0b",
                  }}
                >
                  {warnCount} warnings
                </span>
              </div>
            </div>
            <button
              onClick={refreshErrors}
              className="text-xs flex items-center gap-1"
              style={{ color: "#6366f1" }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <div
            className="overflow-auto"
            style={{ maxHeight: "calc(100vh - 380px)" }}
          >
            {errorLogs.length === 0 ? (
              <div className="text-center py-10" style={{ color: "#64748b" }}>
                No error logs available.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #252d4a" }}>
                    {["Time", "Level", "Service", "Message"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-medium"
                        style={{ color: "#64748b" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map((log) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: "1px solid #252d4a" }}
                      className="cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td
                        className="px-4 py-3 text-xs"
                        style={{
                          color: "#64748b",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {log.time}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor:
                              log.level === "ERROR"
                                ? "rgba(239,68,68,0.15)"
                                : log.level === "WARN"
                                  ? "rgba(245,158,11,0.15)"
                                  : "rgba(99,102,241,0.15)",
                            color:
                              log.level === "ERROR"
                                ? "#ef4444"
                                : log.level === "WARN"
                                  ? "#f59e0b"
                                  : "#6366f1",
                          }}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{
                          color: "#6366f1",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {log.service}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "#94a3b8" }}
                      >
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "Cron Jobs" && (
        <div
          className="flex-1 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <div
            className="p-3 border-b flex items-center justify-between"
            style={{ borderColor: "#252d4a", backgroundColor: "#161b2e" }}
          >
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "#64748b" }} />
              <span className="text-xs" style={{ color: "#64748b" }}>
                Scheduled Jobs
              </span>
            </div>
            <button
              onClick={refreshCron}
              className="text-xs flex items-center gap-1"
              style={{ color: "#6366f1" }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <div
            className="overflow-auto"
            style={{ maxHeight: "calc(100vh - 380px)" }}
          >
            {cronJobs.length === 0 ? (
              <div className="text-center py-10" style={{ color: "#64748b" }}>
                No cron job history available.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #252d4a" }}>
                    {[
                      "Job",
                      "Schedule",
                      "Last Run",
                      "Next Run",
                      "Duration",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-medium"
                        style={{ color: "#64748b" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cronJobs.map((j) => (
                    <tr
                      key={j.id}
                      style={{ borderBottom: "1px solid #252d4a" }}
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {j.name}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{
                          color: "#6366f1",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {j.schedule}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{
                          color: "#64748b",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {j.lastRun}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{
                          color: "#94a3b8",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {j.nextRun}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "#94a3b8" }}
                      >
                        {j.duration}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor:
                              j.status === "Success"
                                ? "rgba(16,185,129,0.15)"
                                : j.status === "Failed"
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(245,158,11,0.15)",
                            color:
                              j.status === "Success"
                                ? "#10b981"
                                : j.status === "Failed"
                                  ? "#ef4444"
                                  : "#f59e0b",
                          }}
                        >
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Error Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setSelectedLog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: "#13141a",
                border: "1px solid rgba(255,255,255,0.1)",
                maxHeight: "90vh",
              }}
            >
              <div
                className="flex items-center justify-between p-6 border-b"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor:
                        selectedLog.level === "ERROR"
                          ? "rgba(239,68,68,0.12)"
                          : selectedLog.level === "WARN"
                            ? "rgba(245,158,11,0.12)"
                            : "rgba(99,102,241,0.12)",
                    }}
                  >
                    <AlertTriangle
                      size={20}
                      style={{
                        color:
                          selectedLog.level === "ERROR"
                            ? "#ef4444"
                            : selectedLog.level === "WARN"
                              ? "#f59e0b"
                              : "#6366f1",
                      }}
                    />
                  </div>
                  <div>
                    <h2
                      className="text-base font-bold text-white"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      Error Log Details
                    </h2>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {selectedLog.time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "#64748b",
                  }}
                >
                  <span className="text-lg">×</span>
                </button>
              </div>

              <div
                className="p-6 space-y-4 overflow-auto"
                style={{ maxHeight: "calc(90vh - 140px)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor:
                        selectedLog.level === "ERROR"
                          ? "rgba(239,68,68,0.15)"
                          : selectedLog.level === "WARN"
                            ? "rgba(245,158,11,0.15)"
                            : "rgba(99,102,241,0.15)",
                      color:
                        selectedLog.level === "ERROR"
                          ? "#ef4444"
                          : selectedLog.level === "WARN"
                            ? "#f59e0b"
                            : "#6366f1",
                    }}
                  >
                    {selectedLog.level}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "rgba(99,102,241,0.12)",
                      color: "#818cf8",
                    }}
                  >
                    {selectedLog.service}
                  </span>
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "#94a3b8" }}
                  >
                    Message
                  </label>
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: "#0d0f14",
                      borderColor: "#252d4a",
                    }}
                  >
                    <p className="text-sm text-white">{selectedLog.message}</p>
                  </div>
                </div>

                {selectedLog.stackTrace && (
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Stack Trace
                    </label>
                    <div
                      className="p-4 rounded-xl border overflow-auto"
                      style={{
                        backgroundColor: "#0d0f14",
                        borderColor: "#252d4a",
                        maxHeight: "200px",
                      }}
                    >
                      <pre
                        className="text-xs"
                        style={{
                          color: "#ef4444",
                          fontFamily: "JetBrains Mono, monospace",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedLog.stackTrace}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="p-6 border-t flex items-center justify-end"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  backgroundColor: "#0d0f14",
                }}
              >
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "#94a3b8",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
