import { useState, useRef, useEffect } from "react"

type Message = { role: "user" | "ai" content: string ts: string }

const suggestions: string[] = []

const aiResponses: Record<string, string> = {
  default:
    "I'm your AI assistant for AgencyOS. I can help you analyze campaigns, generate tasks, summarize meetings, create reports, and provide productivity insights. What would you like to do?",

  performance:
    "📊 **Campaign Performance Summary (Last 7 days)**\n\n• Summer Brand Refresh: 84K clicks, 3,200 conversions, 3.2x ROI ↑\n• Loyalty Reactivation: 42K clicks, 1,840 conversions, 4.1x ROI ↑\n• Healthcare SEO: 12K clicks, 420 conversions, 1.4x ROI (underperforming)\n\n**Recommendation:** Reallocate 15% of Healthcare SEO budget to Loyalty Reactivation — it has the highest conversion rate.",

  tasks:
    "✅ **Generated Tasks for Lumis Finance Kickoff**\n\n1. Prepare brand audit document — Marcus W. (Due: Aug 8)\n2. Set up project workspace in AgencyOS — Leila A. (Due: Aug 7)\n3. Schedule kickoff call with client — Ben T. (Due: Aug 6)\n4. Share campaign brief template — Marcus W. (Due: Aug 9)\n5. Assign creative lead for the project — Sarah L. (Due: Aug 7)\n\nShall I add these to the project board?",

  agenda:
    "📋 **Meeting Agenda: Q3 Strategy Sync**\n\n**Duration:** 60 minutes | **Date:** Aug 6, 2026\n\n1. Q2 Performance Review (10 min)\n2. Q3 Campaign Goals & KPIs (15 min)\n3. Budget Allocation Discussion (10 min)\n4. Campaign Owner Assignments (10 min)\n5. Workflow & Tool Updates (10 min)\n6. AOB & Next Steps (5 min)\n\nShall I create this meeting in the calendar?",

  roi: "📈 **ROI Analysis — Active Campaigns**\n\nAverage ROI: **3.1x** (up from 2.6x last quarter)\n\n| Campaign | ROI | Trend |\n|---|---|---|\n| Loyalty Reactivation | 4.1x | ↑ |\n| Summer Brand Refresh | 3.2x | → |\n| Healthcare SEO | 1.4x | ↓ |\n\n**Top insight:** Loyalty-based campaigns consistently outperform acquisition campaigns by 2.3x.",
}

function getAiReply(msg: string): string {
  const m = msg.toLowerCase()

  if (m.includes("performance") || m.includes("campaign"))
    return aiResponses.performance

  if (m.includes("task") || m.includes("lumis")) return aiResponses.tasks

  if (m.includes("agenda") || m.includes("meeting")) return aiResponses.agenda

  if (m.includes("roi") || m.includes("trend")) return aiResponses.roi

  return "I've analyzed your request. Based on current data, I recommend focusing on your highest-ROI campaigns (Loyalty Reactivation at 4.1x) while reviewing underperforming ones. Would you like a detailed breakdown or specific action plan?"
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: aiResponses.default, ts: "10:00 AM" },
  ])

  const [input, setInput] = useState("")

  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function send(text?: string) {
    const msg = (text || input).trim()

    if (!msg) return

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

    setMessages((prev) => [...prev, { role: "user", content: msg, ts: now }])

    setInput("")

    setLoading(true)

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: getAiReply(msg),
          ts: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ])

      setLoading(false)
    }, 1200)
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          AI Assistant
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Your intelligent marketing operations co-pilot
        </p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div
          className="flex-1 flex flex-col rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                  style={{
                    backgroundColor:
                      m.role === "ai"
                        ? "rgba(99,102,241,0.2)"
                        : "rgba(139,92,246,0.2)",
                  }}
                >
                  {m.role === "ai" ? "🤖" : "👤"}
                </div>
                <div
                  className={`max-w-lg ${
                    m.role === "user" ? "items-end" : "items-start"
                  } flex flex-col gap-1`}
                >
                  <div
                    className="rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line"
                    style={{
                      backgroundColor:
                        m.role === "ai" ? "#252d4a" : "rgba(99,102,241,0.2)",
                      color: m.role === "ai" ? "#e2e8f0" : "#e2e8f0",
                    }}
                  >
                    {m.content}
                  </div>
                  <span className="text-xs" style={{ color: "#64748b" }}>
                    {m.ts}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(99,102,241,0.2)" }}
                >
                  🤖
                </div>
                <div
                  className="rounded-xl px-4 py-3 flex gap-1 items-center"
                  style={{ backgroundColor: "#252d4a" }}
                >
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "#6366f1",
                        animationDelay: `${d * 150}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t" style={{ borderColor: "#252d4a" }}>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything about your campaigns, tasks, or team..."
                className="flex-1 rounded-lg px-4 py-2.5 text-sm border"
                style={{
                  backgroundColor: "#0d1117",
                  borderColor: "#252d4a",
                  color: "#e2e8f0",
                }}
              />
              <button
                onClick={() => send()}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#6366f1" }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="w-60 space-y-4">
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <p
              className="text-xs font-medium mb-3"
              style={{ color: "#64748b" }}
            >
              QUICK PROMPTS
            </p>
            {suggestions.length === 0 ? (
              <div className="text-sm text-center" style={{ color: "#94a3b8" }}>
                Quick prompts are unavailable while AI backend integration is
                pending.
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ backgroundColor: "#252d4a", color: "#94a3b8" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(99,102,241,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#252d4a")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <p
              className="text-xs font-medium mb-3"
              style={{ color: "#64748b" }}
            >
              CAPABILITIES
            </p>
            {[
              "AI Chat",
              "Task Generator",
              "Meeting Summary",
              "Report Generator",
              "Productivity Tips",
              "Smart Search",
            ].map((c) => (
              <div key={c} className="flex items-center gap-2 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#6366f1" }}
                />
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  {c}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
