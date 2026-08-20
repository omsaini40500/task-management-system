import { api } from "../api/client"

import {
  getProjects,
  getDepartments,
  resolveProjectName,
  resolveDeptName,
} from "./org"

import type { Task, Priority, TaskStatus } from "../types"

export interface TaskFromApi {
  id: string

  title: string

  description?: string

  priority: Priority

  status: TaskStatus

  progress: number

  estimatedHours: number

  spentHours: number

  startDate?: string

  dueDate?: string

  assignedBy?: string

  projectId?: string

  departmentId?: string

  category?: string

  tags: string[]

  checklist: Array<{ id: string text: string done: boolean }>

  comments: number

  attachments: number

  watchers: string[]

  assignedTo: string[]
}

export async function fetchTasks(): Promise<Task[]> {
  const [tasks, projects, depts] = await Promise.all([
    api.get<{ items: TaskFromApi[] }>("/tasks").then((res) => res.items),

    getProjects(),

    getDepartments(),
  ])

  return tasks.map((t) => ({
    id: t.id,

    title: t.title,

    description: t.description || "",

    priority: t.priority,

    status: t.status,

    progress: t.progress,

    estimatedHours: t.estimatedHours,

    spentHours: t.spentHours,

    startDate: t.startDate || new Date().toISOString(),

    dueDate: t.dueDate || new Date().toISOString(),

    assignedTo: t.assignedTo,

    assignedBy: t.assignedBy || "",

    project: resolveProjectName(t.projectId),

    department: resolveDeptName(t.departmentId),

    category: t.category || "",

    tags: t.tags,

    checklist: t.checklist,

    comments: t.comments,

    attachments: t.attachments,

    watchers: t.watchers,
  }))
}

export async function createTask(data: Partial<TaskFromApi>) {
  return api.post<TaskFromApi>("/tasks", data)
}

export async function updateTask(id: string, data: Partial<TaskFromApi>) {
  return api.patch<TaskFromApi>(`/tasks/${id}`, data)
}

export async function deleteTask(id: string) {
  return api.delete(`/tasks/${id}`)
}

export async function assignTask(taskId: string, userId: string) {
  return api.post(`/tasks/${taskId}/assign?user_id=${userId}`)
}

export async function approveTask(taskId: string) {
  return api.post(`/tasks/${taskId}/approve`)
}

export async function bulkStatus(taskIds: string[], status: TaskStatus) {
  return api.post("/tasks/bulk-status", { task_ids: taskIds, status })
}
