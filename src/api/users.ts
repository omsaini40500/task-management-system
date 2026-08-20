import { api } from "../api/client"

import {
  getDepartments,
  getTeams,
  resolveDeptName,
  resolveTeamName,
} from "./org"

import type { User, Role } from "../types"

export interface UserFromApi {
  id: string

  name: string

  email: string

  role: Role

  departmentId?: string

  teamId?: string

  isActive: boolean

  createdAt: string

  lastActive?: string

  lastActiveAt?: string

  avatar: string

  status: "active" | "inactive"

  tasksCompleted: number

  tasksTotal: number
}

export async function fetchUsers(): Promise<User[]> {
  const [users, depts, teams] = await Promise.all([
    api.get<{ items: UserFromApi[] }>("/users").then((res) => res.items),

    getDepartments(),

    getTeams(),
  ])

  return users.map((u) => ({
    id: u.id,

    name: u.name,

    email: u.email,

    avatar: u.avatar,

    role: u.role,

    department: resolveDeptName(u.departmentId),

    team: resolveTeamName(u.teamId),

    status: u.status,

    joinedAt: u.createdAt,

    lastActive: u.lastActiveAt || u.lastActive || "Just now",

    tasksCompleted: u.tasksCompleted,

    tasksTotal: u.tasksTotal,
  }))
}

export async function createUser(data: Partial<UserFromApi>) {
  return api.post<UserFromApi>("/users", data)
}

export async function updateUser(id: string, data: Partial<UserFromApi>) {
  return api.patch<UserFromApi>(`/users/${id}`, data)
}

export async function deleteUser(id: string) {
  return api.delete(`/users/${id}`)
}
