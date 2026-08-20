import { useEffect, useState } from "react"

import { motion, AnimatePresence } from "framer-motion"

import {
  X,
  PauseCircle,
  PlayCircle,
  Trash2,
  Mail,
  Phone,
  Building2,
  FolderOpen,
  Megaphone,
  FileText,
  Activity,
} from "lucide-react"

import { api } from "../api/client"

import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  ClientFromApi,
} from "../api/clients"

import { fetchLogs } from "../api/logs"

import ConfirmModal from "../components/common/ConfirmModal"

type ClientRow = {
  id: string

  name: string

  industry?: string

  status: string

  contact: string

  email: string

  projects: number

  campaigns: number
}

type ProjectFromApi = {
  id: string

  name: string

  status: string

  progress: number

  budget: number

  spent: number

  managerId?: string

  clientId?: string

  category?: string

  color: string

  team: string[]

  tasks: number

  completedTasks: number
}

type CampaignFromApi = {
  id: number

  name: string

  client: string

  status: string

  start: string

  end: string

  team: string[]
}

type LogRow = {
  id: string

  user: string

  action: string

  target: string

  module: string

  timestamp: string
}

const tabs = [
  "Client List",
  "Contacts",
  "Projects",
  "Campaigns",
  "Contracts",
  "Activity",
]

export default function ClientManagement() {
  const [activeTab, setActiveTab] = useState("Client List")

  const [selected, setSelected] = useState<string | null>(null)

  const [clients, setClients] = useState<ClientRow[]>([])

  const [showModal, setShowModal] = useState(false)

  const [clientLoading, setClientLoading] = useState(false)

  const [clientError, setClientError] = useState<string | null>(null)

  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    contact: "",
    email: "",
    handledBy: "",
  })

  const [tabLoading, setTabLoading] = useState(false)

  const [tabData, setTabData] = useState<any[]>([])

  useEffect(() => {
    const loadClients = async () => {
      setClientLoading(true)

      setClientError(null)

      try {
        const clientsFromApi = await fetchClients()

        const normalized = clientsFromApi.map((client) => ({
          id: client.id,

          name: client.name,

          industry: client.industry ?? "",

          status: client.status
            ? client.status.charAt(0).toUpperCase() + client.status.slice(1)
            : "Active",

          contact: client.contactName ?? client.contactEmail ?? "",

          email: client.contactEmail ?? "",

          projects: 0,

          campaigns: 0,
        }))

        setClients(normalized)
      } catch (error: any) {
        setClientError("Unable to load clients from database")
      } finally {
        setClientLoading(false)
      }
    }

    void loadClients()
  }, [])

  useEffect(() => {
    if (!selected || activeTab === "Client List") {
      setTabData([])

      return
    }

    const loadTabData = async () => {
      setTabLoading(true)

      setTabData([])

      try {
        const sel = clients.find((c) => c.id === selected)

        if (!sel) return

        if (activeTab === "Projects") {
          const projects = await api
            .get<{ items: ProjectFromApi[] }>("/projects")
            .then((r) => r.items)

          const filtered = projects.filter((p) => p.clientId === selected)

          setTabData(filtered)
        } else if (activeTab === "Campaigns") {
          const campaigns = await api.get<CampaignFromApi[]>("/campaigns")

          const filtered = campaigns.filter((c) => c.client === sel.name)

          setTabData(filtered)
        } else if (activeTab === "Activity") {
          const logs = await fetchLogs()

          const filtered = logs.filter((l) => l.target === sel.name)

          setTabData(filtered as LogRow[])
        } else {
          setTabData([])
        }
      } catch {
        setTabData([])
      } finally {
        setTabLoading(false)
      }
    }

    void loadTabData()
  }, [selected, activeTab, clients])

  const selectedClient = clients.find((c) => c.id === selected)

  const handleDeleteClient = (id: string) => {
    const clientId = String(id || "").trim()

    if (!clientId) {
      alert("Unable to delete client: invalid client id")

      return
    }

    setItemToDelete(clientId)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await deleteClient(itemToDelete)

      setClients((prev) => prev.filter((c) => c.id !== itemToDelete))

      if (selected === itemToDelete) {
        setSelected(null)
      }
    } catch {
      alert(
        "Unable to delete client. It may have associated projects or campaigns.",
      )
    } finally {
      setItemToDelete(null)
    }
  }

  const toggleClientStatus = async (id: string) => {
    const client = clients.find((c) => c.id === id)

    if (!client) return

    const newStatus = client.status === "Active" ? "Paused" : "Active"

    try {
      await updateClient(id, { status: newStatus.toLowerCase() })

      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
      )
    } catch {
      alert("Unable to update client status")
    }
  }

  const handleCreateClient = async () => {
    try {
      const newClient = await createClient({
        name: formData.name || "Unnamed Client",

        industry: formData.industry || "General",

        contactName: formData.contact || "N/A",

        contactEmail: formData.email || "N/A",

        status: "active",
      })

      setClients((prev) => [
        {
          id: newClient.id,

          name: newClient.name,

          industry: newClient.industry ?? "",

          status:
            newClient.status.charAt(0).toUpperCase() +
            newClient.status.slice(1),

          contact: newClient.contactName ?? "",

          email: newClient.contactEmail ?? "",

          projects: 0,

          campaigns: 0,
        },
        ...prev,
      ])

      setSelected(newClient.id)

      setShowModal(false)

      setFormData({
        name: "",
        industry: "",
        contact: "",
        email: "",
        handledBy: "",
      })
    } catch {
      alert("Unable to create client")
    }
  }

  const renderTabContent = () => {
    if (!selected) {
      return (
        <div
          className="flex-1 rounded-xl border flex items-center justify-center"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">👈</div>
            <p className="font-medium text-white">Select a client</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Choose a client from the list to view details
            </p>
          </div>
        </div>
      )
    }

    if (tabLoading) {
      return (
        <div
          className="flex-1 rounded-xl border flex items-center justify-center"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">⏳</div>
            <p className="font-medium text-white">
              Loading {activeTab.toLowerCase()}...
            </p>
          </div>
        </div>
      )
    }

    if (activeTab === "Contacts") {
      return (
        <div
          className="flex-1 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <div className="p-6 space-y-4">
            <div
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{
                backgroundColor: "rgba(99,102,241,0.06)",
                borderColor: "#252d4a",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(99,102,241,0.15)" }}
              >
                <Building2 size={18} style={{ color: "#6366f1" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Contact Person
                </p>
                <p className="text-sm font-medium text-white">
                  {selectedClient?.contact || "N/A"}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{
                backgroundColor: "rgba(99,102,241,0.06)",
                borderColor: "#252d4a",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(99,102,241,0.15)" }}
              >
                <Mail size={18} style={{ color: "#6366f1" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Email
                </p>
                <p className="text-sm font-medium text-white">
                  {selectedClient?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === "Projects") {
      if (tabData.length === 0) {
        return (
          <div
            className="flex-1 rounded-xl border flex items-center justify-center"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">📁</div>
              <p className="font-medium text-white">No projects found</p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                This client has no projects assigned
              </p>
            </div>
          </div>
        )
      }

      return (
        <div
          className="flex-1 rounded-xl border overflow-auto"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #252d4a" }}>
                {["Project", "Status", "Progress", "Budget", "Tasks"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium"
                      style={{ color: "#64748b" }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {tabData.map((p: ProjectFromApi) => (
                <tr
                  key={p.id}
                  className="border-b"
                  style={{ borderColor: "#252d4a" }}
                >
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor:
                          p.status === "active"
                            ? "rgba(16,185,129,0.15)"
                            : p.status === "on_hold"
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(100,116,139,0.15)",

                        color:
                          p.status === "active"
                            ? "#10b981"
                            : p.status === "on_hold"
                              ? "#f59e0b"
                              : "#64748b",
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {p.progress}%
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    ${p.budget.toLocaleString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {p.completedTasks}/{p.tasks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (activeTab === "Campaigns") {
      if (tabData.length === 0) {
        return (
          <div
            className="flex-1 rounded-xl border flex items-center justify-center"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <p className="font-medium text-white">No campaigns found</p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                This client has no campaigns assigned
              </p>
            </div>
          </div>
        )
      }

      return (
        <div
          className="flex-1 rounded-xl border overflow-auto"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #252d4a" }}>
                {["Campaign", "Status", "Start", "End", "Team"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabData.map((c: CampaignFromApi) => (
                <tr
                  key={c.id}
                  className="border-b"
                  style={{ borderColor: "#252d4a" }}
                >
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor:
                          c.status === "Running"
                            ? "rgba(16,185,129,0.15)"
                            : c.status === "Paused"
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(100,116,139,0.15)",

                        color:
                          c.status === "Running"
                            ? "#10b981"
                            : c.status === "Paused"
                              ? "#f59e0b"
                              : "#64748b",
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {c.start}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {c.end}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {c.team.length} members
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (activeTab === "Contracts") {
      return (
        <div
          className="flex-1 rounded-xl border flex items-center justify-center"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="font-medium text-white">No contracts available</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Contract management is coming soon
            </p>
          </div>
        </div>
      )
    }

    if (activeTab === "Activity") {
      if (tabData.length === 0) {
        return (
          <div
            className="flex-1 rounded-xl border flex items-center justify-center"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-medium text-white">No activity found</p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                No activity logs for this client
              </p>
            </div>
          </div>
        )
      }

      return (
        <div
          className="flex-1 rounded-xl border overflow-auto"
          style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #252d4a" }}>
                {["User", "Action", "Target", "Module", "Time"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabData.map((log: LogRow) => (
                <tr
                  key={log.id}
                  className="border-b"
                  style={{ borderColor: "#252d4a" }}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {log.user}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {log.action}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {log.target}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {log.module}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                    {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    return null
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Client Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Manage your marketing clients and relationships
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
          style={{ backgroundColor: "#6366f1" }}
          onClick={() => setShowModal(true)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#4f46e5")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#6366f1")
          }
        >
          + Add Client
        </button>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: "#252d4a" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium transition-colors relative"
            style={{ color: activeTab === tab ? "#6366f1" : "#64748b" }}
          >
            {tab}
            {activeTab === tab && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ backgroundColor: "#6366f1" }}
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === "Client List" && (
        <div className="flex gap-4 flex-1 min-h-0">
          <div
            className="flex-1 rounded-xl overflow-hidden border"
            style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #252d4a" }}>
                  {[
                    "Client",
                    "Industry",
                    "Contact",
                    "Projects",
                    "Campaigns",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium"
                      style={{ color: "#64748b" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-gray-400"
                    >
                      Loading clients from database...
                    </td>
                  </tr>
                ) : clientError ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-red-400"
                    >
                      {clientError}
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-gray-400"
                    >
                      No client data available.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr
                      key={c.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button")) return

                        setSelected(c.id === selected ? null : c.id)
                      }}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor:
                          selected === c.id
                            ? "rgba(99,102,241,0.08)"
                            : "transparent",
                        borderBottom: "1px solid #252d4a",
                      }}
                      onMouseEnter={(e) => {
                        if (selected !== c.id)
                          e.currentTarget.style.backgroundColor =
                            "rgba(255,255,255,0.03)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          selected === c.id
                            ? "rgba(99,102,241,0.08)"
                            : "transparent"
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {c.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                        {c.industry}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                        {c.contact}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                        {c.projects}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#94a3b8" }}>
                        {c.campaigns}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor:
                              c.status === "Active"
                                ? "rgba(16,185,129,0.15)"
                                : c.status === "Paused"
                                  ? "rgba(245,158,11,0.15)"
                                  : "rgba(100,116,139,0.15)",
                            color:
                              c.status === "Active"
                                ? "#10b981"
                                : c.status === "Paused"
                                  ? "#f59e0b"
                                  : "#64748b",
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()

                            e.stopPropagation()

                            handleDeleteClient(c.id)
                          }}
                          className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {selectedClient && (
            <div
              className="w-72 rounded-xl p-5 border space-y-4"
              style={{ backgroundColor: "#1c2340", borderColor: "#252d4a" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  {selectedClient.name}
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  style={{ color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: "rgba(99,102,241,0.2)",
                    color: "#6366f1",
                  }}
                >
                  {selectedClient.name[0]}
                </div>

                {/* Pause / Reactivate Toggle Button */}
                <button
                  onClick={() => toggleClientStatus(selectedClient.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor:
                      selectedClient.status === "Active"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(16, 185, 129, 0.15)",

                    color:
                      selectedClient.status === "Active"
                        ? "#ef4444"
                        : "#10b981",
                  }}
                >
                  {selectedClient.status === "Active" ? (
                    <>
                      <PauseCircle size={13} />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayCircle size={13} />
                      Activate
                    </>
                  )}
                </button>
              </div>

              {/* Client Details */}
              <div className="space-y-3">
                {[
                  ["Industry", selectedClient.industry],

                  ["Contact", selectedClient.contact],

                  ["Email", selectedClient.email],

                  ["Projects", selectedClient.projects],

                  ["Campaigns", selectedClient.campaigns],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>
                      {k}
                    </p>
                    <p className="text-sm text-white">{v}</p>
                  </div>
                ))}
              </div>

              {/* Delete Client Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()

                  handleDeleteClient(selectedClient.id)
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <Trash2 size={14} /> Delete Client
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab !== "Client List" && renderTabContent()}

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-2xl shadow-2xl p-6"
              style={{
                background: "#13141a",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Add New Client</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Client Name
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Industry
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Contact Person
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Handled By
                  </label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="Manager Name"
                    value={formData.handledBy}
                    onChange={(e) =>
                      setFormData({ ...formData, handledBy: e.target.value })
                    }
                  />
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 transition-colors hover:bg-indigo-600"
                  style={{ backgroundColor: "#6366f1" }}
                  onClick={handleCreateClient}
                >
                  Create Client
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Client"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
