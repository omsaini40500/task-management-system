import { api } from "../api/client"

import type { ActivityLog } from "../types"

export interface LogFromApi {
  id: string

  user?: string

  userId?: string

  action: string

  target?: string

  module: string

  oldValue?: string

  newValue?: string

  ip?: string

  browser?: string

  location?: string

  createdAt: string
}

export async function fetchLogs(): Promise<ActivityLog[]> {
  const logs = await api.get<LogFromApi[]>("/activity-logs")

  return logs.map((l) => ({
    id: l.id,

    user: l.user || "System",

    userId: l.userId || "",

    action: l.action,

    target: l.target || "",

    module: l.module,

    oldValue: l.oldValue,

    newValue: l.newValue,

    ip: l.ip || "",

    browser: l.browser || "",

    location: l.location || "",

    timestamp: l.createdAt,
  }))
}
