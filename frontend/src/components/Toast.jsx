import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle }
  const colors = {
    success: { bg: '#0f2a1e', border: '#16a34a', text: '#4ade80', icon: '#22c55e' },
    error:   { bg: '#2a0f0f', border: '#dc2626', text: '#f87171', icon: '#ef4444' },
    warning: { bg: '#2a1f0f', border: '#d97706', text: '#fbbf24', icon: '#f59e0b' },
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(({ id, message, type }) => {
          const c = colors[type] || colors.success
          const Icon = icons[type] || CheckCircle
          return (
            <div key={id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-slide-up min-w-72 max-w-sm"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <Icon size={16} style={{ color: c.icon, flexShrink: 0 }} />
              <span style={{ color: c.text }} className="flex-1">{message}</span>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== id))}>
                <X size={14} style={{ color: c.text }} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
