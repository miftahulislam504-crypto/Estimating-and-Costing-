import React, { useState, useMemo } from 'react'
import {
  Database, Search, RefreshCw, Plus, RotateCcw,
  Pencil, Trash2, Check, X
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useCostDBStore }  from '@/store/costDBStore'
import { Button, Badge, SectionHeader, EmptyState, Input, Select } from '@/components/ui'
import type { CostDBEntry } from '@/types'

const TYPE_TABS = [
  { id: 'all',       label: 'সব',         color: 'text-surface-300' },
  { id: 'material',  label: 'উপকরণ',     color: 'text-blue-400' },
  { id: 'labor',     label: 'শ্রম',       color: 'text-emerald-400' },
  { id: 'equipment', label: 'যন্ত্রপাতি', color: 'text-amber-400' },
] as const

type TabType = 'all' | 'material' | 'labor' | 'equipment'

const CATEGORY_LABELS: Record<string, string> = {
  cement: 'সিমেন্ট', sand: 'বালি', stone: 'পাথর', brick: 'ইট',
  steel: 'রড/স্টিল', paint: 'পেইন্ট', tile: 'টাইলস', other: 'অন্যান্য',
  labor: 'শ্রমিক', equipment: 'যন্ত্র',
}

export function CostDBDashboard() {
  const { activeProject }               = useProjectStore()
  const { getSnapshot, updateRate, resetEntry, resetAll, addCustomEntry, deleteEntry } = useCostDBStore()

  const project  = activeProject()
  const [tab, setTab]       = useState<TabType>('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId]  = useState<string | null>(null)
  const [editVal, setEditVal] = useState(0)

  if (!project) return (
    <EmptyState icon={<Database size={28} />} title="কোনো প্রজেক্ট নেই" description="Dashboard থেকে প্রজেক্ট খুলুন।" />
  )

  const snapshot = getSnapshot(project!.id, project!.region)
  const entries  = snapshot.entries

  const filtered = useMemo(() => {
    let list = tab === 'all' ? entries : entries.filter(e => e.type === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.nameBn.includes(q) ||
        e.category.includes(q)
      )
    }
    return list
  }, [entries, tab, search])

  // Stats
  const customized = entries.filter(e => e.userRate !== undefined).length
  const materials  = entries.filter(e => e.type === 'material').length
  const labors     = entries.filter(e => e.type === 'labor').length
  const equipment  = entries.filter(e => e.type === 'equipment').length

  function startEdit(entry: CostDBEntry) {
    setEditId(entry.id)
    setEditVal(entry.userRate ?? entry.baseRate)
  }

  function commitEdit(projectId: string, entryId: string) {
    updateRate(projectId, entryId, editVal)
    setEditId(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Cost Database"
        subtitle={`${project!.name} — Bangladesh Material / Labor / Equipment Rates`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<RotateCcw size={14} />}
              onClick={() => { if (confirm('সব Rate reset করবেন?')) resetAll(project!.id) }}>
              Reset All
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
              Custom Rate
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'মোট Entries',  value: entries.length,  color: 'bg-surface-800 border-surface-700' },
          { label: 'উপকরণ',        value: materials,        color: 'bg-blue-900/20 border-blue-800/40' },
          { label: 'শ্রম',          value: labors,           color: 'bg-emerald-900/20 border-emerald-800/40' },
          { label: 'যন্ত্রপাতি',   value: equipment,        color: 'bg-amber-900/20 border-amber-800/40' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
            <p className="text-xl font-display font-bold text-white">{s.value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info bar */}
      {customized > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-amber-900/20 border border-amber-800/40 rounded-xl flex items-center justify-between">
          <span className="text-sm text-amber-400">
            <span className="font-semibold">{customized}টি</span> Rate কাস্টমাইজ করা হয়েছে
          </span>
          <Button variant="ghost" size="sm" icon={<RotateCcw size={12} />}
            onClick={() => resetAll(project!.id)}>
            সব Reset
          </Button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rates... (cement, mason...)"
            className="w-full bg-surface-900 border border-surface-700 rounded-lg pl-9 pr-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1 bg-surface-900 border border-surface-700 rounded-lg p-1">
          {TYPE_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.id
                  ? 'bg-brand-600 text-white'
                  : `${t.color} hover:bg-surface-800`
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-900/80 border-b border-surface-700">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-xs text-surface-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2.5 text-center text-xs text-surface-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Base Rate ৳</th>
                <th className="px-4 py-2.5 text-right text-xs text-surface-500 uppercase tracking-wider">Your Rate ৳</th>
                <th className="px-4 py-2.5 text-center text-xs text-surface-500 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/40">
              {filtered.map(entry => {
                const isEditing   = editId === entry.id
                const isCustomized = entry.userRate !== undefined
                const effectiveRate = entry.userRate ?? entry.baseRate

                return (
                  <tr key={entry.id} className={`hover:bg-surface-750/50 transition-colors group ${isCustomized ? 'bg-amber-900/5' : ''}`}>
                    <td className="px-4 py-2.5">
                      <TypeBadge type={entry.type} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="text-surface-100 font-medium text-sm">{entry.name}</p>
                        <p className="text-surface-500 text-xs">{entry.nameBn}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-surface-400 bg-surface-700/50 px-2 py-0.5 rounded">
                        {CATEGORY_LABELS[entry.category] ?? entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-surface-400 text-xs font-mono">
                      {entry.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-surface-400">
                      {entry.baseRate.toLocaleString('en-BD')}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editVal}
                            onChange={e => setEditVal(+e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitEdit(project!.id, entry.id)
                              if (e.key === 'Escape') setEditId(null)
                            }}
                            autoFocus
                            className="w-24 bg-surface-900 border border-brand-500 rounded px-2 py-1 text-right font-mono text-sm text-white focus:outline-none"
                          />
                          <button onClick={() => commitEdit(project!.id, entry.id)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-brand-600 text-white hover:bg-brand-500 transition-colors">
                            <Check size={12} />
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-surface-700 text-surface-400 hover:bg-surface-600 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(entry)}
                          className={`font-mono font-semibold hover:text-brand-300 transition-colors ${
                            isCustomized ? 'text-amber-300' : 'text-surface-200'
                          }`}
                        >
                          {effectiveRate.toLocaleString('en-BD')}
                          {isCustomized && <span className="ml-1 text-xs text-amber-500">✎</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(entry)}
                          className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-brand-400 hover:bg-surface-700 transition-colors">
                          <Pencil size={11} />
                        </button>
                        {isCustomized && (
                          <button onClick={() => resetEntry(project!.id, entry.id)}
                            title="Base rate-এ ফিরুন"
                            className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-amber-400 hover:bg-surface-700 transition-colors">
                            <RotateCcw size={11} />
                          </button>
                        )}
                        <button onClick={() => deleteEntry(project!.id, entry.id)}
                          className="w-6 h-6 flex items-center justify-center rounded text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-surface-500 text-sm">
              কোনো entry পাওয়া যায়নি
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-surface-600 mt-3 text-center">
        Rate-এ click করে সরাসরি edit করুন। হলুদ রং = কাস্টমাইজড।
        এই rates স্বয়ংক্রিয়ভাবে Rate Analysis-এ ব্যবহার হবে।
      </p>

      {/* Add custom rate modal */}
      {showAdd && (
        <AddCustomRateModal
          projectId={project!.id}
          onClose={() => setShowAdd(false)}
          onAdd={(entry) => { addCustomEntry(project!.id, entry); setShowAdd(false) }}
        />
      )}
    </div>
  )
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    material:  'bg-blue-900/40 text-blue-400 border border-blue-800/40',
    labor:     'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40',
    equipment: 'bg-amber-900/40 text-amber-400 border border-amber-800/40',
  }
  const labels: Record<string, string> = {
    material: 'উপকরণ', labor: 'শ্রম', equipment: 'যন্ত্র'
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[type] ?? 'bg-surface-700 text-surface-300'}`}>
      {labels[type] ?? type}
    </span>
  )
}

// ─── Add Custom Rate Modal ────────────────────────────────────────────────────

function AddCustomRateModal({
  projectId, onClose, onAdd
}: {
  projectId: string
  onClose:   () => void
  onAdd:     (entry: Omit<import('@/types').CostDBEntry, 'id' | 'updatedAt'>) => void
}) {
  const { activeProject } = useProjectStore()
  const project = activeProject()

  const [form, setForm] = useState({
    type:     'material' as 'material' | 'labor' | 'equipment',
    name:     '',
    nameBn:   '',
    unit:     'm³',
    baseRate: 0,
    category: 'other',
  })

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-800 border border-surface-700 rounded-2xl p-6 max-w-md w-full">
        <h3 className="font-display font-bold text-white text-lg mb-4">Custom Rate যোগ করুন</h3>
        <div className="space-y-3">
          <Select
            label="Type"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            options={[
              { value: 'material',  label: 'উপকরণ (Material)' },
              { value: 'labor',     label: 'শ্রম (Labor)' },
              { value: 'equipment', label: 'যন্ত্রপাতি (Equipment)' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="নাম (English)" value={form.name}   onChange={e => set('name',   e.target.value)} />
            <Input label="নাম (বাংলা)"   value={form.nameBn} onChange={e => set('nameBn', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Unit" value={form.unit}     onChange={e => set('unit',     e.target.value)} placeholder="m³, kg, day..." />
            <Input label="Rate ৳" type="number" value={form.baseRate} onChange={e => set('baseRate', +e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="ghost" className="flex-1" onClick={onClose}>বাতিল</Button>
          <Button className="flex-1" disabled={!form.name} onClick={() => onAdd({ ...form, region: project?.region ?? 'dhaka' })}>
            যোগ করুন
          </Button>
        </div>
      </div>
    </div>
  )
}
