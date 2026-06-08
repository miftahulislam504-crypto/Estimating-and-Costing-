import React, { useState } from 'react'
import {
  FileText, Zap, Download, Pencil,
  ChevronDown, ChevronRight, Building2, User
} from 'lucide-react'
import { useProjectStore }  from '@/store/projectStore'
import { useBOQStore }      from '@/store/boqStore'
import { useTenderStore, buildTenderFromBOQ } from '@/store/tenderStore'
import { Button, StatCard, SectionHeader, EmptyState, Input, Badge } from '@/components/ui'
import type { TenderType, TenderItem } from '@/types'

const TENDER_TYPES: { id: TenderType; label: string; labelBn: string; desc: string; factor: string; color: string }[] = [
  {
    id: 'engineer', label: "Engineer's Estimate",  labelBn: 'প্রকৌশলী অনুমান',
    desc: 'Base estimate — BOQ rates',     factor: '×1.00', color: 'text-brand-400',
  },
  {
    id: 'owner',    label: "Owner's Estimate",    labelBn: 'মালিক অনুমান',
    desc: 'Owner budget — 5% over base',  factor: '×1.05', color: 'text-amber-400',
  },
  {
    id: 'contractor', label: 'Contractor Bid',   labelBn: 'ঠিকাদার দরপত্র',
    desc: 'Market rate — 12% over base',  factor: '×1.12', color: 'text-purple-400',
  },
]

const BOQ_CAT_LABELS: Record<string, string> = {
  earthwork: 'Earthwork', concrete: 'Concrete', reinforcement: 'Reinforcement',
  masonry: 'Masonry', finishing: 'Finishing', mep: 'MEP', external: 'External',
}

const fmt  = (n: number) => '৳ ' + Math.round(n).toLocaleString('en-BD')

export function TenderDashboard() {
  const { activeProject }  = useProjectStore()
  const { getBOQ }         = useBOQStore()
  const { getPackage, setPackage, updateItem, updateMeta } = useTenderStore()

  const project = activeProject()
  const [activeType, setActiveType] = useState<TenderType>('engineer')
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set())
  const [editMeta, setEditMeta]     = useState(false)

  if (!project) return (
    <EmptyState
      icon={<FileText size={28} />}
      title="কোনো প্রজেক্ট নেই"
      description="Dashboard থেকে প্রজেক্ট খুলুন।"
    />
  )

  const boq = getBOQ(project.id)
  const pkg  = getPackage(project.id, activeType)

  function handleGenerate() {
    if (!boq || boq.items.length === 0) {
      alert('প্রথমে BOQ তৈরি করুন।')
      return
    }
    const newPkg = buildTenderFromBOQ(
      project.id, boq,
      project.name, project.location,
      project.owner, project.consultant,
      activeType,
      project.costSettings.contingencyPct,
    )
    setPackage(newPkg)
  }

  // Group items by category
  const grouped = pkg
    ? Object.entries(
        pkg.items.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = []
          acc[item.category].push(item)
          return acc
        }, {} as Record<string, TenderItem[]>)
      )
    : []

  const toggleCat = (cat: string) =>
    setCollapsed(s => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n })

  const activeDef = TENDER_TYPES.find(t => t.id === activeType)!

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Tender & Bid Package"
        subtitle={`${project.name} — Engineer / Owner / Contractor Estimate`}
        action={
          <Button size="sm" icon={<Zap size={14} />} onClick={handleGenerate}>
            Generate {activeDef.labelBn}
          </Button>
        }
      />

      {/* Tender type selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {TENDER_TYPES.map(t => {
          const existingPkg = getPackage(project.id, t.id)
          return (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeType === t.id
                  ? 'bg-brand-900/30 border-brand-700/60 shadow-glow'
                  : 'bg-surface-800 border-surface-700 hover:border-surface-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-sm font-semibold ${t.color}`}>{t.label}</span>
                <span className="text-xs font-mono text-surface-500">{t.factor}</span>
              </div>
              <p className="text-xs text-surface-500 mb-1">{t.labelBn}</p>
              <p className="text-xs text-surface-600">{t.desc}</p>
              {existingPkg && (
                <p className={`text-xs font-mono mt-2 ${t.color}`}>
                  {fmt(existingPkg.grandTotal)}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Compare all three */}
      {TENDER_TYPES.every(t => getPackage(project.id, t.id)) && (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
            তুলনামূলক সারসংক্ষেপ
          </p>
          <div className="grid grid-cols-3 gap-4">
            {TENDER_TYPES.map(t => {
              const p = getPackage(project.id, t.id)!
              return (
                <div key={t.id} className="text-center">
                  <p className={`text-xs font-medium mb-1 ${t.color}`}>{t.label}</p>
                  <p className="text-lg font-display font-bold text-white">{fmt(p.grandTotal)}</p>
                  <p className="text-xs text-surface-500">{p.items.length} items</p>
                </div>
              )
            })}
          </div>
          {/* Difference bars */}
          {(() => {
            const eng = getPackage(project.id, 'engineer')!.grandTotal
            const own = getPackage(project.id, 'owner')!.grandTotal
            const con = getPackage(project.id, 'contractor')!.grandTotal
            return (
              <div className="mt-3 pt-3 border-t border-surface-700 grid grid-cols-2 gap-3 text-center text-xs">
                <div>
                  <span className="text-surface-500">Owner vs Engineer: </span>
                  <span className="text-amber-400 font-mono">+{fmt(own - eng)}</span>
                </div>
                <div>
                  <span className="text-surface-500">Contractor vs Engineer: </span>
                  <span className="text-purple-400 font-mono">+{fmt(con - eng)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Empty */}
      {!pkg ? (
        <EmptyState
          icon={<FileText size={28} />}
          title={`${activeDef.label} তৈরি হয়নি`}
          description="BOQ থেকে Auto Generate করুন। তিন ধরনের Tender Package তৈরি হবে।"
          action={
            <Button icon={<Zap size={16} />} onClick={handleGenerate}>
              Generate {activeDef.labelBn}
            </Button>
          }
        />
      ) : (
        <>
          {/* Package header */}
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-5 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${activeDef.color}`}>{activeDef.label}</span>
                  <Badge variant="info">{pkg.tenderNo}</Badge>
                </div>
                <p className="text-xs text-surface-500">
                  Prepared: {new Date(pkg.preparedDate).toLocaleDateString('en-BD')} •
                  Valid: {pkg.validityDays} days
                </p>
              </div>
              <button
                onClick={() => setEditMeta(!editMeta)}
                className="flex items-center gap-1 text-xs text-surface-500 hover:text-brand-400 transition-colors"
              >
                <Pencil size={12} />
                Edit Info
              </button>
            </div>

            {editMeta ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'projectName', label: 'Project Name', val: pkg.projectName },
                  { key: 'location',    label: 'Location',     val: pkg.location },
                  { key: 'owner',       label: 'Owner',        val: pkg.owner },
                  { key: 'consultant',  label: 'Consultant',   val: pkg.consultant },
                  { key: 'preparedBy',  label: 'Prepared By',  val: pkg.preparedBy },
                ].map(f => (
                  <Input
                    key={f.key}
                    label={f.label}
                    value={f.val}
                    onChange={e => updateMeta(project.id, activeType, { [f.key]: e.target.value })}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { icon: <Building2 size={11} />, label: 'Project',    val: pkg.projectName },
                  { icon: <Building2 size={11} />, label: 'Location',   val: pkg.location },
                  { icon: <User      size={11} />, label: 'Owner',      val: pkg.owner || '—' },
                  { icon: <User      size={11} />, label: 'Consultant', val: pkg.consultant || '—' },
                ].map(f => (
                  <div key={f.label} className="bg-surface-900/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1 text-surface-500 mb-0.5">
                      {f.icon}
                      <span>{f.label}</span>
                    </div>
                    <p className="text-surface-200 font-medium truncate">{f.val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Direct Cost"   value={fmt(pkg.directCost)}   color="teal"   />
            <StatCard label="Contingency"   value={fmt(pkg.contingency)}  color="amber"  />
            <StatCard label="Grand Total"   value={fmt(pkg.grandTotal)}   color="green"  />
            <StatCard label="Total Items"   value={pkg.items.length}      color="purple" />
          </div>

          {/* Grouped items */}
          <div className="space-y-3">
            {grouped.map(([cat, items], gi) => {
              const subtotal = items.reduce((s, i) => s + i.amount, 0)
              return (
                <div key={cat} className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {collapsed.has(cat)
                        ? <ChevronRight size={15} className="text-surface-500" />
                        : <ChevronDown  size={15} className="text-surface-500" />}
                      <span className="text-sm font-semibold text-surface-200">
                        {String.fromCharCode(65 + gi)}. {BOQ_CAT_LABELS[cat] ?? cat}
                      </span>
                      <Badge variant="default">{items.length}</Badge>
                    </div>
                    <span className="font-mono font-semibold text-surface-200 text-sm">{fmt(subtotal)}</span>
                  </button>

                  {!collapsed.has(cat) && (
                    <div className="overflow-x-auto border-t border-surface-700">
                      <table className="w-full text-xs">
                        <thead className="bg-surface-900/60">
                          <tr>
                            <th className="px-3 py-2 text-left text-surface-500 w-16">Item No</th>
                            <th className="px-3 py-2 text-left text-surface-500">Description</th>
                            <th className="px-3 py-2 text-center text-surface-500 w-14">Unit</th>
                            <th className="px-3 py-2 text-right text-surface-500 w-24">Quantity</th>
                            <th className="px-3 py-2 text-right text-surface-500 w-28">Rate ৳</th>
                            <th className="px-3 py-2 text-right text-surface-500 w-32">Amount ৳</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-700/30">
                          {items.map(item => (
                            <tr key={item.id} className="hover:bg-surface-750/40">
                              <td className="px-3 py-2 font-mono text-surface-500">{item.itemNo}</td>
                              <td className="px-3 py-2 text-surface-200">{item.description}</td>
                              <td className="px-3 py-2 text-center text-surface-400 font-mono">{item.unit}</td>
                              <td className="px-3 py-2 text-right font-mono text-surface-300">
                                {item.quantity.toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <RateCell
                                  value={item.unitRate}
                                  onCommit={v => updateItem(project.id, activeType, item.id, v)}
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-surface-100">
                                {Math.round(item.amount).toLocaleString('en-BD')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-surface-700 bg-surface-900/40">
                          <tr>
                            <td colSpan={5} className="px-3 py-2 text-right text-xs font-medium text-surface-500">
                              Subtotal
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-surface-200">
                              {Math.round(subtotal).toLocaleString('en-BD')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Grand total */}
            <div className={`border rounded-xl px-5 py-4 flex justify-between items-center ${
              activeDef.id === 'engineer'   ? 'bg-brand-900/30  border-brand-700/40' :
              activeDef.id === 'owner'      ? 'bg-amber-900/20  border-amber-700/40' :
              'bg-purple-900/20 border-purple-700/40'
            }`}>
              <div>
                <p className="text-sm font-medium text-surface-400">{activeDef.label} — Grand Total</p>
                <p className="text-xs text-surface-500">Contingency সহ</p>
              </div>
              <p className={`text-3xl font-display font-bold ${activeDef.color}`}>
                {fmt(pkg.grandTotal)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Inline rate cell ─────────────────────────────────────────────────────────

function RateCell({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)

  if (editing) return (
    <input
      type="number"
      value={val}
      onChange={e => setVal(+e.target.value)}
      onBlur={() => { onCommit(val); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { onCommit(val); setEditing(false) } }}
      autoFocus
      className="w-24 bg-surface-900 border border-brand-500 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:outline-none"
    />
  )

  return (
    <button
      onClick={() => { setVal(value); setEditing(true) }}
      className="font-mono text-surface-300 hover:text-brand-300 transition-colors underline underline-offset-2 decoration-dotted"
    >
      {value.toLocaleString('en-BD')}
    </button>
  )
}
