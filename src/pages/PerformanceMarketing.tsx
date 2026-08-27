import React from "react"
import ClientDashboard from "./ClientDashboard"

export default function PerformanceMarketing() {
  return (
    <div className="page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Performance Marketing Dashboard</h1>
        <p className="text-gray-400">Internal view for the Performance Marketing team. Scorecard updates can be made here.</p>
      </div>
      <ClientDashboard isEmployee={true} />
    </div>
  )
}
