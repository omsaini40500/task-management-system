import { api } from "../api/client"

import type { Notification } from "../types"

export interface NotificationFromApi {
  id: string

  user?: string

  type: string

  title: string

  message: string

  link?: string

  read: boolean

  createdAt: string
}

export async function fetchNotifications(): Promise<Notification[]> {
  const notifs = await api.get<NotificationFromApi[]>("/notifications")

  return notifs.map((n) => ({
    id: n.id,

    type: n.type as Notification["type"],

    title: n.title,

    message: n.message,

    time: n.createdAt, // frontend formats relative time client-side

    read: n.read,

    user: n.user,

    link: n.link,
  }))
}

export async function markRead(id: string) {
  return api.patch(`/notifications/${id}/read`)
}

export async function markAllRead() {
  return api.post("/notifications/read-all")
}

export async function deleteNotification(id: string) {
  return api.delete(`/notifications/${id}`)
}
