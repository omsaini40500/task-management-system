import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"

import {
  X,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Filter,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"

import {
  fetchLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
} from "../api/leave"

import { getLeaveRequests } from "../api/hr"
import { formatDate } from "../utils/date"

import ConfirmModal from "../components/common/ConfirmModal"

interface LeaveRequest {
  id: string

  userId: string

  userName: string

  userRole: string

  type: "casual" | "sick" | "work_from_home"

  startDate: string

  endDate: string

  reason: string

  status: "pending" | "approved" | "rejected"

  approvedBy?: string

  approvedAt?: string

  createdAt: string
}

const leaveTypeConfig: Record<string, {
  label: string
  color: string
  bg: string
  icon: string
}> = {
  casual: {
    label: "Casual Leave",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
    icon: "🏖️",
  },

  sick: {
    label: "Sick Leave",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    icon: "🤒",
  },

  work_from_home: {
    label: "Work From Home",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: "🏠",
  },
}

export default function LeaveManagement() {
  const { user } = useAuth()

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  const [showForm, setShowForm] = useState(false)

  const [loading, setLoading] = useState(true)

  const [filterStatus, setFilterStatus] =
    useState<"all" | "pending" | "approved" | "rejected">("all")

  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    type: "casual" as LeaveRequest["type"],

    startDate: "",

    endDate: "",

    reason: "",
  })

  const isSuperAdmin = user?.role === "super_admin"

  const isAdmin = user?.role === "admin"

  const [isHR, setIsHR] = useState(false)

  const canManageLeaves = isSuperAdmin || isAdmin || isHR

  useEffect(() => {
    loadLeaveRequests()

    checkUserDepartment()
  }, [user])

  const checkUserDepartment = async () => {
    if (!user?.departmentId) return

    try {
      const { getDepartments } = await import("../api/org")

      const depts = await getDepartments()

      const userDept = depts.find((d: any) => d.id === user.departmentId)

      if (
        userDept &&
        (userDept.name.toLowerCase().includes("hr") ||
          userDept.name.toLowerCase().includes("human resource"))
      ) {
        setIsHR(true)
      }
    } catch (e) {
      console.error("Failed to load departments", e)
    }
  }

  const loadLeaveRequests = async () => {
    setLoading(true)

    try {
      const data = await fetchLeaves()

      const mapped: LeaveRequest[] = data.map((l) => ({
        id: l.id,

        userId: l.userId,

        userName: l.userName || "Unknown",

        userRole:
          l.userId === (user?.id || "")
            ? user?.role
              ? user.role
                  .replace("_", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              : "Member"
            : "Member",

        type: l.type as LeaveRequest["type"],

        startDate: l.startDate || "",

        endDate: l.endDate || "",

        reason: l.reason || "",

        status: l.status as LeaveRequest["status"],

        approvedBy: l.approvedBy || undefined,

        approvedAt: l.approvedAt || undefined,

        createdAt: l.createdAt || new Date().toISOString(),
      }))

      setLeaveRequests(mapped)
    } catch (e) {
      console.error("Failed to load leave requests", e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason.trim())
      return

    try {
      const saved = await createLeave({
        userId: user?.id || "current",

        userName: user?.name || "Current User",

        type: formData.type,

        startDate: formData.startDate,

        endDate: formData.endDate,

        reason: formData.reason,
      })

      const newRequest: LeaveRequest = {
        id: saved.id,

        userId: saved.userId || "current",

        userName: saved.userName || "Current User",

        userRole: user?.role
          ? user.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
          : "Member",

        type: formData.type,

        startDate: formData.startDate,

        endDate: formData.endDate,

        reason: formData.reason,

        status: "pending",

        createdAt: saved.createdAt || new Date().toISOString(),
      }

      setLeaveRequests([newRequest, ...leaveRequests])

      setFormData({ type: "casual", startDate: "", endDate: "", reason: "" })

      setShowForm(false)
    } catch (e) {
      console.error("Failed to create leave request", e)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await updateLeave(id, {
        status: "approved",
        approvedBy: user?.name,
        approvedAt: new Date().toISOString(),
      })

      setLeaveRequests(
        leaveRequests.map((req) =>
          req.id === id
            ? {
                ...req,
                status: "approved" as const,
                approvedBy: user?.name,
                approvedAt: new Date().toISOString(),
              }
            : req,
        ),
      )
    } catch (e) {
      console.error("Failed to approve leave", e)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await updateLeave(id, {
        status: "rejected",
        approvedBy: user?.name,
        approvedAt: new Date().toISOString(),
      })

      setLeaveRequests(
        leaveRequests.map((req) =>
          req.id === id
            ? {
                ...req,
                status: "rejected" as const,
                approvedBy: user?.name,
                approvedAt: new Date().toISOString(),
              }
            : req,
        ),
      )
    } catch (e) {
      console.error("Failed to reject leave", e)
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await deleteLeave(itemToDelete)

      setLeaveRequests(leaveRequests.filter((req) => req.id !== itemToDelete))

      setItemToDelete(null)
    } catch (e) {
      console.error("Failed to delete leave", e)
    }
  }

  const getDaysCount = (start: string, end: string) => {
    const startDate = new Date(start)

    const endDate = new Date(end)

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const userBaseRequests = canManageLeaves
    ? leaveRequests
    : leaveRequests.filter((req) => req.userId === (user?.id || "current"))

  const visibleRequests =
    filterStatus === "all"
      ? userBaseRequests
      : userBaseRequests.filter((req) => req.status === filterStatus)

  const pendingCount = userBaseRequests.filter(
    (req) => req.status === "pending",
  ).length

  const approvedCount = userBaseRequests.filter(
    (req) => req.status === "approved",
  ).length

  const rejectedCount = userBaseRequests.filter(
    (req) => req.status === "rejected",
  ).length

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Leave Management
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Apply for leave and manage team leave requests
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary text-xs gap-1.5"
        >
          <Plus size={12} />
          Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className="rounded-xl p-4 border"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>
            Total Requests
          </p>
          <p
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {userBaseRequests.length}
          </p>
        </div>
        <div
          className="rounded-xl p-4 border"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>
            Pending
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: "#f59e0b", fontFamily: "DM Sans, sans-serif" }}
          >
            {pendingCount}
          </p>
        </div>
        <div
          className="rounded-xl p-4 border"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>
            Approved
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: "#10b981", fontFamily: "DM Sans, sans-serif" }}
          >
            {approvedCount}
          </p>
        </div>
        <div
          className="rounded-xl p-4 border"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>
            Rejected
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: "#ef4444", fontFamily: "DM Sans, sans-serif" }}
          >
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} style={{ color: "#64748b" }} />
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor:
                filterStatus === status ? "#6366f1" : "rgba(255,255,255,0.05)",

              color: filterStatus === status ? "white" : "#64748b",

              border: `1px solid ${
                filterStatus === status ? "#6366f1" : "rgba(255,255,255,0.08)"
              }`,
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Leave Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-sm text-gray-400">
              Loading leave requests...
            </div>
          </div>
        ) : visibleRequests.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <Calendar
              size={40}
              style={{ color: "#334155" }}
              className="mx-auto mb-3"
            />
            <p className="font-medium text-white mb-1">No leave requests</p>
            <p className="text-sm" style={{ color: "#64748b" }}>
              You haven't applied for any leave yet
            </p>
          </div>
        ) : (
          visibleRequests.map((req) => {
            const typeConfig =
              leaveTypeConfig[req.type] || leaveTypeConfig.casual

            const daysCount = getDaysCount(req.startDate, req.endDate)

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-5 border transition-all hover:border-opacity-30"
                style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: typeConfig.bg }}
                    >
                      {typeConfig.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {req.userName}
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>
                        {req.userRole}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      color: typeConfig.color,
                      backgroundColor: typeConfig.bg,
                    }}
                  >
                    {typeConfig.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                      Start Date
                    </p>
                    <p
                      className="text-sm text-white"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {formatDate(req.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                      End Date
                    </p>
                    <p
                      className="text-sm text-white"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {formatDate(req.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                      Duration
                    </p>
                    <p className="text-sm text-white">
                      {daysCount} day{daysCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>
                    Reason
                  </p>
                  <p className="text-sm text-white">{req.reason}</p>
                </div>

                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: "#252d4a" }}
                >
                  <div className="flex items-center gap-2">
                    {req.status === "pending" && (
                      <span
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: "rgba(245,158,11,0.12)",
                          color: "#f59e0b",
                        }}
                      >
                        <Clock size={12} />
                        Pending Approval
                      </span>
                    )}
                    {req.status === "approved" && (
                      <span
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: "rgba(16,185,129,0.12)",
                          color: "#10b981",
                        }}
                      >
                        <CheckCircle2 size={12} />
                        Approved
                      </span>
                    )}
                    {req.status === "rejected" && (
                      <span
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.12)",
                          color: "#ef4444",
                        }}
                      >
                        <XCircle size={12} />
                        Rejected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageLeaves &&
                      req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: "rgba(16,185,129,0.15)",
                              color: "#10b981",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: "rgba(239,68,68,0.15)",
                              color: "#ef4444",
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    {req.userId === (user?.id || "current") &&
                      req.status === "pending" && (
                        <button
                          onClick={() => setItemToDelete(req.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: "#13141a",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="flex items-center justify-between p-6 border-b"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div>
                  <h2
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  >
                    Apply for Leave
                  </h2>
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                    Submit a new leave request
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "#64748b",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "#94a3b8" }}
                  >
                    Leave Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(leaveTypeConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            type: key as LeaveRequest["type"],
                          })
                        }
                        className="p-3 rounded-xl text-center transition-all border"
                        style={{
                          backgroundColor:
                            formData.type === key
                              ? config.bg
                              : "rgba(255,255,255,0.02)",

                          borderColor:
                            formData.type === key
                              ? config.color
                              : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div className="text-xl mb-1">{config.icon}</div>
                        <p className="text-xs font-medium text-white">
                          {config.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                      style={{ borderColor: "#252d4a" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                      style={{ borderColor: "#252d4a" }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "#94a3b8" }}
                  >
                    Reason
                  </label>
                  <textarea
                    className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                    style={{ borderColor: "#252d4a" }}
                    rows={3}
                    placeholder="Please provide a reason for your leave..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "#94a3b8",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors"
                    style={{ backgroundColor: "#6366f1" }}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Leave Request"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
