import { useState, useEffect } from "react"

import { useLocation, useNavigate } from "react-router-dom"

import { motion, AnimatePresence } from "framer-motion"

import {
  Search,
  Bell,
  Plus,
  Command,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  X,
  Menu,
} from "lucide-react"

import { useAuth } from "../../context/AuthContext"

import { useTheme } from "../../context/ThemeContext"

import { fetchTasks } from "../../api/tasks"

import type { Task } from "../../types"

const pageTitle: Record<string, string> = {
  "/dashboard": "Dashboard",

  "/tasks": "Tasks",

  "/projects": "Projects",

  "/calendar": "Calendar",

  "/team": "Team",

  "/reports": "Reports",

  "/activity": "Activity Log",

  "/notifications": "Notifications",

  "/settings": "Settings",

  "/campaigns": "Campaigns",

  "/approvals": "Approvals",

  "/ai": "AI Assistant",
}

export default function Header({
  sidebarWidth,

  isMobile,

  setMobileMenuOpen,
}: {
  sidebarWidth: number

  isMobile?: boolean

  setMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { user, logout } = useAuth()

  const { theme, toggleTheme } = useTheme()

  const location = useLocation()

  const navigate = useNavigate()

  const [showSearch, setShowSearch] = useState(false)

  const [searchQ, setSearchQ] = useState("")

  const [showUserMenu, setShowUserMenu] = useState(false)

  const [showCmd, setShowCmd] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.style.filter = "invert(1) hue-rotate(180deg)"

      document.documentElement.style.background = "white"
    } else {
      document.documentElement.style.filter = ""

      document.documentElement.style.background = ""
    }
  }, [theme])

  const title = pageTitle[location.pathname] || "flash"

  const isClient = user?.role === "client"

  const searchResults =
    searchQ.length > 1
      ? tasks
          .filter((t) => t.title.toLowerCase().includes(searchQ.toLowerCase()))
          .slice(0, 5)
      : []

  return (
    <>
      <header
        className="fixed top-0 right-0 z-30 flex items-center gap-3 px-6"
        style={{
          left: isMobile ? 0 : sidebarWidth,

          height: 60,

          background: "rgba(10, 11, 15, 0.85)",

          backdropFilter: "blur(20px)",

          borderBottom: "1px solid rgba(255,255,255,0.06)",

          transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen?.((prev) => !prev)}
            className="w-9 h-9 rounded-lg flex flex-shrink-0 items-center justify-center transition-smooth"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#6b7280",
            }}
          >
            <Menu size={16} className="text-white" />
          </button>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-base font-semibold truncate"
            style={{ fontFamily: "DM Sans, sans-serif", color: "#f1f5f9" }}
          >
            {title}
          </h1>
        </div>

        {/* Search */}
        {!isClient && (
          <div className="relative">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-smooth"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6b7280",
                minWidth: 180,
              }}
            >
              <Search size={13} />
              <span className="text-xs flex-1 text-left hidden sm:block">
                Search tasks…
              </span>
              <span
                className="hidden sm:flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#4b5563",
                }}
              >
                <Command size={10} />K
              </span>
            </button>
          </div>
        )}

        {/* Actions */}
        

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-smooth"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#6b7280",
          }}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Notifications bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-smooth"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#6b7280",
          }}
        >
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg transition-smooth"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.avatar}
            </div>
            <span className="text-xs font-medium text-white hidden sm:block">
              {user?.name?.split(" ")[0]}
            </span>
            <ChevronDown size={11} style={{ color: "#6b7280" }} />
          </button>
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl overflow-hidden"
                style={{
                  background: "#1a1b23",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <div className="text-sm font-semibold text-white">
                    {user?.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                    {user?.email}
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      logout()
                      navigate("/login")
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-smooth text-left"
                    style={{ color: "#ef4444" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239,68,68,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Search modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cmd-overlay"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: "#13141a",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <Search size={16} style={{ color: "#6b7280" }} />
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-sm outline-none text-white placeholder-gray-600"
                  placeholder="Search tasks, projects, people…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
                <button onClick={() => setShowSearch(false)}>
                  <X size={14} style={{ color: "#6b7280" }} />
                </button>
              </div>
              {searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        navigate("/tasks")
                        setShowSearch(false)
                        setSearchQ("")
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-smooth"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-white">{t.title}</div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "#6b7280" }}
                        >
                          {t.project} · {t.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQ.length > 1 ? (
                <div
                  className="py-8 text-center text-sm"
                  style={{ color: "#6b7280" }}
                >
                  No results for "{searchQ}"
                </div>
              ) : (
                <div className="p-4">
                  <div
                    className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{
                      color: "#374151",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    Recent
                  </div>
                  {tasks.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        navigate("/tasks")
                        setShowSearch(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-smooth"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-sm text-white">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}
              <div
                className="px-4 py-2 border-t flex items-center gap-4 text-xs"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  color: "#374151",
                }}
              >
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    ↑↓
                  </kbd>{" "}
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    ↵
                  </kbd>{" "}
                  open
                </span>
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    esc
                  </kbd>{" "}
                  close
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

