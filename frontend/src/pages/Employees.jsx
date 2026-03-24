import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, User, Mail, Phone, Building2, Briefcase, X, ChevronDown } from 'lucide-react'
import Modal from '../components/Modal'
import api from '../api/axios'

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Product']


const Field = React.memo(function Field({
  label,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  error
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type={type}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`input pl-9 ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
})

function EmployeeForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    employee_id: '', full_name: '', email: '', department: '', position: '', phone: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.employee_id?.trim()) e.employee_id = 'Required'
    if (!form.full_name?.trim()) e.full_name = 'Required'
    if (!form.email?.trim()) e.email = 'Required'
    if (!form.department?.trim()) e.department = 'Required'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => { if (validate()) onSubmit(form) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        <Field
          label="Employee ID *"
          icon={User}
          placeholder="e.g. EMP0042"
          value={form.employee_id}
          onChange={(e) => set('employee_id', e.target.value)}
          error={errors.employee_id}
        />

        <Field
          label="Full Name *"
          icon={User}
          placeholder="Jane Doe"
          value={form.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          error={errors.full_name}
        />

      </div>

      <Field
        label="Email Address *"
        icon={Mail}
        type="email"
        placeholder="jane@company.com"
        value={form.email}
        onChange={(e) => set('email', e.target.value)}
        error={errors.email}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Department *</label>
          <div className="relative">
            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
            <select
              value={form.department || ''}
              onChange={e => set('department', e.target.value)}
              className={`input pl-9 appearance-none ${errors.department ? 'border-red-500' : ''}`}
              style={{ background: '#1f1f30' }}
            >
              <option value="">Select dept...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          {errors.department && <p className="text-red-400 text-xs mt-1">{errors.department}</p>}
        </div>

        <Field
          label="Position"
          icon={Briefcase}
          placeholder="Software Engineer"
          value={form.position}
          onChange={(e) => set('position', e.target.value)}
          error={errors.position}
        />
      </div>

      <Field
        label="Phone"
        icon={Phone}
        placeholder="+91 9999999999"
        value={form.phone}
        onChange={(e) => set('phone', e.target.value)}
        error={errors.phone}
      />

      <div className="flex gap-3 pt-2">
        <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Saving...' : initial ? 'Update Employee' : 'Add Employee'}
        </button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

export default function Employees() {
  const [employees, setEmployees]     = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [search, setSearch]           = useState('')
  const [deptFilter, setDeptFilter]   = useState('')
  const [modalOpen, setModalOpen]     = useState(false)
  const [editEmp, setEditEmp]         = useState(null)
  const [deleteEmp, setDeleteEmp]     = useState(null)
  const [toast, setToast]             = useState(null)
  const [trendData, setTrendData]     = useState({})

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.q = search
      if (deptFilter) params.department = deptFilter
      const res = await api.get('/api/employees', { params })
      setEmployees(res.data)
    } catch { showToast('Failed to load employees', 'error') }
    finally { setLoading(false) }
  }, [search, deptFilter])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  useEffect(() => {
    api.get('/api/employees/departments')
      .then(r => setDepartments(r.data.departments))
      .catch(() => {})
  }, [])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await api.post('/api/employees', form)
      showToast('Employee added successfully!')
      setModalOpen(false)
      fetchEmployees()
    } catch (e) { showToast(e.message || 'Failed to add employee', 'error') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (form) => {
    setSaving(true)
    try {
      await api.put(`/api/employees/${editEmp.id}`, form)
      showToast('Employee updated!')
      setEditEmp(null)
      fetchEmployees()
    } catch (e) { showToast(e.message || 'Failed to update', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/employees/${deleteEmp.id}`)
      showToast('Employee deleted')
      setDeleteEmp(null)
      fetchEmployees()
    } catch (e) { showToast(e.message || 'Failed to delete', 'error') }
  }

  const loadTrend = async (empId) => {
    if (trendData[empId]) return
    try {
      const res = await api.get(`/api/ai/trend/${empId}`)
      setTrendData(t => ({ ...t, [empId]: res.data }))
    } catch {}
  }

  const statusColors = { improving: '#10b981', declining: '#ef4444', stable: '#6366f1' }

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
          <h2 className="text-2xl font-bold text-white">Employees</h2>
          <p className="text-gray-400 text-sm mt-1">{employees.length} team members</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID or email..."
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
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="input pl-9 min-w-40 appearance-none"
            style={{ background: '#1a1a2e' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        {(search || deptFilter) && (
          <button onClick={() => { setSearch(''); setDeptFilter('') }} className="btn-secondary">
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
                {['Employee', 'Department', 'Position', 'Contact', 'Present Days', 'Trend', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a2a' }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse bg-gray-800" style={{ width: `${60 + j * 10}%` }}></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-500">
                    <User size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No employees found</p>
                    <p className="text-xs mt-1">Try adjusting your search or add a new employee</p>
                  </td>
                </tr>
              ) : (
                employees.map(emp => {
                  const trend = trendData[emp.id]
                  return (
                    <tr key={emp.id}
                      className="transition-colors hover:bg-white/[0.02] group"
                      style={{ borderBottom: '1px solid #1a1a2a' }}
                      onMouseEnter={() => loadTrend(emp.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: `hsl(${emp.id * 47 % 360}, 60%, 40%)` }}>
                            {emp.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{emp.full_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{emp.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">{emp.position || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-400">{emp.email}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{emp.total_present_days}</span>
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {trend ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: `${statusColors[trend.trend]}22`,
                              color: statusColors[trend.trend]
                            }}>
                            {trend.trend === 'improving' ? '↑' : trend.trend === 'declining' ? '↓' : '→'} {trend.trend}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditEmp(emp)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => setDeleteEmp(emp)}
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

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Employee">
        <EmployeeForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editEmp} onClose={() => setEditEmp(null)} title="Edit Employee">
        <EmployeeForm initial={editEmp} onSubmit={handleUpdate} onCancel={() => setEditEmp(null)} loading={saving} />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteEmp} onClose={() => setDeleteEmp(null)} title="Delete Employee" width="max-w-sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-300">
              Are you sure you want to delete <strong>{deleteEmp?.full_name}</strong>? This will also remove all their attendance records.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="btn-danger flex-1 justify-center">
              <Trash2 size={14} /> Yes, Delete
            </button>
            <button onClick={() => setDeleteEmp(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}