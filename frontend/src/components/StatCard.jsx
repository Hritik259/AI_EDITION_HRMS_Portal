export default function StatCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    indigo: { bg: 'rgba(99,102,241,0.15)', icon: 'bg-indigo-600', text: 'text-indigo-400', border: 'rgba(99,102,241,0.25)' },
    emerald:{ bg: 'rgba(16,185,129,0.15)', icon: 'bg-emerald-600', text: 'text-emerald-400', border: 'rgba(16,185,129,0.25)' },
    red:    { bg: 'rgba(239,68,68,0.15)',  icon: 'bg-red-600',     text: 'text-red-400',     border: 'rgba(239,68,68,0.25)' },
    amber:  { bg: 'rgba(245,158,11,0.15)', icon: 'bg-amber-600',   text: 'text-amber-400',   border: 'rgba(245,158,11,0.25)' },
    purple: { bg: 'rgba(139,92,246,0.15)', icon: 'bg-purple-600',  text: 'text-purple-400',  border: 'rgba(139,92,246,0.25)' },
  }
  const c = colors[color] || colors.indigo

  return (
    <div className="rounded-2xl p-5 animate-fade-in"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-1">{value ?? '—'}</p>
        <p className="text-sm font-medium text-gray-400">{label}</p>
        {sub && <p className={`text-xs mt-1 ${c.text}`}>{sub}</p>}
      </div>
    </div>
  )
}
