import { api } from "../api/client"

export interface TaskDailySummary {
  date: string

  totalTasks: number

  completedTasks: number

  pendingTasks: number

  inProgressTasks: number

  blockedTasks: number

  tasks: Array<{
    id: string

    title: string

    status: string

    assignedTo: string[]

    priority: string

    dueDate: string
  }>
}

export interface EmailPayload {
  to: string

  subject: string

  html: string

  text: string
}

const EMAIL_SENT_STORAGE_KEY = "flash_daily_email_logs"

export async function sendDailyTaskSummaryEmail(
  summary: TaskDailySummary,
  superAdminEmail: string,
): Promise<boolean> {
  const subject = `Daily Task Summary - ${summary.date}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0d0e14; color: #e2e8f0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #13141a; border-radius: 12px; padding: 24px; border: 1px solid rgba(255,255,255,0.06); }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .logo { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
        .title { font-size: 18px; font-weight: 600; color: white; }
        .date { font-size: 12px; color: #64748b; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat { background: #1c2340; border: 1px solid #252d4a; border-radius: 10px; padding: 12px; text-align: center; }
        .stat-value { font-size: 20px; font-weight: 700; color: white; }
        .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
        .section { margin-bottom: 16px; }
        .section-title { font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .task-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #1c2340; border: 1px solid #252d4a; border-radius: 8px; margin-bottom: 6px; }
        .task-status { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .task-info { flex: 1; }
        .task-title { font-size: 13px; color: white; font-weight: 500; }
        .task-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
        .footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 11px; color: #4b5563; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">F</div>
          <div>
            <div class="title">Daily Task Summary</div>
            <div class="date">${summary.date} • Flash Communications</div>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value" style="color: #6366f1">${summary.totalTasks}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #10b981">${summary.completedTasks}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #f59e0b">${summary.pendingTasks + summary.inProgressTasks}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #ef4444">${summary.blockedTasks}</div>
            <div class="stat-label">Blocked</div>
          </div>
        </div>

        ${
          summary.tasks.length > 0
            ? `
          <div class="section">
            <div class="section-title">Task Details</div>
            ${summary.tasks
              .map((task) => {
                const statusColor =
                  task.status === "done"
                    ? "#10b981"
                    : task.status === "in_progress"
                      ? "#6366f1"
                      : task.status === "blocked"
                        ? "#ef4444"
                        : "#f59e0b"

                return `
                <div class="task-item">
                  <div class="task-status" style="background: ${statusColor}"></div>
                  <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">${task.status.replace("_", " ")} • ${
                      task.assignedTo.length > 0 ? "Assigned" : "Unassigned"
                    }</div>
                  </div>
                </div>
              `
              })
              .join("")}
          </div>
        `
            : ""
        }

        <div class="footer">
          Flash Communications Task Management System<br>
          This is an automated daily summary email.
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Daily Task Summary - ${summary.date}

Total Tasks: ${summary.totalTasks}
Completed: ${summary.completedTasks}
Pending: ${summary.pendingTasks + summary.inProgressTasks}
Blocked: ${summary.blockedTasks}

Task Details:
${summary.tasks.map((task) => `- ${task.title} [${task.status.replace("_", " ")}]`).join("\n")}

---
Flash Communications Task Management System
This is an automated daily summary email.
  `.trim()

  const payload: EmailPayload = {
    to: superAdminEmail,

    subject,

    html,

    text,
  }

  try {
    await api.post<{ success: boolean message: string }>(
      "/emails/daily-summary",
      payload,
    )

    logEmailSent(summary.date, true, payload)

    return true
  } catch (error) {
    console.error("Failed to send daily email via API:", error)

    logEmailSent(summary.date, false, payload)

    return false
  }
}

export function getEmailLogs(): Array<{
  date: string
  sent: boolean
  timestamp: string
  payload?: { to: string subject: string }
}> {
  try {
    const stored = localStorage.getItem(EMAIL_SENT_STORAGE_KEY)

    if (stored) return JSON.parse(stored)
  } catch {}

  return []
}

function logEmailSent(date: string, sent: boolean, payload?: EmailPayload) {
  try {
    const logs = getEmailLogs()

    logs.push({
      date,

      sent,

      timestamp: new Date().toISOString(),

      payload: payload
        ? { to: payload.to, subject: payload.subject }
        : undefined,
    })

    localStorage.setItem(
      EMAIL_SENT_STORAGE_KEY,
      JSON.stringify(logs.slice(-30)),
    )
  } catch {}
}
