import { useEffect, useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { sendDailyTaskSummaryEmail, type TaskDailySummary } from '../lib/emailService'

const EMAIL_LOGS_KEY = 'flash_daily_email_logs'

export function useDailyEmailScheduler() {
  const { user } = useAuth()
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const getTodayTasks = useCallback(async (): Promise<TaskDailySummary> => {
    try {
      const tasks = await api.get<any[]>('/tasks')
      const today = new Date().toISOString().split('T')[0]

      const totalTasks = tasks.length
      const completedTasks = tasks.filter((t: any) => t.status === 'done').length
      const pendingTasks = tasks.filter((t: any) => t.status === 'todo').length
      const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length
      const blockedTasks = tasks.filter((t: any) => t.status === 'blocked').length

      const todayTasks = tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignedTo: t.assignedTo || [],
        priority: t.priority,
        dueDate: t.dueDate,
      }))

      return {
        date: today,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        blockedTasks,
        tasks: todayTasks,
      }
    } catch {
      return {
        date: new Date().toISOString().split('T')[0],
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0,
        tasks: [],
      }
    }
  }, [])

  const sendDailyEmail = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const dayOfWeek = new Date().getDay()

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Skipping daily email: weekend')
      return false
    }

    const logs = getEmailLogs()
    if (logs.some((log) => log.date === today && log.sent)) {
      console.log('Daily email already sent today')
      return false
    }

    setSending(true)
    try {
      const summary = await getTodayTasks()
      const superAdminEmail = user?.email || 'admin@flashcommunications.com'

      const sent = await sendDailyTaskSummaryEmail(summary, superAdminEmail)

      if (sent) {
        setLastSent(today)
      }

      return sent
    } finally {
      setSending(false)
    }
  }, [getTodayTasks, user?.email])

  useEffect(() => {
    const scheduleEndOfDayEmail = () => {
      const now = new Date()
      const endOfDay = new Date()
      endOfDay.setHours(18, 0, 0, 0)

      let delay = endOfDay.getTime() - now.getTime()

      if (delay <= 0) {
        delay = 0
      }

      const timeoutId = setTimeout(async () => {
        const dayOfWeek = new Date().getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          await sendDailyEmail()
        }
        scheduleEndOfDayEmail()
      }, delay)

      return timeoutId
    }

    const timeoutId = scheduleEndOfDayEmail()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [sendDailyEmail])

  return {
    sendDailyEmail,
    sending,
    lastSent,
  }
}

function getEmailLogs(): Array<{ date: string; sent: boolean; timestamp: string }> {
  try {
    const stored = localStorage.getItem(EMAIL_LOGS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}
