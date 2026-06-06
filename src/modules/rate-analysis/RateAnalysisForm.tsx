import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useRateAnalysisStore } from '@/store/rateAnalysisStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { RateAnalysisItem, RateComponent } from '@/types'

interface Props {
  projectId: string
  editItem?: RateAnalysisItem
  onClose:   () => void
}

const CATEGORY_OPTIONS = [
  { value: 'material',  label: 'উপকরণ (Material)' },
  { value: 'labor',     label: 'শ্রম (Labor)' },
  { value: 'equipment', label: 'যন্ত্রপাতি (Equipment)' },
  { value: 'overhead',  label: 'ওভারহেড (Overhead)' },
  { value: 'profit',    label: 'মুনাফা (Profit)' },
]

const UNIT_OPTIONS = ['m³','m²','m','kg','MT','nos','bag','day','hour','ltr','set','ls']
  .map(v => ({ value: v, label: v }))

function makeComp(): RateComponent {
  return { id: crypto.randomUUID(), category: 'material', description: '', unit: 'bag', quantity: 1, unitRate: 0, amount: 0 }
}

export function RateAnalysisForm({ projectId, editItem, onClose }: Props) {
  const { addItem, updateItem } = useRateAnalysisStore()
  const isEdit = !!editItem

  const [code,     setCode]     = useState(editItem?.code     ?? '')
  const [workItem, setWorkItem] = useState(editItem?.workItem ?? '')
  const [unit,     setUnit]     = useState(editItem?.unit     ?? 'm³')
  const [notes,    setNotes]    = useState(editItem?.notes    ?? '')
  const [components, setComponents] = useState<RateComponent[]>(
    editItem?.components ?? [makeComp()]
  )

  function updateComp(id: string, key: keyof RateComponent, value: string | number) {
    setComponents(cs => cs.map(c => {
      if (c.id !== id) return c
      const updated = { ...c, [key]: value }
      updated.amount = updated.quantity * updated.unitRate
      return updated
    }))
  }

  function addComp()     { setComponents(cs => [...cs, makeComp()]) }
  function removeComp(id: string) { setComponents(cs => cs.filter(c => c.id !== id)) }

  const totalRate = components.reduce((s, c) => s + c.quantity * c.unitRate, 0)

  function handleSave() {
    if (!workItem.trim()) return
    const comps = components.map(c => ({ ...c, amount: c.quantity * c.unitRate }))
    const item: RateAnalysisItem = {
      id:         editItem?.id ?? crypto.randomUUID(),
      code:       code || `RA-${Date.now()}`,
      workItem,
      unit,
      components: comps,
      totalRate,
      isTemplate: false,
      notes:      notes || undefined,
    }
    if (isEdit) updateItem(projectId, item)
    else        addItem(projectId, item)
    onClose()
  }

  return (
    <Modal
      open
      title={isEdit ? 'Rate Analysis সম্পাদনা' : 'নতুন Rate Analysis'}
      onClose={onClose}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header info */}
        <div className="grid grid-cols-3 gap-3">
          <Input label="Code" value={code} onChange={e => setCode(e.target.value)} placeholder="RA-C01" />
          <div className="col-span-2">
            <Input label="Work Item *" value={workItem} onChange={e => setWorkItem(e.target.value)} placeholder="যেমন: 1 m³ RCC M20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Unit" value={unit} onChange={e => setUnit(e.target.value)} options={UNIT_OPTIONS} />
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="অতিরিক্ত মন্তব্য..." />
        </div>

        {/* Components table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-brand-400 uppercase tracking-wider">Components (উপাদান)</p>
            <Button variant="outline" size="sm" icon={<Plus size={13} />} onClick={addComp}>
              Row যোগ
            </Button>
          </div>

          <div className="bg-surface-900 border border-surface-700 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-surface-700">
                <tr>
                  <th className="px-3 py-2 text-left text-surface-500">Category</th>
                  <th className="px-3 py-2 text-left text-surface-500">Description</th>
                  <th className="px-3 py-2 text-center text-surface-500">Unit</th>
                  <th className="px-3 py-2 text-right text-surface-500">Qty</th>
                  <th className="px-3 py-2 text-right text-surface-500">Rate ৳</th>
                  <th className="px-3 py-2 text-right text-surface-500">Amount ৳</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {components.map(comp => (
                  <tr key={comp.id}>
                    <td className="px-2 py-1.5">
                      <select
                        value={comp.category}
                        onChange={e => updateComp(comp.id, 'category', e.target.value)}
                        className="bg-transparent text-xs text-surface-300 focus:outline-none border border-surface-700 rounded px-1.5 py-1 w-full"
                      >
                        {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-surface-900">{o.label}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={comp.description}
                        onChange={e => updateComp(comp.id, 'description', e.target.value)}
                        placeholder="Cement, Mason..."
                        className="bg-transparent border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 w-full focus:outline-none focus:border-brand-500"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <select
                        value={comp.unit}
                        onChange={e => updateComp(comp.id, 'unit', e.target.value)}
                        className="bg-transparent text-xs text-surface-300 focus:outline-none border border-surface-700 rounded px-1 py-1"
                      >
                        {UNIT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-surface-900">{o.label}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" step="0.01" value={comp.quantity}
                        onChange={e => updateComp(comp.id, 'quantity', +e.target.value)}
                        className="bg-transparent border border-surface-700 rounded px-2 py-1 text-xs text-right font-mono text-surface-200 w-20 focus:outline-none focus:border-brand-500"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" step="1" value={comp.unitRate}
                        onChange={e => updateComp(comp.id, 'unitRate', +e.target.value)}
                        className="bg-transparent border border-surface-700 rounded px-2 py-1 text-xs text-right font-mono text-surface-200 w-24 focus:outline-none focus:border-brand-500"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-surface-100">
                      {(comp.quantity * comp.unitRate).toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeComp(comp.id)}
                        className="w-6 h-6 flex items-center justify-center rounded text-surface-600 hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-surface-600 bg-surface-800/60">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-surface-400 uppercase">
                    Total Unit Rate per {unit}
                  </td>
                  <td className="px-3 py-2 text-right font-display font-bold text-brand-400 text-base">
                    ৳ {totalRate.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 border-t border-surface-700">
          <Button variant="ghost" className="flex-1" onClick={onClose}>বাতিল</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!workItem.trim()}>
            {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
