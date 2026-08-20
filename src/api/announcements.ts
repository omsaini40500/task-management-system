import { api } from "../api/client"

export interface AnnouncementFromApi {
  id: string

  title: string

  type: string

  priority: string

  author: string

  date: string

  content: string

  pinned: boolean

  createdAt?: string
}

export async function fetchAnnouncements(): Promise<AnnouncementFromApi[]> {
  return api.get<AnnouncementFromApi[]>("/announcements")
}

export async function createAnnouncement(data: Partial<AnnouncementFromApi>) {
  return api.post<AnnouncementFromApi>("/announcements", data)
}

export async function updateAnnouncement(
  id: string,
  data: Partial<AnnouncementFromApi>,
) {
  return api.patch<AnnouncementFromApi>(`/announcements/${id}`, data)
}

export async function deleteAnnouncement(id: string) {
  return api.delete(`/announcements/${id}`)
}
