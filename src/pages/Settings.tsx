import { useState, useEffect, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building, Users, Shield, Bell, Save, Upload, Trash2, X
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { api } from "../api/client"
import ConfirmModal from "../components/common/ConfirmModal"

const settingsTabs = [
  { id: "profile", label: "My Profile", icon: Building },
  { id: "company", label: "Company Profile", icon: Users },
  { id: "departments", label: "Departments", icon: Shield },
]

interface Department {
  id: string
  name: string
  memberCount?: number
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile")
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const isSuperAdmin = user?.role === "super_admin"

  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [itemToDelete, setItemToDelete] = useState<Department | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    api.get<Department[]>("/departments")
      .then((data) => {
        if (!cancelled) {
          setDepartments(data)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('Failed to load departments', e)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const persist = (next: Department[]) => {
    setDepartments(next)
  }

  const openAddModal = () => {
    setInputValue("")
    setModal("add")
  }

  const openEditModal = (dept: Department) => {
    setEditDept(dept)
    setInputValue(dept.name)
    setModal("edit")
  }

  const closeModal = () => {
    setModal(null)
    setEditDept(null)
    setInputValue("")
  }

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert("New passwords do not match!")
      return
    }
    if (passwordForm.new.length < 8) {
      alert("Password must be at least 8 characters")
      return
    }
    try {
      setIsChangingPassword(true)
      await api.post("/auth/change-password", {
        current_password: passwordForm.current,
        new_password: passwordForm.new
      })
      alert("Password changed successfully!")
      setPasswordForm({ current: "", new: "", confirm: "" })
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAddSubmit = async () => {
    const name = inputValue.trim()
    if (!name) return

    try {
      const saved = await api.post<Department>("/departments", { name })
      persist([...departments, saved])
    } catch (e) {
      console.error('Failed to add department', e)
    }
    closeModal()
  }

  const handleEditSubmit = async () => {
    if (!editDept) return
    const name = inputValue.trim()
    if (!name || name === editDept.name) {
      closeModal()
      return
    }

    try {
      const saved = await api.patch<Department>(`/departments/${editDept.id}`, { name })
      persist(departments.map((d) => (d.id === editDept.id ? saved : d)))
    } catch (e) {
      console.error('Failed to update department', e)
    }
    closeModal()
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await api.delete(`/departments/${itemToDelete.id}`)
      persist(departments.filter((d) => d.id !== itemToDelete.id))
    } catch (e) {
      console.error('Failed to delete department', e)
    }
    setItemToDelete(null)
  }

  const handleAvatarChange = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) alert("Avatar selected: " + file.name)
    }
    input.click()
  }

  const handleLogoChange = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) alert("Logo selected: " + file.name)
    }
    input.click()
  }

  const handleSave = (section: string) => {
    alert(`${section} saved successfully`)
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Settings</h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Manage workspace configuration</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0 space-y-0.5">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth text-left ${activeTab === tab.id ? "nav-active" : "nav-item"}`}
              style={{ color: activeTab === tab.id ? "#818cf8" : "#6b7280" }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-5">
              <h3 className="text-base font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>My Profile</h3>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl font-bold text-white">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <button type="button" onClick={handleAvatarChange} className="btn btn-secondary text-xs gap-1.5"><Upload size={12} /> Change Avatar</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: user?.name || "" },
                  { label: "Email", value: user?.email || "" },
                  { label: "Role", value: user?.role ? user.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "" },
                  { label: "Status", value: user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : "" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>{field.label}</label>
                    <input className="input" defaultValue={field.value} />
                  </div>
                ))}
              </div>
                <button type="button" onClick={() => handleSave("Profile")} className="btn btn-primary gap-1.5"><Save size={13} /> Save Profile</button>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-5 mt-6">
              <h3 className="text-base font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Current Password</label>
                  <input type="password" placeholder="••••••••" className="input" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
                </div>
                <div className="hidden md:block"></div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>New Password</label>
                  <input type="password" placeholder="••••••••" className="input" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Repeat New Password</label>
                  <input type="password" placeholder="••••••••" className="input" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                className="btn btn-primary gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? "Changing..." : "Update Password"}
              </button>
            </motion.div>
          )}

          {activeTab === "company" && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-5">
              <h3 className="text-base font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Company Profile</h3>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl font-bold text-white">F</div>
                <button type="button" onClick={handleLogoChange} className="btn btn-secondary text-xs gap-1.5"><Upload size={12} /> Change Logo</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Company Name", value: "Flash Communications" },
                  { label: "Industry", value: "Performance Marketing" },
                  { label: "Website", value: "flashagency.com" },
                  { label: "HQ Location", value: "Delhi, India" },
                  { label: "Team Size", value: "50-200" },
                  { label: "Timezone", value: "UTC-5 (EST)" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>{field.label}</label>
                    <input className="input" defaultValue={field.value} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => handleSave("Company Profile")} className="btn btn-primary gap-1.5"><Save size={13} /> Save Changes</button>
            </motion.div>
          )}

          {activeTab === "departments" && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Departments</h3>
                {isSuperAdmin && (
                  <button type="button" onClick={openAddModal} className="btn btn-primary text-xs">+ Add Department</button>
                )}
              </div>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-xs" style={{ color: "#6b7280" }}>Loading departments...</div>
                ) : departments.length === 0 ? (
                  <div className="text-xs" style={{ color: "#6b7280" }}>No departments found. Add one to get started.</div>
                ) : (
                  departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 rounded-xl transition-smooth" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}>
                      <span className="text-sm text-white">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#6b7280" }}>{dept.memberCount ?? 0} members</span>
                        {isSuperAdmin ? (
                          <>
                            <button type="button" onClick={() => openEditModal(dept)} className="btn btn-ghost text-xs py-1">Edit</button>
                            <button type="button" onClick={() => setItemToDelete(dept)} className="btn btn-ghost text-xs py-1" style={{ color: "#ef4444" }}>Delete</button>
                          </>
                        ) : (
                          <span className="text-xs" style={{ color: "#4b5563" }}>Read-only</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Add/Edit Department Modal */}
      <AnimatePresence>
        {modal === "add" || modal === "edit" ? (
          <ModalOverlay onClose={closeModal}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  {modal === "add" ? "Add Department" : "Edit Department"}
                </h3>
                <button type="button" onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center transition-smooth" style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
                  <X size={14} />
                </button>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Department Name</label>
                <input
                  autoFocus
                  className="input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter department name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") modal === "add" ? handleAddSubmit() : handleEditSubmit()
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary text-xs">Cancel</button>
                <button type="button" onClick={modal === "add" ? handleAddSubmit : handleEditSubmit} className="btn btn-primary text-xs">
                  {modal === "add" ? "Add Department" : "Save Changes"}
                </button>
              </div>
            </div>
          </ModalOverlay>
        ) : null}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal isOpen={!!itemToDelete} title="Delete Department" message="Are you sure you want to delete this item? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} />
    </div>
  )
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#13141a", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
