import { useState, useEffect } from "react"
import useNotificationSound from "../../hooks/useNotificationSound"

import { NavLink, useLocation } from "react-router-dom"

import { motion, AnimatePresence } from "framer-motion"

import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Users,
  BarChart3,
  Settings,
  Bell,
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap,
  Plus,
  Search,
  Target,
  Calendar,
  Star,
  Clock,
  Shield,
  Rocket,
  Briefcase,
  Workflow,
  CheckCircle,
  Video,
  Bot,
  Trash,
  ArrowDownUp,
  Monitor,
  Megaphone,
  CalendarDays,
  DollarSign,
  X,
} from "lucide-react"

import { useAuth } from "../../context/AuthContext"

import { api } from "../../api/client"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },

  { icon: CheckSquare, label: "Tasks", to: "/tasks" },

  { icon: FolderOpen, label: "Projects", to: "/projects" },

  { icon: Briefcase, label: "Clients", to: "/clients" },

  { icon: Rocket, label: "Campaigns", to: "/campaigns" },

  { icon: Workflow, label: "Workflows", to: "/workflows" },

  { icon: CheckCircle, label: "Approvals", to: "/approvals" },

  { icon: Calendar, label: "Calendar", to: "/calendar" },

  { icon: Video, label: "Meetings", to: "/meetings" },

  { icon: Users, label: "Team", to: "/team" },

  { icon: BarChart3, label: "Reports", to: "/reports" },

  { icon: Activity, label: "Activity", to: "/activity" },

  { icon: Bell, label: "Notifications", to: "/notifications" },

  { icon: Bot, label: "AI Assistant", to: "/ai" },

  { icon: Monitor, label: "System Monitoring", to: "/monitoring" },

  { icon: DollarSign, label: "Finance", to: "/finance" },

  { icon: Megaphone, label: "Announcements", to: "/announcements" },

  { icon: CalendarDays, label: "Leave Management", to: "/leave-management" },

  { icon: ArrowDownUp, label: "Import/Export", to: "/importexport" },

  { icon: Settings, label: "Settings", to: "/settings" },

  { icon: Trash, label: "Recycle Bin", to: "/recycle" },
]

const clientNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },

  { icon: Rocket, label: "Campaigns", to: "/campaigns" },

  { icon: CheckCircle, label: "Approvals", to: "/approvals" },

  { icon: Bell, label: "Notifications", to: "/notifications" },

  { icon: Bot, label: "AI Assistant", to: "/ai" },
]

const quickLinks = [
  { icon: Star, label: "Starred Tasks", count: 4 },

  { icon: Clock, label: "Recent", count: 12 },

  { icon: Target, label: "My Sprint", count: 7 },
]

const roleColors: Record<string, string> = {
  super_admin: "from-violet-500 to-indigo-500",

  admin: "from-blue-500 to-cyan-500",

  team_leader: "from-green-500 to-emerald-500",

  project_manager: "from-orange-500 to-amber-500",

  member: "from-slate-500 to-slate-400",

  client: "from-pink-500 to-rose-500",
}

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",

  admin: "Admin",

  team_leader: "Team Leader",

  project_manager: "Project Manager",

  member: "Member",

  client: "Client",
}

export default function Sidebar({
  isMobile,

  mobileMenuOpen,

  setMobileMenuOpen,
}: {
  isMobile?: boolean

  mobileMenuOpen?: boolean

  setMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [collapsed, setCollapsed] = useState(false)

  const [unreadCount, setUnreadCount] = useState(0)

  const { user } = useAuth()
  const { play: playSound } = useNotificationSound()
  const location = useLocation()

  const isClient = user?.role === "client"

  const isShalom = user?.department?.toLowerCase() === "shalom" || user?.department?.toLowerCase() === "shellom"

  const visibleNavItems = isClient ? clientNavItems : navItems.filter(item => {
    if (isShalom) {
      const hiddenForShalom = ["Campaigns", "Clients", "Finance", "Activity", "Projects", "Workflows", "Meetings"]
      if (hiddenForShalom.includes(item.label)) {
        return false
      }
    }

    if (item.label === "Finance") {
      return user?.role === "super_admin" || (user?.department && user.department.toLowerCase().includes("finance"))
    }
    return true
  })

  useEffect(() => {
    let cancelled = false

    const fetchCount = async () => {
      try {
        const data = await api.get<Array<{ read: boolean }>>("/notifications")

        if (!cancelled) {
          setUnreadCount(data.filter((n) => !n.read).length)
        }
      } catch {
        try {
          const stored = localStorage.getItem("flash_notifications")

          if (stored) {
            const parsed = JSON.parse(stored)

            setUnreadCount(
              parsed.filter((n: { read: boolean }) => !n.read).length,
            )
          }
        } catch {}
      }
    }

    fetchCount()

    const handler = () => {
      fetchCount()
    }

    window.addEventListener("notification-updated", handler)

    return () => {
      cancelled = true

      window.removeEventListener("notification-updated", handler)
    }
  }, [])

  return (
    <>
      {isMobile && mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileMenuOpen?.(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}
      <motion.aside
        animate={{
          width: isMobile ? 260 : collapsed ? 68 : 260,

          x: isMobile ? (mobileMenuOpen ? 0 : -260) : 0,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          background: "#0d0e14",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)", minHeight: 60 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Zap size={14} className="text-white" />
            </div>
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <div
                    className="font-semibold text-sm text-white leading-tight"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  >
                    Flash Communications
                  </div>
                  <div className="text-xs" style={{ color: "#4b5563" }}>
                    Task Management
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen?.(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick actions */}
        {(!collapsed || isMobile) && !isClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 pt-3 pb-1 flex gap-2"
          >
            <button
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-smooth"
              style={{ background: "#6366f1", color: "white" }}
            >
              <Plus size={12} /> New Task
            </button>
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-smooth"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#94a3b8",
              }}
            >
              <Search size={13} />
            </button>
          </motion.div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {visibleNavItems.map((item) => {
            if (
              !isClient &&
              user?.role !== "super_admin" &&
              item.to === "/monitoring"
            )
              return null

            const active = location.pathname === item.to

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  playSound()
                  if (isMobile) setMobileMenuOpen?.(false)
                }}
              >
                <motion.div
                  whileHover={{ x: isMobile || !collapsed ? 2 : 0 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-smooth ${
                    active ? "nav-active" : "nav-item"
                  }`}
                  style={{
                    color: active ? "#818cf8" : "#6b7280",
                    minHeight: 38,
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  <AnimatePresence>
                    {(!collapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </NavLink>
            )
          })}

          {/* Quick links section */}
          {(!collapsed || isMobile) && !isClient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-3 pb-1"
            >
              <div
                className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest"
                style={{
                  color: "#374151",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                Quick Links
              </div>
              {quickLinks.map((link) => (
                <div
                  key={link.label}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer nav-item"
                  style={{ color: "#4b5563" }}
                >
                  <link.icon size={14} />
                  <span className="text-xs flex-1">{link.label}</span>
                  <span className="text-xs" style={{ color: "#374151" }}>
                    {link.count}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </nav>

        {/* User */}
        <div
          className="border-t px-3 py-3"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className={`flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer nav-item ${
              !isMobile && collapsed ? "justify-center" : ""
            }`}
          >
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${roleColors[user?.role || "member"]} flex items-center justify-center text-xs font-bold text-white shadow-md`}
            >
              {user?.avatar || "U"}
            </div>
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-xs font-semibold truncate text-white">
                    {user?.name}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: "#4b5563" }}
                  >
                    {roleLabel[user?.role || "member"]}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {(!collapsed || isMobile) && user?.role === "super_admin" && (
              <Shield size={12} style={{ color: "#6366f1" }} />
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-smooth hover:scale-110"
            style={{
              background: "#1e2028",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#6b7280",
            }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}
      </motion.aside>
    </>
  )
}
