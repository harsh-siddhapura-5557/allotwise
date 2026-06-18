'use client'

import { useEffect, useState } from 'react'
import { formatDate, exportToCSV } from '@/lib/utils'
import { Search, Plus, Edit2, Trash2, Download, Users } from 'lucide-react'

interface Member {
  id: string
  fullName: string
  panNumber: string
  mobile: string
  notes: string
  createdAt: string
  _count: { applications: number }
  upiIds: Array<{ id: string; upiId: string }>
}

const emptyForm = { fullName: '', panNumber: '', mobile: '', notes: '' }

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load(q = '') {
    setLoading(true)
    fetch(`/api/members?search=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(setMembers)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(m: Member) {
    setEditing(m)
    setForm({ fullName: m.fullName, panNumber: m.panNumber, mobile: m.mobile, notes: m.notes || '' })
    setError('')
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/members/${editing.id}` : '/api/members'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to save')
        return
      }
      setShowModal(false)
      load(search)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(m: Member) {
    if (!confirm(`Delete member "${m.fullName}"? This cannot be undone.`)) return
    await fetch(`/api/members/${m.id}`, { method: 'DELETE' })
    load(search)
  }

  function handleExport() {
    exportToCSV(members.map(m => ({
      Name: m.fullName,
      PAN: m.panNumber,
      Mobile: m.mobile,
      'UPI Count': m.upiIds.length,
      'Applications': m._count.applications,
      Notes: m.notes,
      'Joined': formatDate(m.createdAt),
    })), 'members')
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, PAN, mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-head">#</th>
                <th className="table-head">Name</th>
                <th className="table-head">PAN Number</th>
                <th className="table-head">Mobile</th>
                <th className="table-head">UPI IDs</th>
                <th className="table-head">Applications</th>
                <th className="table-head">Notes</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No members found</p>
                    <button onClick={openAdd} className="mt-2 text-blue-600 text-sm hover:underline">Add your first member</button>
                  </td>
                </tr>
              ) : (
                members.map((m, i) => (
                  <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                    <td className="table-cell text-muted-foreground text-xs">{i + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-sm font-semibold flex-shrink-0">
                          {m.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-sm">{m.panNumber}</td>
                    <td className="table-cell text-muted-foreground">{m.mobile}</td>
                    <td className="table-cell">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                        {m.upiIds.length}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm">{m._count.applications}</span>
                    </td>
                    <td className="table-cell text-muted-foreground text-sm max-w-[160px] truncate">{m.notes || '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(m)} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Member' : 'Add Member'}</h2>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rajesh Patel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PAN Number *</label>
                <input
                  required
                  value={form.panNumber}
                  onChange={e => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  value={form.mobile}
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
