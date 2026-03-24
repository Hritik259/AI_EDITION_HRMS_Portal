import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Clock, TrendingUp, Zap, ChevronRight, AlertTriangle, Bot, Send, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import api from '../api/axios'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 text-xs" style={{ background: '#1a1a2e', border: '1px solid #2a2a3e' }}>
        <p className="text-gray-300 font-medium mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }}></span>
            <span className="text-gray-400">{p.name}:</span>
            <span className="text-white font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats]       = useState(null)
  const [risks, setRisks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg]   = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: 'Hi! I\'m your AI HR assistant. Ask me anything about your team.' }
  ])
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, riskRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/ai/risk'),
      ])
      setStats(statsRes.data)
      setRisks(riskRes.data.slice(0, 4))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const sendChat = async () => {
    if (!chatMsg.trim()) return
    const question = chatMsg.trim()
    setChatMsg('')
    setChatHistory(h => [...h, { role: 'user', text: question }])
    setChatLoading(true)
    try {
      const res = await api.post('/api/ai/query', { question })
      setChatHistory(h => [...h, { role: 'assistant', text: res.data.answer }])
    } catch {
      setChatHistory(h => [...h, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const riskColors = { critical: '#ef4444', high: '#f97316', medium: '#eab308' }
  const riskLabels = { critical: 'Critical', high: 'High Risk', medium: 'Medium' }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Good {getGreeting()}, Admin 👋</h2>
          <p className="text-gray-400 text-sm mt-1">Here's what's happening with your team today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          Live — {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees"    value={stats?.total_employees}       icon={Users}     color="indigo" sub="Active staff" />
        <StatCard label="Present Today"      value={stats?.present_today}         icon={UserCheck} color="emerald" sub={`${stats?.attendance_rate_today ?? 0}% rate`} />
        <StatCard label="Absent Today"       value={stats?.absent_today}          icon={UserX}     color="red"    sub="Unexcused" />
        <StatCard label="Late This Week"     value={stats?.late_today}            icon={Clock}     color="amber"  sub="Needs attention" />
      </div>

      {/* Chart + Weekly Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* 7-day bar chart */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">7-Day Attendance Overview</h3>
              <p className="text-xs text-gray-500 mt-0.5">Present, absent, and late per day</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-400/10 px-3 py-1.5 rounded-lg">
              <TrendingUp size={12} />
              This week
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.week_trend || []} barSize={10} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '12px' }} />
              <Bar dataKey="present" name="Present" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="absent"  name="Absent"  fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="late"    name="Late"    fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly summary card */}
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Weekly Summary</h3>
            <Sparkles size={14} className="text-indigo-400" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-sm text-gray-400">This week (present)</span>
              <span className="text-xl font-bold text-white">{stats?.attendance_this_week ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-sm text-gray-400">Daily average</span>
              <span className="text-xl font-bold text-white">{stats?.avg_daily_attendance ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-sm text-gray-400">Departments</span>
              <span className="text-xl font-bold text-white">{stats?.total_departments ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-400">Attendance rate</span>
              <span className="text-xl font-bold text-indigo-400">{stats?.attendance_rate_today ?? 0}%</span>
            </div>
          </div>
          {/* Mini progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Today's rate</span>
              <span>{stats?.attendance_rate_today ?? 0}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-800">
              <div className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${stats?.attendance_rate_today ?? 0}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Employees + AI Risk Panel */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent employees */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">Recent Employees</h3>
              <p className="text-xs text-gray-500 mt-0.5">Latest team members added</p>
            </div>
            <a href="/employees" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight size={12} />
            </a>
          </div>
          <div className="space-y-3">
            {stats?.recent_employees?.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No employees yet. Add your first employee!</p>
            )}
            {stats?.recent_employees?.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/5"
                style={{ border: '1px solid #1e1e30' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: `hsl(${emp.id * 47 % 360}, 60%, 45%)` }}>
                    {emp.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{emp.full_name}</p>
                    <p className="text-xs text-gray-500">{emp.department} · {emp.employee_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{emp.total_present_days}</p>
                  <p className="text-xs text-gray-500">days present</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + AI Risk */}
        <div className="flex flex-col gap-4">

          {/* Quick Actions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Manage Employees', sub: 'Add or update records', href: '/employees', color: '#6366f1' },
                { label: 'Mark Attendance',  sub: 'Daily check-in',         href: '/attendance', color: '#10b981' },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5 group"
                  style={{ border: '1px solid #1e1e30' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${a.color}22` }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: a.color }}></div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.sub}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* AI Risk Panel */}
          {risks.length > 0 && (
            <div className="card p-5 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-orange-400" />
                <h3 className="text-sm font-semibold text-white">AI Risk Alerts</h3>
              </div>
              <div className="space-y-2">
                {risks.map(r => (
                  <div key={r.employee_id} className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ background: `${riskColors[r.risk_level]}11`, border: `1px solid ${riskColors[r.risk_level]}33` }}>
                    <div>
                      <p className="text-xs font-medium text-white">{r.full_name}</p>
                      <p className="text-xs text-gray-500">{r.attendance_rate}% rate</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${riskColors[r.risk_level]}22`, color: riskColors[r.risk_level] }}>
                      {riskLabels[r.risk_level]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chatbot FAB */}
      <button onClick={() => setChatOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-40 transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        <Bot size={22} className="text-white" />
      </button>

      {/* Chatbot window */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 rounded-2xl flex flex-col z-40 shadow-2xl animate-slide-up overflow-hidden"
          style={{ background: '#13131f', border: '1px solid #2a2a3e', height: '420px' }}>
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1e1e30', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600">
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">HR Assistant</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-400">AI-powered</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white'
                    : 'text-gray-300'
                }`}
                  style={m.role === 'user'
                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
                    : { background: '#1e1e30', border: '1px solid #2a2a3e' }}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#1e1e30' }}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3" style={{ borderTop: '1px solid #1e1e30' }}>
            <div className="flex gap-2">
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask about your team..."
                className="input flex-1 text-xs py-2"
              />
              <button onClick={sendChat} disabled={!chatMsg.trim() || chatLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors flex-shrink-0">
                <Send size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
