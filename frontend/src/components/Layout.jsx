import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, Bot, Sparkles, Bell } from 'lucide-react'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, desc: 'Overview & analytics' },
  { to: '/employees',  label: 'Employees',  icon: Users,           desc: 'Manage team members' },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck,   desc: 'Track daily presence' },
]

export default function Layout() {
  const location = useLocation()
  const pageTitle = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'HRMS'

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #0d0d18 100%)', borderRight: '1px solid #1e1e30' }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #1e1e30' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">HRMS Portal</p>
              <div className="flex items-center gap-1">
                <Sparkles size={10} className="text-indigo-400" />
                <p className="text-xs text-indigo-400 font-medium">AI Edition v2.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-3">Menu</p>
          {navItems.map(({ to, label, icon: Icon, desc }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                border: '1px solid rgba(99,102,241,0.3)',
              } : {}}
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-indigo-600' : 'bg-gray-800 group-hover:bg-gray-700'
                  }`}>
                    <Icon size={15} className={isActive ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className={`font-medium leading-tight ${isActive ? 'text-white' : ''}`}>{label}</p>
                    <p className="text-xs text-gray-600 leading-tight">{desc}</p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #1e1e30' }}>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              AD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@hrms.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-8 py-4"
          style={{ background: '#0a0a0f', borderBottom: '1px solid #1e1e30' }}>
          <div>
            <h1 className="text-lg font-bold text-white">{pageTitle}</h1>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={18} className="text-gray-400 cursor-pointer hover:text-white transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              AD
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
