import { motion } from "framer-motion"

export default function ImportExport() {
  return (
    <div className="page">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-12 text-center"
      >
        <div className="text-4xl mb-3">📥📤</div>
        <h3
          className="text-base font-semibold text-white mb-1"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Import / Export
        </h3>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          This feature is coming soon
        </p>
      </motion.div>
    </div>
  )
}
