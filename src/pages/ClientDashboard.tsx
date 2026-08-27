import React from "react"
import { motion } from "framer-motion"
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, ShoppingCart, DollarSign, Target, Activity } from "lucide-react"

const weeklyData = [
  { name: "Week 1\n01-09th", spend: 1054, purchases: 15, roas: 2.1, revenue: 2258 },
  { name: "Week 2\n10th-16th", spend: 827, purchases: 20, roas: 2.4, revenue: 1992 },
  { name: "Week 3\n17th-23rd", spend: 834, purchases: 35, roas: 3.8, revenue: 3153 },
]

const scorecardData = [
  { icon: DollarSign, metric: "Spend (USD)", w1: "$1,054", w2: "$827", w3: "$834", change: "-21%", type: "positive" },
  { icon: ShoppingCart, metric: "Purchases", w1: "15", w2: "20", w3: "35", change: "+133%", type: "positive" },
  { icon: DollarSign, metric: "Revenue (USD)", w1: "$2,258", w2: "$1,992", w3: "$3,153", change: "+40%", type: "positive" },
  { icon: TrendingUp, metric: "ROAS (x)", w1: "2.1x", w2: "2.4x", w3: "3.8x", change: "+81%", type: "positive" },
  { icon: ShoppingCart, metric: "Add to Cart", w1: "317", w2: "324", w3: "425", change: "+34%", type: "positive" },
  { icon: Activity, metric: "Checkouts Initiated", w1: "45", w2: "43", w3: "77", change: "+71%", type: "positive" },
  { icon: Target, metric: "ATC ? Checkouts %", w1: "14%", w2: "13%", w3: "18%", change: "+4 pp", type: "positive" },
  { icon: Target, metric: "ATC ? Purchases %", w1: "5%", w2: "6%", w3: "8%", change: "+3 pp", type: "positive" },
  { icon: Target, metric: "Checkouts ? Purchases %", w1: "33%", w2: "47%", w3: "45%", change: "+12 pp", type: "positive" },
]

export default function ClientDashboard() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">PERFORMANCE EFFICIENCY ACCELERATED IN WEEK 3</h1>
          <p className="text-indigo-100">Spend remained controlled while conversion volume, revenue and ROAS expanded materially.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/10 rounded-xl p-4 min-w-[120px] text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">3.8x</div>
            <div className="text-xs text-indigo-100 font-medium mt-1">WEEK 3 ROAS</div>
            <div className="text-[10px] text-green-300 mt-1">Up 81% vs Week 1</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 min-w-[120px] text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">+133%</div>
            <div className="text-xs text-indigo-100 font-medium mt-1">PURCHASES</div>
            <div className="text-[10px] text-green-300 mt-1">vs Week 1</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 min-w-[120px] text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">-21%</div>
            <div className="text-xs text-indigo-100 font-medium mt-1">SPEND</div>
            <div className="text-[10px] text-green-300 mt-1">vs Week 1</div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 border border-gray-800"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">EFFICIENCY IMPROVEMENT OVER TIME</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickFormatter={(val) => `${val}x`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="spend" name="Spend (USD)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar yAxisId="left" dataKey="purchases" name="Purchases" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS (x)" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#111827" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-center">
            <span className="text-indigo-400 font-medium">Conversions +133% vs Week 1 while spend reduced 21%</span>
          </div>
        </motion.div>

        {/* Revenue & ROAS Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 border border-gray-800"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">REVENUE & ROAS TREND</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickFormatter={(val) => `${val}x`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue (USD)" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS (x)" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#111827" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
            <span className="text-emerald-400 font-medium">Week 3 delivered the strongest efficiency: 3.8x ROAS</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 border border-gray-800 flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">WEEK 3 FUNNEL PERFORMANCE</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center space-y-2 w-full max-w-sm mx-auto mt-4">
            {/* Level 1 */}
            <div className="w-full bg-[#1e293b] text-white rounded-t-lg rounded-b-md p-4 text-center border-b-[16px] border-transparent" style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}>
              <div className="text-3xl font-bold">425</div>
              <div className="text-xs text-gray-400">Add to Carts</div>
            </div>
            
            {/* Level 2 */}
            <div className="w-[85%] bg-[#3b82f6] text-white rounded-md p-4 text-center" style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" }}>
              <div className="text-2xl font-bold">77</div>
              <div className="text-xs text-blue-200">Checkouts Initiated</div>
            </div>

            {/* Level 3 */}
            <div className="w-[68%] bg-[#10b981] text-white rounded-b-lg rounded-t-md p-4 text-center" style={{ clipPath: "polygon(0 0, 100% 0, 90% 100%, 10% 100%)" }}>
              <div className="text-2xl font-bold">35</div>
              <div className="text-xs text-green-200">Purchases</div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex-1 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-sm text-gray-400 mb-1">ATC ? CHECKOUTS</div>
              <div className="text-2xl font-bold text-white">18%</div>
              <div className="text-xs text-green-400 mt-1">Up from 14% in Week 1</div>
            </div>
            <div className="flex-1 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-sm text-gray-400 mb-1">ATC ? PURCHASES</div>
              <div className="text-2xl font-bold text-white">8%</div>
              <div className="text-xs text-green-400 mt-1">Up from 5% in Week 1</div>
            </div>
          </div>
        </motion.div>

        {/* Scorecard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 border border-gray-800"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">KEY PERFORMANCE SCORECARD</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">METRICS</th>
                  <th className="px-4 py-3 font-medium text-right">WEEK 1<br/>01-09th</th>
                  <th className="px-4 py-3 font-medium text-right">WEEK 2<br/>10th-16th</th>
                  <th className="px-4 py-3 font-medium text-right bg-indigo-500/10 text-indigo-300">WEEK 3<br/>17th-23rd</th>
                  <th className="px-4 py-3 font-medium text-right rounded-tr-lg">W1 ? W3<br/>CHANGE</th>
                </tr>
              </thead>
              <tbody>
                {scorecardData.map((row, i) => {
                  const Icon = row.icon;
                  return (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-300 flex items-center gap-2">
                        <Icon size={14} className="text-gray-500" />
                        {row.metric}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{row.w1}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{row.w2}</td>
                      <td className="px-4 py-3 text-right font-medium text-white bg-indigo-500/5">{row.w3}</td>
                      <td className={`px-4 py-3 text-right font-medium ${row.type === 'positive' ? 'text-green-400' : 'text-green-400'}`}>
                        {row.change}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
