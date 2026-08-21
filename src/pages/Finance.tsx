import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"

import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"

import { api } from "../api/client"

import ConfirmModal from "../components/common/ConfirmModal"

interface Expense {
  id: string

  amount: number

  category: string

  description: string

  date: string

  created_by: string

  created_at: string
}

export default function Finance() {
  const { user } = useAuth()

  const [expenses, setExpenses] = useState<Expense[]>([])

  const [summary, setSummary] = useState<{
    total_spent: number
    count: number
    by_category: Record<string, number>
  } | null>(null)

  const [showForm, setShowForm] = useState(false)

  const [loading, setLoading] = useState(true)

  const [companyBudget, setCompanyBudget] = useState(0)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState("")

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const isFinance = user?.role === "super_admin" || (user?.department && user.department.toLowerCase().includes("finance"))

  useEffect(() => {
    if (isFinance) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [isFinance])

  const loadData = async () => {
    try {
      const [expensesData, summaryData, budgetData] = await Promise.all([
        api.get<Expense[]>("/expenses").catch((e) => {
          console.error("Failed to load expenses", e)
          return []
        }),

        api
          .get<{
            total_spent: number
            count: number
            by_category: Record<string, number>
          }>("/expenses/summary")
          .catch((e) => {
            console.error("Failed to load expense summary", e)
            return null
          }),
          
        api.get<{ budget: number }>("/expenses/budget").catch(() => ({ budget: 0 })),
      ])

      setExpenses(expensesData)

      setSummary(summaryData)
      
      if (budgetData) {
        setCompanyBudget(budgetData.budget)
      }
    } catch (e) {
      console.error("Finance load error", e)

      setExpenses([])

      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category || !formData.date) return

    try {
      await api.post("/expenses", {
        amount: parseFloat(formData.amount),

        category: formData.category,

        description: formData.description,

        date: formData.date,
      })

      setFormData({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      })

      setShowForm(false)

      loadData()
    } catch (e) {
      console.error("Failed to add expense", e)

      alert("Failed to add expense")
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await api.delete(`/expenses/${itemToDelete}`)

      setExpenses(expenses.filter((e) => e.id !== itemToDelete))

      setItemToDelete(null)

      loadData()
    } catch (e) {
      console.error("Failed to delete expense", e)

      alert("Failed to delete expense")
    }
  }

  const saveBudget = async () => {
    try {
      const b = parseFloat(budgetInput)
      if (isNaN(b)) return
      await api.post("/expenses/budget", { amount: b })
      setCompanyBudget(b)
      setEditingBudget(false)
    } catch (e) {
      console.error("Failed to save budget", e)
      alert("Failed to save budget")
    }
  }

  const totalSpent =
    summary?.total_spent ?? expenses.reduce((sum, e) => sum + e.amount, 0)

  const categoryCount = summary?.by_category
    ? Object.keys(summary.by_category).length
    : new Set(expenses.map((e) => e.category)).size

  if (loading) {
    return (
      <div className="page flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "#6b7280" }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!isFinance) {
    return (
      <div className="page">
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-base font-semibold text-white mb-1">
            Access Denied
          </h3>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Only super admin and Finance department can view this section
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Finance
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Track expenses and spending
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary text-xs gap-1.5"
        >
          <Plus size={12} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #10b981 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} style={{ color: "#10b981" }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Company Budget
            </span>
            <button
              onClick={() => {
                setBudgetInput(companyBudget.toString())
                setEditingBudget(!editingBudget)
              }}
              className="ml-auto text-xs text-indigo-400 hover:text-indigo-300"
            >
              Edit
            </button>
          </div>
          {editingBudget ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="input text-sm py-1 px-2 w-24"
                placeholder="Budget"
              />
              <button
                onClick={saveBudget}
                className="btn btn-primary py-1 px-3 text-xs"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              ₹{companyBudget.toLocaleString()}
            </div>
          )}
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #ef4444 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} style={{ color: "#ef4444" }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Total Spent
            </span>
          </div>
          <div
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            ₹{totalSpent.toLocaleString()}
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #6366f1 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} style={{ color: "#6366f1" }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Total Expenses
            </span>
          </div>
          <div
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {expenses.length}
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #10b981 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: "#10b981" }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Categories
            </span>
          </div>
          <div
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {categoryCount}
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Avg. Expense
            </span>
          </div>
          <div
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            ₹
            {expenses.length > 0
              ? Math.round(totalSpent / expenses.length).toLocaleString()
              : 0}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-sm font-semibold text-white">Recent Expenses</h3>
        </div>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign
              size={40}
              style={{ color: "#334155" }}
              className="mx-auto mb-3"
            />
            <p className="font-medium text-white mb-1">No expenses yet</p>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Add your first expense to get started
            </p>
          </div>
        ) : (
          <div
            className="divide-y"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)" }}
                  >
                    <DollarSign size={18} style={{ color: "#ef4444" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {expense.category}
                    </p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>
                      {expense.description || "No description"} •{" "}
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    ₹{expense.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => setItemToDelete(expense.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
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
                  <h2 className="text-lg font-bold text-white">Add Expense</h2>
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                    Record a new expense
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
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                    style={{ borderColor: "#252d4a" }}
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "#94a3b8" }}
                  >
                    Category
                  </label>
                  <input
                    className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                    style={{ borderColor: "#252d4a" }}
                    placeholder="e.g. Marketing, Office, Travel"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "#94a3b8" }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                    style={{ borderColor: "#252d4a" }}
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "#94a3b8" }}
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                    style={{ borderColor: "#252d4a" }}
                    rows={2}
                    placeholder="Add a note..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
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
                    Add Expense
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
