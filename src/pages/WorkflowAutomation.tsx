import { useState, useEffect } from "react"

import {
  fetchAutomations,
  createAutomation,
  deleteAutomation,
  fetchAutomationTemplates,
  fetchAutomationHistory,
} from "../api/automations"

interface Automation {
  id: string

  name: string

  trigger: string

  condition: string

  action: string

  status: string

  runs: number

  lastRun?: string
}

interface Template {
  id: string

  name: string

  description: string

  icon: string

  trigger: string

  action: string

  uses: number
}

interface HistoryItem {
  id: string

  automationId?: string

  automationName: string

  result: string

  time: string

  detail: string
}

const tabs = ["Automations", "Builder", "Templates", "History"]

export default function WorkflowAutomation() {
  const [tab, setTab] = useState("Automations")

  const [automations, setAutomations] = useState<Automation[]>([])

  const [templates, setTemplates] = useState<Template[]>([])

  const [history, setHistory] = useState<HistoryItem[]>([])

  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)

  const [trigger, setTrigger] = useState("Client Added")

  const [condition, setCondition] = useState("")

  const [action, setAction] = useState("Send Email")

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      try {
        const [autoData, tplData, histData] = await Promise.all([
          fetchAutomations(),

          fetchAutomationTemplates(),

          fetchAutomationHistory(),
        ])

        setAutomations(autoData)

        setTemplates(tplData)

        setHistory(histData)
      } catch (e) {
        console.error("Failed to load automation data", e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCreate = async () => {
    try {
      const saved = await createAutomation({
        name: `New Automation ${automations.length + 1}`,

        trigger,

        condition,

        action,

        status: "Active",
      })

      setAutomations([...automations, saved])

      setCreating(false)

      setCondition("")
    } catch (e) {
      console.error("Failed to create automation", e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAutomation(id)

      setAutomations(automations.filter((a) => a.id !== id))
    } catch (e) {
      console.error("Failed to delete automation", e)
    }
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Workflow Automation
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Automate repetitive tasks with smart triggers and actions
          </p>
        </div>
        <button
          onClick={() => {
            setTab("Builder")
            setCreating(true)
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#6366f1" }}
        >
          + Create Automation
        </button>
      </div>

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

      {tab === "Automations" && (
        <div className="space-y-3 flex-1 overflow-auto">
          {loading ? (
            <div
              className="text-center py-8 text-sm"
              style={{ color: "#64748b" }}
            >
              Loading automations...
            </div>
          ) : automations.length === 0 ? (
            <div
              className="rounded-xl p-8 border text-center"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <p className="text-sm font-medium text-white">
                No automations available
              </p>
              <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                Create your first automation to get started.
              </p>
            </div>
          ) : (
            automations.map((a) => (
              <div
                key={a.id}
                className="rounded-xl p-4 border flex items-center gap-4"
                style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      a.status === "Active" ? "#10b981" : "#64748b",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{a.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(99,102,241,0.15)",
                        color: "#6366f1",
                      }}
                    >
                      ⚡ {a.trigger}
                    </span>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      →
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(139,92,246,0.15)",
                        color: "#8b5cf6",
                      }}
                    >
                      ❓ {a.condition}
                    </span>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      →
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(16,185,129,0.15)",
                        color: "#10b981",
                      }}
                    >
                      ▶ {a.action}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-white">
                    {a.runs} runs
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color: "#64748b",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {a.lastRun || "Never"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "Builder" && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-medium text-white mb-4">
              Build your automation flow:
            </p>
            {[
              {
                label: "⚡ Trigger",
                desc: "When this happens...",
                value: trigger,
                setValue: setTrigger,
                options: [
                  "Client Added",
                  "Campaign Started",
                  "Date Reached",
                  "Budget Threshold",
                  "Approval Pending",
                  "Schedule",
                ],
              },

              {
                label: "❓ Condition",
                desc: "Only if...",
                value: condition,
                setValue: setCondition,
                options: [
                  "Status = Active",
                  "Spent > 85%",
                  "Pending > 48h",
                  "3 days before deadline",
                  "Always",
                ],
              },

              {
                label: "▶ Action",
                desc: "Then do this...",
                value: action,
                setValue: setAction,
                options: [
                  "Send Email",
                  "Create Task",
                  "Notify Team",
                  "Generate Report",
                  "Create Project",
                  "Send Webhook",
                ],
              },
            ].map((step, i) => (
              <div key={i}>
                {i > 0 && (
                  <div className="flex items-center gap-2 py-2 pl-6">
                    <div
                      className="w-0.5 h-6"
                      style={{ backgroundColor: "#252d4a" }}
                    />
                  </div>
                )}
                <div
                  className="rounded-xl p-5 border"
                  style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
                >
                  <p className="text-sm font-semibold text-white mb-1">
                    {step.label}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                    {step.desc}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {step.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => step.setValue(opt)}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors"
                        style={{
                          backgroundColor:
                            step.value === opt
                              ? "rgba(99,102,241,0.2)"
                              : "#252d4a",
                          color: step.value === opt ? "#6366f1" : "#94a3b8",
                          border:
                            step.value === opt
                              ? "1px solid #6366f1"
                              : "1px solid transparent",
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-4 flex gap-3">
              <button
                onClick={handleCreate}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#6366f1" }}
              >
                Save Automation
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#252d4a", color: "#94a3b8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "Templates" && (
        <div className="grid grid-cols-3 gap-4 flex-1 overflow-auto content-start">
          {loading ? (
            <div
              className="col-span-3 text-center py-8 text-sm"
              style={{ color: "#64748b" }}
            >
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div
              className="col-span-3 rounded-xl p-8 border text-center"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <p className="text-sm font-medium text-white">
                No workflow templates available
              </p>
              <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                Template library will appear when automation templates are
                connected to a backend.
              </p>
            </div>
          ) : (
            templates.map((t) => (
              <div
                key={t.name}
                className="rounded-xl p-5 border cursor-pointer transition-colors hover:border-indigo-500/50"
                style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <p className="font-semibold text-white text-sm mb-1">
                  {t.name}
                </p>
                <p className="text-xs mb-4" style={{ color: "#64748b" }}>
                  {t.description}
                </p>
                <button
                  className="w-full py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(99,102,241,0.15)",
                    color: "#6366f1",
                  }}
                >
                  Use Template
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "History" && (
        <div
          className="rounded-xl border overflow-hidden flex-1"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          {loading ? (
            <div
              className="p-8 text-center text-sm"
              style={{ color: "#64748b" }}
            >
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "#64748b" }}>
              <p className="text-sm font-medium text-white">
                No automation history available
              </p>
              <p className="text-xs mt-2">
                Historical events will be shown once workflow execution is
                tracked.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #252d4a" }}>
                  {["Automation", "Result", "Time", "Detail"].map((h) => (
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
                {history.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #252d4a" }}>
                    <td className="px-4 py-3 font-medium text-white">
                      {h.automationName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            h.result === "Success"
                              ? "rgba(16,185,129,0.15)"
                              : "rgba(239,68,68,0.15)",
                          color: h.result === "Success" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {h.result}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{
                        color: "#64748b",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {h.time}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "#94a3b8" }}
                    >
                      {h.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
