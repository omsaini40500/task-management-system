import React, { useState, useEffect } from "react"
import { api } from "../api/client"
import { useAuth } from "../context/AuthContext"
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
import { TrendingUp, ShoppingCart, DollarSign, Target, Activity, Download } from "lucide-react"

const weeklyData = [
  { name: "Week 1\n01-09th", spend: 1054, purchases: 15, roas: 2.1, revenue: 2258 },
  { name: "Week 2\n10th-16th", spend: 827, purchases: 20, roas: 2.4, revenue: 1992 },
  { name: "Week 3\n17th-23rd", spend: 834, purchases: 35, roas: 3.8, revenue: 3153 },
]

const scorecardData = [
  { icon: DollarSign, metric: "Spend (USD)", w1: "$0", w2: "$0", w3: "$0", change: "0%", type: "positive" },
  { icon: ShoppingCart, metric: "Purchases", w1: "0", w2: "0", w3: "0", change: "0%", type: "positive" },
  { icon: DollarSign, metric: "Revenue (USD)", w1: "$0", w2: "$0", w3: "$0", change: "0%", type: "positive" },
  { icon: TrendingUp, metric: "ROAS (x)", w1: "0x", w2: "0x", w3: "0x", change: "0%", type: "positive" },
  { icon: ShoppingCart, metric: "Add to Cart", w1: "0", w2: "0", w3: "0", change: "0%", type: "positive" },
  { icon: Activity, metric: "Checkouts Initiated", w1: "0", w2: "0", w3: "0", change: "0%", type: "positive" },
  { icon: Target, metric: "ATC → Checkouts %", w1: "0%", w2: "0%", w3: "0%", change: "0 pp", type: "positive" },
  { icon: Target, metric: "ATC → Purchases %", w1: "0%", w2: "0%", w3: "0%", change: "0 pp", type: "positive" },
  { icon: Target, metric: "Checkouts → Purchases %", w1: "0%", w2: "0%", w3: "0%", change: "0 pp", type: "positive" },
]

export default function ClientDashboard({ isEmployee = false, targetClientId }: { isEmployee?: boolean, targetClientId?: string }) {
  const { user } = useAuth()
  const clientId = isEmployee ? targetClientId : user?.id
  const [data, setData] = useState(scorecardData)
  const [isEditing, setIsEditing] = useState(false)
  const [chartData, setChartData] = useState(weeklyData)
  const [funnelData, setFunnelData] = useState({ atc: "0", checkouts: "0", purchases: "0", atcToCheckouts: "0%", atcToCheckoutsChange: "0%", atcToPurchases: "0%", atcToPurchasesChange: "0%" }); const [bannerData, setBannerData] = useState({ roas: "0x", roasChange: "0%", purchases: "0%", spend: "0%" })

  useEffect(() => {
    try {
      const getNum = (val: string) => Number(String(val).replace(/[^0-9.-]+/g,"")) || 0;
      
      const spendRow = data.find(d => d.metric.includes("Spend"));
      const purRow = data.find(d => d.metric.includes("Purchases") && !d.metric.includes("%"));
      const roasRow = data.find(d => d.metric.includes("ROAS"));
      const revRow = data.find(d => d.metric.includes("Revenue"));
      const atcRow = data.find(d => d.metric.includes("Add to Cart"));
      const checkoutsRow = data.find(d => d.metric.includes("Checkouts Initiated"));
      const atcToCheckoutsRow = data.find(d => d.metric.includes("ATC → Checkouts"));
      const atcToPurchasesRow = data.find(d => d.metric.includes("ATC → Purchases"));
      
      if (spendRow && purRow && roasRow && revRow) {
        setChartData([
          { name: "Week 1", spend: getNum(spendRow.w1), purchases: getNum(purRow.w1), roas: getNum(roasRow.w1), revenue: getNum(revRow.w1) },
          { name: "Week 2", spend: getNum(spendRow.w2), purchases: getNum(purRow.w2), roas: getNum(roasRow.w2), revenue: getNum(revRow.w2) },
          { name: "Week 3", spend: getNum(spendRow.w3), purchases: getNum(purRow.w3), roas: getNum(roasRow.w3), revenue: getNum(revRow.w3) },
        ])
      }
      
      if (atcRow && checkoutsRow && purRow) {
        setFunnelData({
          atc: atcRow.w3,
          checkouts: checkoutsRow.w3,
          purchases: purRow.w3,
          atcToCheckouts: atcToCheckoutsRow?.w3 || "0%",
          atcToCheckoutsChange: atcToCheckoutsRow ? `Up from ${atcToCheckoutsRow.w1} in Week 1` : "",
          atcToPurchases: atcToPurchasesRow?.w3 || "0%",
          atcToPurchasesChange: atcToPurchasesRow ? `Up from ${atcToPurchasesRow.w1} in Week 1` : ""
        })
      }
      
      if (roasRow && purRow && spendRow) {
        setBannerData({
          roas: roasRow.w3,
          roasChange: roasRow.change,
          purchases: purRow.change,
          spend: spendRow.change
        })
      }
    } catch (e) {
      console.error(e)
    }
  }, [data])

  useEffect(() => {
    if (clientId) {
      api.get<any>(`/clients/${clientId}/scorecard`)
        .then(res => {
          if (res?.data && res.data.length > 0) {
            setData(res.data)
          } else {
            setData(scorecardData)
          }
        })
        .catch(err => console.error(err))
    }
  }, [clientId])

  const handleSave = () => {
    if (clientId) {
      api.put(`/clients/${clientId}/scorecard`, { data })
        .then(() => setIsEditing(false))
        .catch(err => console.error(err))
    }
  }

  const handleChange = (index: number, field: string, value: string) => {
    const newData = [...data]
    newData[index] = { ...newData[index], [field]: value }
    setData(newData)
  }

  const handleDownloadCSV = () => {
    const headers = ["Metrics", "Week 1", "Week 2", "Week 3", "Change"]
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        `"${row.metric}","${row.w1}","${row.w2}","${row.w3}","${row.change}"`
      )
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "performance_scorecard.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(99,102,241,0.2)] border border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-gray-300 mb-2 tracking-tight">PERFORMANCE EFFICIENCY ACCELERATED</h1>
          <p className="text-indigo-200/80 font-medium text-sm max-w-xl leading-relaxed">Spend remained controlled while conversion volume, revenue and ROAS expanded materially across all funnels.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-[130px] text-center backdrop-blur-md shadow-xl hover:-translate-y-1 transition-transform duration-300">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{bannerData.roas}</div>
            <div className="text-[11px] tracking-widest text-indigo-200 font-bold mt-2 uppercase">Week 3 ROAS</div>
            <div className="text-[10px] text-emerald-400/80 mt-1 font-medium tracking-wide">Change: {bannerData.roasChange}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-[130px] text-center backdrop-blur-md shadow-xl hover:-translate-y-1 transition-transform duration-300">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{bannerData.purchases}</div>
            <div className="text-[11px] tracking-widest text-indigo-200 font-bold mt-2 uppercase">Purchases</div>
            <div className="text-[10px] text-blue-400/80 mt-1 font-medium tracking-wide">Change vs W1</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-[130px] text-center backdrop-blur-md shadow-xl hover:-translate-y-1 transition-transform duration-300">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">{bannerData.spend}</div>
            <div className="text-[11px] tracking-widest text-indigo-200 font-bold mt-2 uppercase">Spend</div>
            <div className="text-[10px] text-purple-400/80 mt-1 font-medium tracking-wide">Change vs W1</div>
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
          className="bg-[#0B0D17]/90 backdrop-blur-2xl p-6 border border-white/10 rounded-3xl shadow-xl hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all duration-500"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">EFFICIENCY IMPROVEMENT OVER TIME</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
          className="bg-[#0B0D17]/90 backdrop-blur-2xl p-6 border border-white/10 rounded-3xl shadow-xl hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all duration-500"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">REVENUE & ROAS TREND</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}x`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: 'white', fontWeight: 500 }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue (USD)" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS (x)" stroke="#34d399" strokeWidth={4} dot={{ r: 6, fill: "#10b981", strokeWidth: 3, stroke: "#0B0D17" }} activeDot={{ r: 8, fill: "#34d399", strokeWidth: 0, stroke: "#0B0D17", filter: "drop-shadow(0px 0px 5px rgba(52,211,153,0.8))" }} />
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
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 w-full max-w-sm mx-auto mt-4 group">
            {/* Level 1 */}
            <div className="w-full bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-t-xl rounded-b-md p-4 text-center border-t border-white/10 shadow-lg hover:brightness-110 transition-all duration-300" style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">{funnelData.atc}</div>
              <div className="text-xs text-gray-300 font-medium tracking-wide uppercase mt-1">Add to Carts</div>
            </div>
            
            {/* Level 2 */}
            <div className="w-[85%] bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-md p-4 text-center shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:brightness-110 transition-all duration-300" style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" }}>
              <div className="text-2xl font-black text-white">{funnelData.checkouts}</div>
              <div className="text-xs text-blue-100 font-medium tracking-wide uppercase mt-1">Checkouts Initiated</div>
            </div>

            {/* Level 3 */}
            <div className="w-[68%] bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-b-xl rounded-t-md p-4 text-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:brightness-110 transition-all duration-300" style={{ clipPath: "polygon(0 0, 100% 0, 90% 100%, 10% 100%)" }}>
              <div className="text-2xl font-black text-white">{funnelData.purchases}</div>
              <div className="text-xs text-emerald-100 font-medium tracking-wide uppercase mt-1">Purchases</div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-colors duration-300">
              <div className="text-xs text-gray-400 mb-1 font-semibold tracking-wider">ATC → CHECKOUTS</div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{funnelData.atcToCheckouts}</div>
              <div className="text-xs text-green-400 mt-1">{funnelData.atcToCheckoutsChange}</div>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:border-emerald-500/30 transition-colors duration-300">
              <div className="text-xs text-gray-400 mb-1 font-semibold tracking-wider">ATC → PURCHASES</div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{funnelData.atcToPurchases}</div>
              <div className="text-xs text-emerald-400 mt-1">{funnelData.atcToPurchasesChange}</div>
            </div>
          </div>
        </motion.div>

        {/* Scorecard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0B0D17]/90 backdrop-blur-2xl p-6 border border-white/10 rounded-3xl shadow-xl hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all duration-500"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">KEY PERFORMANCE SCORECARD</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadCSV} className="flex items-center gap-2 text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors font-medium">
                <Download size={14} />
                Export CSV
              </button>
              {isEmployee && (
                isEditing ? (
                  <button onClick={handleSave} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                    Save Changes
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">
                    Edit Scorecard
                  </button>
                )
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-gray-400 bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-5 py-4 font-bold rounded-tl-xl">METRICS</th>
                  <th className="px-5 py-4 font-bold text-right">WEEK 1<br/><span className="text-gray-500 font-normal">01-09th</span></th>
                  <th className="px-5 py-4 font-bold text-right">WEEK 2<br/><span className="text-gray-500 font-normal">10th-16th</span></th>
                  <th className="px-5 py-4 font-bold text-right bg-indigo-500/10 text-indigo-300">WEEK 3<br/><span className="text-indigo-400/50 font-normal">17th-23rd</span></th>
                  <th className="px-5 py-4 font-bold text-right rounded-tr-xl">W1 → W3<br/><span className="text-gray-500 font-normal">CHANGE</span></th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const Icon = row.icon || DollarSign; // fallback icon if not saved properly
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 font-medium text-gray-200 flex items-center gap-3 whitespace-nowrap">
                        <div className="p-1.5 bg-white/5 rounded-md group-hover:bg-indigo-500/20 transition-colors">
                          <DollarSign size={14} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        {row.metric}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-400 font-medium">
                        {isEditing ? <input value={row.w1} onChange={(e) => handleChange(i, 'w1', e.target.value)} className="w-20 bg-gray-900/50 border border-gray-700 px-2 py-1 rounded-md text-right focus:border-indigo-500 focus:outline-none" /> : row.w1}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-400 font-medium">
                        {isEditing ? <input value={row.w2} onChange={(e) => handleChange(i, 'w2', e.target.value)} className="w-20 bg-gray-900/50 border border-gray-700 px-2 py-1 rounded-md text-right focus:border-indigo-500 focus:outline-none" /> : row.w2}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-white bg-indigo-500/5 shadow-[inset_2px_0_0_rgba(99,102,241,0.2)]">
                        {isEditing ? <input value={row.w3} onChange={(e) => handleChange(i, 'w3', e.target.value)} className="w-20 bg-indigo-900/50 border border-indigo-500/50 px-2 py-1 rounded-md text-right focus:border-indigo-400 focus:outline-none text-white" /> : row.w3}
                      </td>
                      <td className={`px-5 py-4 text-right font-bold ${row.change?.includes('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isEditing ? <input value={row.change} onChange={(e) => handleChange(i, 'change', e.target.value)} className="w-20 bg-gray-900/50 border border-gray-700 px-2 py-1 rounded-md text-right focus:border-indigo-500 focus:outline-none" /> : row.change}
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
