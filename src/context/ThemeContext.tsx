import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react"

import { api } from "../api/client"

import { useAuth } from "./AuthContext"

interface ThemeContextType {
  theme: "dark" | "light"

  toggleTheme: () => void

  setTheme: (theme: "dark" | "light") => void

  loading: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [theme, setThemeState] = useState<"dark" | "light">("dark")

  const [loading, setLoading] = useState(true)

  const initialized = useRef(false)

  useEffect(() => {
    if (!user) {
      setThemeState("dark")

      setLoading(false)

      initialized.current = false

      return
    }

    if (initialized.current) return

    initialized.current = true

    const serverTheme = user.theme as "dark" | "light" || "dark"

    const stored = localStorage.getItem(
      `theme_${user.id}`,
    ) as "dark" | "light" | null

    const initialTheme = stored || serverTheme

    setThemeState(initialTheme)

    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    const root = document.documentElement

    if (theme === "light") {
      root.style.filter = "invert(1) hue-rotate(180deg)"

      root.style.background = "white"
    } else {
      root.style.filter = ""

      root.style.background = ""
    }

    if (user) {
      localStorage.setItem(`theme_${user.id}`, theme)
    }
  }, [theme, user?.id])

  const setTheme = async (newTheme: "dark" | "light") => {
    setThemeState(newTheme)

    if (user) {
      localStorage.setItem(`theme_${user.id}`, newTheme)

      try {
        await api.patch("/users/me/theme", { theme: newTheme })
      } catch {
        console.error("Failed to save theme to server")
      }
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
