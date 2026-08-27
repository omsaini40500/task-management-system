import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Key,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import { homePathForRole } from "../lib/clientAccess"
import { api } from "../api/client"
import useNotificationSound from "../hooks/useNotificationSound"

type Step = "login" | "otp" | "forgot"

interface LoginForm {
  email: string
  password: string
  remember: boolean
}

interface ForgotForm {
  email: string
}

export default function Login() {
  const [step, setStep] = useState<Step>("login")
  const [showPw, setShowPw] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, reset } = useForm<LoginForm>()
  const forgotForm = useForm<ForgotForm>()

  const { play: playSound } = useNotificationSound()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setLoginError(null)
    
    let gpsCoords: string | undefined = undefined
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        })
        gpsCoords = `${position.coords.latitude},${position.coords.longitude}`
      } catch (e) {
        console.warn("GPS location failed or denied", e)
      }
    }
    
    try {
      const role = await login(data.email.trim().toLowerCase(), data.password, gpsCoords)
      if (role) {
        playSound()
        navigate(homePathForRole(role))
      }
    } catch (e: any) {
      setLoginError(e.message || "Invalid email or password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (data: ForgotForm) => {
    setLoading(true)
    try {
      await api.post("/auth/forgot-password", { email: data.email })
      playSound()
      setForgotSent(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative overflow-x-hidden overflow-y-auto bg-[#050505] font-['Inter'] py-12">
      {/* Dynamic Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-orb login-bg-orb-4" />
        <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Logo / Brand */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-5"
            >
              <Activity className="text-white w-7 h-7" />
            </motion.div>
            <h2
              className="text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Flash{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Agency
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 font-medium">
              High-Performance Workspace
            </p>
          </div>

          <div className="glass rounded-[28px] p-6 sm:p-8 md:p-10 shadow-[0_16px_64px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
            {/* Subtle highlight on top of card */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            <AnimatePresence mode="wait">
              {step === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8 text-center">
                    <h1
                      className="text-xl font-semibold text-white mb-2"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      Welcome back
                    </h1>
                    <p className="text-sm text-slate-400">
                      Enter your credentials to access your account
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <AnimatePresence>
                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                            marginBottom: 20,
                          }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm overflow-hidden"
                        >
                          <span className="mt-0.5 shrink-0">⚠️</span>
                          <span>{loginError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                          <input
                            {...register("email", { required: true })}
                            type="email"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all shadow-inner"
                            placeholder="name@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                          <input
                            {...register("password", { required: true })}
                            type={showPw ? "text" : "password"}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all shadow-inner"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                          >
                            {showPw ? (
                              <EyeOff className="w-[18px] h-[18px]" />
                            ) : (
                              <Eye className="w-[18px] h-[18px]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            {...register("remember")}
                            type="checkbox"
                            className="peer appearance-none w-4 h-4 border border-slate-600 rounded bg-transparent checked:bg-indigo-500 checked:border-indigo-500 transition-colors cursor-pointer"
                          />
                          <CheckCircle2
                            className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                            strokeWidth={3}
                          />
                        </div>
                        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                          Remember me
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("forgot")
                          setLoginError(null)
                        }}
                        className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full relative group overflow-hidden rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-[0.98] mt-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                      <div className="relative flex items-center justify-center py-3.5 gap-2">
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span className="font-medium text-white text-sm">
                              Sign In
                            </span>
                            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </div>
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "forgot" && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                      <Key className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h1
                      className="text-xl font-semibold text-white mb-2"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      Reset Password
                    </h1>
                    <p className="text-sm text-slate-400">
                      Enter your email and we'll send instructions
                    </p>
                  </div>

                  {forgotSent ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        Check your inbox
                      </h3>
                      <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                        If an account exists for that email, we've sent a
                        password reset link.
                      </p>
                      <button
                        onClick={() => {
                          setStep("login")
                          setForgotSent(false)
                          forgotForm.reset()
                        }}
                        className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
                      >
                        Return to login
                      </button>
                    </motion.div>
                  ) : (
                    <form
                      onSubmit={forgotForm.handleSubmit(handleForgotPassword)}
                      className="space-y-5"
                    >
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          {...forgotForm.register("email", { required: true })}
                          type="email"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all shadow-inner"
                          placeholder="you@flashagency.com"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative group overflow-hidden rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                      >
                        <div className="relative flex items-center justify-center py-3.5">
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span className="font-medium text-white text-sm">
                              Send Reset Link
                            </span>
                          )}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep("login")
                          forgotForm.reset()
                          setForgotSent(false)
                        }}
                        className="w-full py-3.5 text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to
                        sign in
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8 text-center">
                    <h1
                      className="text-xl font-semibold text-white mb-2"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      Two-step Verification
                    </h1>
                    <p className="text-sm text-slate-400">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <div className="flex justify-center gap-2 mb-8">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const newOtp = [...otp]
                          newOtp[i] = e.target.value
                          setOtp(newOtp)
                          if (e.target.value && i < 5)
                            (document.querySelectorAll(".otp-input")[
                              i + 1
                            ] as HTMLInputElement)?.focus()
                          if (!e.target.value && i > 0)
                            (document.querySelectorAll(".otp-input")[
                              i - 1
                            ] as HTMLInputElement)?.focus()
                        }}
                        className="otp-input w-11 h-12 md:w-12 md:h-14 text-center text-xl font-bold rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all shadow-inner"
                        placeholder="0"
                      />
                    ))}
                  </div>

                  <button className="w-full relative group overflow-hidden rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                    <div className="relative flex items-center justify-center py-3.5">
                      <span className="font-medium text-white text-sm">
                        Verify & Continue
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setStep("login")}
                    className="mt-4 w-full text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Return to
                    login
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-xs font-medium text-slate-500 mt-10 tracking-wide"
        >
          © {new Date().getFullYear()} FLASH COMMUNICATIONS
        </motion.p>
      </div>
    </div>
  )
}
