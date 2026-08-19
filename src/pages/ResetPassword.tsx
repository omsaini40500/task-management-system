import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { api } from "../api/client"

interface ResetForm {
  email: string
  token: string
  new_password: string
  confirm_password: string
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const { register, handleSubmit, watch } = useForm<ResetForm>({
    defaultValues: {
      email: searchParams.get("email") || "",
      token: searchParams.get("token") || "",
    },
  })

  const password = watch("new_password")

  useEffect(() => {
    const token = searchParams.get("token")
    const email = searchParams.get("email")
    if (!token || !email) {
      setError("Invalid or expired reset link")
    }
  }, [searchParams])

  const onSubmit = async (data: ResetForm) => {
    if (data.new_password !== data.confirm_password) {
      setError("Passwords do not match")
      return
    }
    if (data.new_password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setError("")
    try {
      await api.post("/auth/reset-password", {
        email: data.email,
        token: data.token,
        new_password: data.new_password,
      })
      setSuccess(true)
      setTimeout(() => navigate("/login"), 3000)
    } catch (e: any) {
      setError(e?.detail || "Failed to reset password. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0b0f" }}>
      <div className="w-full max-w-[400px] px-6">
        <div className="glass p-8 rounded-2xl">
          {success ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle2 size={28} style={{ color: "#10b981" }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>Password reset successful</h2>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Your password has been updated. Redirecting to login...</p>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>Reset password</h1>
                <p className="text-sm" style={{ color: "#6b7280" }}>Create a new password for your account</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Email</label>
                  <input
                    {...register("email", { required: true })}
                    type="email"
                    className="input"
                    placeholder="you@flashcommunications.com"
                    readOnly
                    style={{ opacity: 0.7 }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>New Password</label>
                  <div className="relative">
                    <input
                      {...register("new_password", { required: true, minLength: 6 })}
                      type={showPw ? "text" : "password"}
                      className="input pr-10"
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#6b7280" }}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Confirm Password</label>
                  <div className="relative">
                    <input
                      {...register("confirm_password", { required: true })}
                      type={showConfirm ? "text" : "password"}
                      className="input pr-10"
                      placeholder="Re-enter password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#6b7280" }}>
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <input type="hidden" {...register("token")} />

                <button type="submit" className="btn btn-primary w-full justify-center py-2.5 mt-2">
                  <span>Reset Password</span>
                </button>
              </form>

              <button onClick={() => navigate("/login")} className="mt-3 w-full text-sm text-center transition-smooth" style={{ color: "#6b7280" }}>
                ← Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
