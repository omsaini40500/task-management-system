export type Role = "super_admin" | "admin" | "team_leader" | "project_manager" | "member" | "client"

export type Priority = "critical" | "high" | "medium" | "low"

export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled" | "blocked"

export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled"

export interface User {
  id: string

  name: string

  email: string

  avatar: string

  role: Role

  department: string

  team: string

  status: "active" | "inactive"

  joinedAt: string

  lastActive: string

  tasksCompleted: number

  tasksTotal: number
}

export interface Task {
  id: string

  title: string

  description: string

  priority: Priority

  status: TaskStatus

  progress: number

  estimatedHours: number

  spentHours: number

  startDate: string

  dueDate: string

  assignedTo: string[]

  assignedBy: string

  project: string

  department: string

  category: string

  tags: string[]

  checklist: { id: string text: string done: boolean }[]

  comments: number

  attachments: number

  watchers: string[]
}

export interface Project {
  id: string

  name: string

  description: string

  status: ProjectStatus

  progress: number

  startDate: string

  endDate: string

  budget: number

  spent: number

  manager: string

  team: string[]

  tasks: number

  completedTasks: number

  client: string

  category: string

  color: string
}

export interface Notification {
  id: string

  type: "task_assigned" | "comment_mention" | "deadline" | "approval" | "announcement" | "system"

  title: string

  message: string

  time: string

  read: boolean

  user?: string

  link?: string
}

export interface ActivityLog {
  id: string

  user: string

  userId: string

  action: string

  target: string

  module: string

  oldValue?: string

  newValue?: string

  ip: string

  browser: string

  location: string

  timestamp: string
}
