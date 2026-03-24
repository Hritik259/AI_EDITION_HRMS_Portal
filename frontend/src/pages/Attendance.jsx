import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, CalendarCheck, X, ChevronDown, Sparkles, Edit2, Trash2, Calendar, Filter } from 'lucide-react'
import Modal from '../components/Modal'
import api from '../api/axios'

const STATUS_OPTIONS = ['present', 'absent', 'late', 'half_day']
const STATUS_LABELS  = { present: 'Present', absent: 'Absent', late: 'Late', half_day: 'Half Day' }
const STATUS_COLORS  = {
  present:  { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  text: '#34d399' },
  absent:   { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   text: '#f87171' },
  late:     { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  text: '#fbbf24' },
  half_day: { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  text: '#a5b4fc' },
}

function AttendanceForm({ employees, onSubmit, onCancel, loading }) {
  const [form, setForm]           = useState({ employee_id: '', date: today(), status: 'present', note: '' })
  const [errors, setErrors]       = useState({})
  const [genLoading, setGenLoading] = useState(false)

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.employee_id) e.employee_id = 'Select employee'
    if (!form.date)        e.date        = 'Select date'
    if (!form.status)      e.status      = 'Select status'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const generateNote = async () => {
    if (!form.employee_id || !form.status) return
    setGenLoading(true)
    try {
      const res = await api.post('/api/ai/generate-note', {
        employee_id: parseInt(form.employee_id),
        status: form.status
      })
      set('note', res.data.note)
    } catch {}
    finally { setGenLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Employee *</label>
        <div className="relative">
          <select
            value={form.employee_id}
            onChange={e => set('employee_id', e.target.value)}
            className={`input appearance-none ${errors.employee_id ? 'border-red-500' : ''}`}
            style={{ background: '#1f1f30' }}
          >
            <option value="">Select employee...</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.full_name} — {e.employee_id}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        {errors.employee_id && <p className="text-red-400 text-xs mt-1">{errors.employee_id}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={`input ${errors.date ? 'border-red-500' : ''}`}
            style={{ colorScheme: 'dark' }}
          />
          {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Status *</label>
          <div className="relative">
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="input appearance-none"
              style={{ background: '#1f1f30' }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-gray-400">Note (optional)</label>
          <button onClick={generateNote} disabled={!form.employee_id || genLoading}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors">
            {genLoading
              ? <><div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div> Generating...</>
              : <><Sparkles size={12} /> AI Generate Note</>
            }
          </button>
        </div>
        <textarea
          value={form.note}
          onChange={e => set('note', e.target.value)}
          placeholder="Optional note about this attendance..."
          rows={3}
          className="input resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={() => { if (validate()) onSubmit({ ...form, employee_id: parseInt(form.employee_id) }) }}
          disabled={loading} className="btn-primary flex-1 justify-center">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
            : <><CalendarCheck size={15} /> Mark Attendance</>
          }
        </button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

export default function Attendance() {
  const [records, setRecords]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRec, setEditRec]     = useState(null)
  const [deleteRec, setDeleteRec] = useState(null)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast]         = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/attendance', { params: { limit: 200 } })
      setRecords(res.data)
    } catch { showToast('Failed to load attendance records', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchRecords()
    api.get('/api/employees', { params: { limit: 200 } })
      .then(r => setEmployees(r.data))
      .catch(() => {})
  }, [fetchRecords])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await api.post('/api/attendance', form)
      showToast('Attendance marked!')
      setModalOpen(false)
      fetchRecords()
    } catch (e) { showToast(e.message || 'Failed to mark attendance', 'error') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (data) => {
    setSaving(true)
    try {
      await api.put(`/api/attendance/${editRec.id}`, { status: data.status, note: data.note })
      showToast('Attendance updated!')
      setEditRec(null)
      fetchRecords()
    } catch (e) { showToast(e.message || 'Failed to update', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/attendance/${deleteRec.id}`)
      showToast('Record deleted')
      setDeleteRec(null)
      fetchRecords()
    } catch (e) { showToast(e.message || 'Failed to delete', 'error') }
  }

  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = STATUS_OPTIONS.reduce((acc, s) => ({
    ...acc, [s]: records.filter(r => r.status === s).length
  }), {})

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-slide-up shadow-2xl ${
          toast.type === 'error'
            ? 'bg-red-500/20 border border-red-500/40 text-red-300'
            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
        }`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Attendance</h2>
          <p className="text-gray-400 text-sm mt-1">{records.length} total records</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Mark Attendance
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {STATUS_OPTIONS.map(s => {
          const c = STATUS_COLORS[s]
          return (
            <button key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: statusFilter === s ? c.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${statusFilter === s ? c.border : '#1e1e30'}`
              }}>
              <p className="text-2xl font-bold" style={{ color: statusFilter === s ? c.text : '#fff' }}>{counts[s]}</p>
              <p className="text-xs text-gray-500 mt-1">{STATUS_LABELS[s]}</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="input pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input pl-9 min-w-36 appearance-none"
            style={{ background: '#1a1a2e' }}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter('') }} className="btn-secondary">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e30', background: '#0f0f1a' }}>
                {['Employee', 'Date', 'Status', 'Note', 'Marked At', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a2a' }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse bg-gray-800" style={{ width: `${50 + j * 8}%` }}></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                    <Calendar size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No attendance records found</p>
                    <p className="text-xs mt-1">Mark attendance for your team members</p>
                  </td>
                </tr>
              ) : (
                filtered.map(rec => {
                  const c = STATUS_COLORS[rec.status] || STATUS_COLORS.present
                  return (
                    <tr key={rec.id}
                      className="transition-colors hover:bg-white/[0.02] group"
                      style={{ borderBottom: '1px solid #1a1a2a' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: `hsl(${rec.employee_id * 47 % 360}, 60%, 40%)` }}>
                            {rec.employee_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{rec.employee_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{rec.employee_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-gray-500" />
                          <span className="text-sm text-gray-300">{new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                          {STATUS_LABELS[rec.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 max-w-xs truncate">{rec.note || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditRec(rec)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => setDeleteRec(rec)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Mark Attendance">
        <AttendanceForm employees={employees} onSubmit={handleCreate} onCancel={() => setModalOpen(false)} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editRec} onClose={() => setEditRec(null)} title="Edit Attendance Record">
        {editRec && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/5 text-sm text-gray-300">
              Editing record for <strong className="text-white">{editRec.employee_name}</strong> on <strong className="text-white">{new Date(editRec.date).toLocaleDateString()}</strong>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
              <select
                defaultValue={editRec.status}
                onChange={e => setEditRec(r => ({ ...r, status: e.target.value }))}
                className="input appearance-none"
                style={{ background: '#1f1f30' }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Note</label>
              <textarea
                defaultValue={editRec.note || ''}
                onChange={e => setEditRec(r => ({ ...r, note: e.target.value }))}
                rows={3}
                className="input resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => handleUpdate(editRec)} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditRec(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteRec} onClose={() => setDeleteRec(null)} title="Delete Record" width="max-w-sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-300">
              Delete attendance record for <strong>{deleteRec?.employee_name}</strong> on <strong>{deleteRec?.date}</strong>?
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="btn-danger flex-1 justify-center">
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => setDeleteRec(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
