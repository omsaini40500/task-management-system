import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

import { api } from "../api/client"

interface User {
  id: string

  name: string

  email: string

  avatar: string

  role: string

  theme: "dark" | "light"

  departmentId?: string

  teamId?: string

  clientId?: string

  clientName?: string

  status: "active" | "inactive"

  joinedAt: string

  lastActive: string

  tasksCompleted: number

  tasksTotal: number
}

interface AuthContextType {
  user: User | null

  login: (email: string, password: string) => Promise<string | null>

  logout: () => void

  isAuthenticated: boolean

  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Attempt to fetch current user; if it fails (no cookie or expired),

    // apiClient will try silent refresh or throw an error.

    api

      .get<{
        id: string
        name: string
        email: string
        role: string
        theme: "dark" | "light"
        departmentId?: string
        teamId?: string
        clientId?: string
        clientName?: string
        status: "active" | "inactive"
        createdAt: string
        lastActive?: string
        lastActiveAt?: string
        avatar: string
      }>("/auth/me")

      .then((u) => {
        setUser({
          ...u,

          theme: u.theme || "dark",

          joinedAt: u.createdAt,

          lastActive: u.lastActiveAt || u.lastActive || "Just now",

          tasksCompleted: 0,

          tasksTotal: 0,
        })
      })

      .catch(() => {
        setUser(null)
      })

      .finally(() => setLoading(false))
  }, [])

  const login = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    try {
      const form = new URLSearchParams()

      form.append("username", email)

      form.append("password", password)

      const BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://backend-4f8z.onrender.com/api/v1"
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",

        body: form,

        credentials: "include",
      })

      if (!res.ok) return null

      const me = await api.get<{
        id: string
        name: string
        email: string
        role: string
        theme: "dark" | "light"
        departmentId?: string
        teamId?: string
        clientId?: string
        clientName?: string
        status: "active" | "inactive"
        createdAt: string
        lastActive?: string
        lastActiveAt?: string
        avatar: string
      }>("/auth/me")

      setUser({
        ...me,

        theme: me.theme || "dark",

        joinedAt: me.createdAt,

        lastActive: me.lastActiveAt || me.lastActive || "Just now",

        tasksCompleted: 0,

        tasksTotal: 0,
      })

      return me.role
    } catch {
      return null
    }
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore
    }

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error("useAuth must be used within AuthProvider")

  return ctx
}

export function hasPermission(role: string, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    super_admin: ["*"],

    admin: [
      "can_create_task",
      "can_edit_task",
      "can_delete_task",
      "can_assign_task",
      "can_change_priority",
      "can_approve_task",
      "can_view_all_tasks",
      "can_create_project",
      "can_delete_project",
      "can_manage_milestones",
      "can_view_reports",
      "can_export",
      "can_invite_users",
      "can_manage_teams",
      "can_manage_clients",
      "can_manage_logs",
    ],

    team_leader: [
      "can_create_task",
      "can_edit_task",
      "can_assign_task",
      "can_change_priority",
      "can_approve_task",
      "can_view_all_tasks",
      "can_view_reports",
    ],

    project_manager: [
      "can_create_task",
      "can_edit_task",
      "can_assign_task",
      "can_change_priority",
      "can_create_project",
      "can_manage_milestones",
      "can_view_reports",
      "can_export",
    ],

    member: ["can_create_task", "can_edit_task"],

    client: ["can_view_reports"],
  }

  const perms = rolePermissions[role] || []

  return perms.includes("*") || perms.includes(permission)
}
