import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{
              background: "#1a1b23",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239, 68, 68, 0.1)" }}
              >
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-md transition-colors text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <h3
              className="text-lg font-bold text-white mb-2"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {title}
            </h3>
            <p className="text-sm text-gray-400 mb-6">{message}</p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-smooth"
                style={{
                  background: "transparent",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-smooth bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
