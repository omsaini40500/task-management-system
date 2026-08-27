import React, { useState, useEffect } from "react"
import ClientDashboard from "./ClientDashboard"
import { api } from "../api/client"

export default function PerformanceMarketing() {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")

  useEffect(() => {
    api.get<any>("/users")
      .then(res => {
        const usersArray = res.items || res || []
        const clientUsers = usersArray.filter((u: any) => u.role === "client")
        setClients(clientUsers)
        if (clientUsers.length > 0) {
          setSelectedClientId(clientUsers[0].id)
        }
      })
      .catch(err => console.error("Failed to load clients", err))
  }, [])

  return (
    <div className="page">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Marketing Dashboard</h1>
          <p className="text-gray-400">Internal view for the Performance Marketing team.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300">Select Client:</label>
          <select 
            className="input bg-gray-800 border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      {selectedClientId ? (
        <ClientDashboard isEmployee={true} targetClientId={selectedClientId} />
      ) : (
        <div className="text-center py-10 text-gray-400">No clients available</div>
      )}
    </div>
  )
}
