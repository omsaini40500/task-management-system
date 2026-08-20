import { useState, useEffect } from "react"

import { Outlet } from "react-router-dom"

import Sidebar from "./Sidebar"

import Header from "./Header"

import { motion } from "framer-motion"

export default function Layout() {
  const [sidebarWidth, setSidebarWidth] = useState(260)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const sidebar = document.querySelector("aside")

      if (sidebar && window.innerWidth >= 768)
        setSidebarWidth(sidebar.offsetWidth)
    })

    const sidebar = document.querySelector("aside")

    if (sidebar) observer.observe(sidebar)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: "#0a0b0f" }}>
      <Sidebar
        isMobile={isMobile}
        mobileMenuOpen={isMobileMenuOpen}
        setMobileMenuOpen={setIsMobileMenuOpen}
      />
      <Header
        sidebarWidth={isMobile ? 0 : sidebarWidth}
        isMobile={isMobile}
        setMobileMenuOpen={setIsMobileMenuOpen}
      />
      <motion.main
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,

          paddingTop: 60,

          minHeight: "100vh",

          transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
